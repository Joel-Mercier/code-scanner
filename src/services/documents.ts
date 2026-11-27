import { CameraView } from "expo-camera";
import { Directory, File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as Print from "expo-print";
import PdfThumbnail from "react-native-pdf-thumbnail";
import { fileNameFor } from "@/domain/library/documents";
import type { DocItem, PageReading } from "@/domain/library/types";
import { createId } from "@/lib/id";
import { buildPdf } from "./pdf";

/** The PDF's name in every document's directory. */
const PDF = "document.pdf";
/** Photos are scaled down to this many pixels on their longest side. */
const MAX_SIDE = 2600;
const JPEG_QUALITY = 0.9;

const documentsRoot = () => new Directory(Paths.document, "documents");

const documentDirectory = (id: string) => new Directory(documentsRoot(), id);

/** One of a document's files, from its name. */
const documentFile = (id: string, name: string) =>
	new File(documentDirectory(id), name);

type DocRef = Pick<DocItem, "id" | "pages">;

/** Where a page's image is now (the app's container can move). */
export const pageUri = (doc: Pick<DocItem, "id">, page: string) =>
	documentFile(doc.id, page).uri;

export const pageUris = (doc: DocRef) =>
	doc.pages.map((page) => pageUri(doc, page));

export const pdfUri = (doc: Pick<DocItem, "id" | "pdf">) =>
	doc.pdf ? documentFile(doc.id, doc.pdf).uri : undefined;

/** The files a new or edited document ends up with. */
export type DocumentFiles = { pages: string[]; pdf: string; size: number };

/** Page names change with their content, so no cache shows an old page. */
const newPageName = (source: File) =>
	`page-${createId()}.${source.extension.replace(".", "").toLowerCase() || "jpg"}`;

/** Copies images into a document's directory as new pages; returns their names. */
const addPages = async (id: string, uris: string[]) => {
	const directory = documentDirectory(id);
	directory.create({ intermediates: true, idempotent: true });
	const names: string[] = [];
	for (const uri of uris) {
		const source = new File(uri);
		const name = newPageName(source);
		await source.copy(new File(directory, name));
		names.push(name);
	}
	return names;
};

const sizeOf = (id: string, names: string[]) =>
	names.reduce((total, name) => total + (documentFile(id, name).size ?? 0), 0);

/** Writes (or rewrites) a document's PDF from its pages. */
const writePdf = async (id: string, pages: string[], title?: string) => {
	const images = await Promise.all(
		pages.map((page) => documentFile(id, page).bytes()),
	);
	await documentFile(id, PDF).write(await buildPdf(images, title));
	return PDF;
};

/** Pages in place: adds the PDF (`pdf`, or one built from them) and the size. */
const finish = async (
	id: string,
	pages: string[],
	pdf?: string,
): Promise<DocumentFiles> => {
	const name = pdf ?? (await writePdf(id, pages));
	return { pages, pdf: name, size: sizeOf(id, [...pages, name]) };
};

/** Runs `build` for a new document; its files go if anything fails. */
const create = async <T>(build: (id: string) => Promise<T>) => {
	const id = createId();
	try {
		return { id, ...(await build(id)) };
	} catch (error) {
		deleteDocumentFiles(id);
		throw error;
	}
};

/**
 * Opens the system document scanner (VisionKit / ML Kit) and keeps its
 * pages, out of the cache (which the OS may purge). Resolves to `null` when
 * the user cancels.
 */
export const scanDocument = async () => {
	const scan = await CameraView.scanDocumentAsync({
		requestPdf: true,
		quality: JPEG_QUALITY,
	});
	if (!scan?.pages.length) return null;
	return create(async (id) => {
		const pages = await addPages(id, scan.pages);
		if (scan.pdfUri) {
			await new File(scan.pdfUri).copy(documentFile(id, PDF));
		}
		return { files: await finish(id, pages, scan.pdfUri ? PDF : undefined) };
	});
};

/**
 * Opens the system scanner for more pages, left in the cache: the page
 * editor copies them in when the edit is saved. Empty when cancelled.
 */
export const scanMorePages = async () => {
	const scan = await CameraView.scanDocumentAsync({ quality: JPEG_QUALITY });
	return scan?.pages ?? [];
};

/** A photo as a JPEG no larger than `MAX_SIDE`, in the cache. */
export const preparePhoto = async (uri: string) => {
	const image = await ImageManipulator.manipulate(uri).renderAsync();
	const longest = Math.max(image.width, image.height);
	const scaled =
		longest > MAX_SIDE
			? await ImageManipulator.manipulate(image)
					.resize(
						image.width >= image.height
							? { width: MAX_SIDE }
							: { height: MAX_SIDE },
					)
					.renderAsync()
			: image;
	const saved = await scaled.saveAsync({
		format: SaveFormat.JPEG,
		compress: JPEG_QUALITY,
	});
	return saved.uri;
};

/** An image turned by `degrees` (clockwise), as a new JPEG in the cache. */
const rotateImage = async (uri: string, degrees: number) => {
	const image = await ImageManipulator.manipulate(uri)
		.rotate(degrees)
		.renderAsync();
	const saved = await image.saveAsync({
		format: SaveFormat.JPEG,
		compress: JPEG_QUALITY,
	});
	return saved.uri;
};

/** A new document from photos (gallery or shared), one page each. */
export const createDocumentFromPhotos = (uris: string[]) =>
	create(async (id) => {
		const photos: string[] = [];
		for (const uri of uris) photos.push(await preparePhoto(uri));
		return { files: await finish(id, await addPages(id, photos)) };
	});

/**
 * A new document from a PDF file: the file is kept as it is, and its pages
 * are drawn as images for the thumbnails, the reader and text recognition.
 */
export const createDocumentFromPdf = (uri: string) =>
	create(async (id) => {
		documentDirectory(id).create({ intermediates: true, idempotent: true });
		const pdf = documentFile(id, PDF);
		await new File(uri).copy(pdf);
		const drawn = await PdfThumbnail.generateAllPages(pdf.uri, {
			quality: 90,
		});
		const pages = await addPages(
			id,
			drawn.map((page) => page.uri),
		);
		return { files: await finish(id, pages, PDF) };
	});

/** A page of the page editor: an existing page (`page`) or a new image. */
export type PageEdit = {
	uri: string;
	/** The page's file name, for pages already in the document. */
	page?: string;
	/** Clockwise, in degrees. */
	rotation: number;
};

/**
 * Applies the page editor's list: turns what was rotated, copies in what
 * was added, deletes what's gone, and rewrites the PDF.
 */
export const applyPageEdits = async (
	doc: Pick<DocItem, "id" | "name" | "pages" | "pdf">,
	edits: PageEdit[],
): Promise<DocumentFiles> => {
	const pages: string[] = [];
	for (const edit of edits) {
		const turned = ((edit.rotation % 360) + 360) % 360;
		if (edit.page && turned === 0) {
			pages.push(edit.page);
			continue;
		}
		const uri = turned ? await rotateImage(edit.uri, turned) : edit.uri;
		pages.push(...(await addPages(doc.id, [uri])));
	}
	for (const page of doc.pages) {
		if (!pages.includes(page)) deleteFile(doc.id, page);
	}
	await writePdf(doc.id, pages, doc.name);
	return finish(doc.id, pages, PDF);
};

/** Builds the PDF of a document that has none (saved before PDFs were). */
export const addMissingPdf = async (
	doc: Pick<DocItem, "id" | "name" | "pages">,
) => finish(doc.id, doc.pages, await writePdf(doc.id, doc.pages, doc.name));

/**
 * One new document with the pages of `docs`, in order; the originals stay.
 * Readings follow their pages.
 */
export const mergeDocumentFiles = (
	docs: Pick<DocItem, "id" | "name" | "pages" | "readings">[],
) =>
	create(async (id) => {
		const pages: string[] = [];
		const readings: Record<string, PageReading> = {};
		for (const doc of docs) {
			for (const page of doc.pages) {
				const [name] = await addPages(id, [pageUri(doc, page)]);
				pages.push(name);
				const reading = doc.readings?.[page];
				if (reading) readings[name] = reading;
			}
		}
		await writePdf(id, pages, docs[0]?.name);
		return { files: await finish(id, pages, PDF), readings };
	});

const deleteFile = (id: string, name: string) => {
	try {
		const file = documentFile(id, name);
		if (file.exists) file.delete();
	} catch (error) {
		console.warn("Could not delete a page", error);
	}
};

export const deleteDocumentFiles = (id: string) => {
	try {
		const directory = documentDirectory(id);
		if (directory.exists) directory.delete();
	} catch (error) {
		console.warn("Could not delete document files", error);
	}
};

/** Restores a document's file from a backup. */
export const writeDocumentFile = async (
	id: string,
	name: string,
	bytes: Uint8Array,
) => {
	documentDirectory(id).create({ intermediates: true, idempotent: true });
	await documentFile(id, name).write(bytes);
};

/** A document's file as bytes, or `null` when it's missing. */
export const readDocumentFile = async (id: string, name: string) => {
	const file = documentFile(id, name);
	return file.exists ? file.bytes() : null;
};

/**
 * The document's PDF as "<name>.pdf" in the cache, for the share sheet and
 * the printer (built from the pages if the document has none yet).
 */
export const namedPdf = async (
	doc: Pick<DocItem, "id" | "name" | "pages" | "pdf">,
) => {
	const directory = new Directory(Paths.cache, "share", doc.id);
	directory.create({ intermediates: true, idempotent: true });
	const target = new File(directory, fileNameFor(doc.name, "pdf"));
	if (doc.pdf) {
		await documentFile(doc.id, doc.pdf).copy(target, { overwrite: true });
	} else {
		const images = await Promise.all(
			doc.pages.map((page) => documentFile(doc.id, page).bytes()),
		);
		await target.write(await buildPdf(images, doc.name));
	}
	return target.uri;
};

/** Lets the user pick a folder and writes the PDF into it as "<name>.pdf". */
export const exportDocument = async (
	doc: Pick<DocItem, "id" | "name" | "pages" | "pdf">,
) => {
	const directory = await Directory.pickDirectoryAsync();
	const source = new File(await namedPdf(doc));
	const target = directory.createFile(
		fileNameFor(doc.name, "pdf"),
		"application/pdf",
	);
	await target.write(await source.bytes());
};

/** Opens the system print dialog with the document's PDF. */
export const printDocument = async (
	doc: Pick<DocItem, "id" | "name" | "pages" | "pdf">,
) => {
	await Print.printAsync({ uri: await namedPdf(doc) });
};
