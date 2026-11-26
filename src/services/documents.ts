import { CameraView } from "expo-camera";
import { Directory, File, Paths } from "expo-file-system";
import { createId } from "@/lib/id";

const documentsRoot = () => new Directory(Paths.document, "documents");

const documentDirectory = (id: string) => new Directory(documentsRoot(), id);

/**
 * Scanner output lives in the cache directory, which the OS may purge at any
 * time. Copy the pages (and PDF) into the app's document directory.
 */
const persistScan = async (
	id: string,
	scan: { pages: string[]; pdfUri?: string },
) => {
	const directory = documentDirectory(id);
	directory.create({ intermediates: true, idempotent: true });

	const pages: string[] = [];
	for (const [index, uri] of scan.pages.entries()) {
		const source = new File(uri);
		const extension = source.extension.replace(".", "") || "jpg";
		const target = new File(directory, `page-${index + 1}.${extension}`);
		await source.copy(target);
		pages.push(target.uri);
	}

	let pdfUri: string | undefined;
	if (scan.pdfUri) {
		const target = new File(directory, "document.pdf");
		await new File(scan.pdfUri).copy(target);
		pdfUri = target.uri;
	}

	const size = [...pages, ...(pdfUri ? [pdfUri] : [])].reduce(
		(total, uri) => total + (new File(uri).size ?? 0),
		0,
	);
	return { pages, pdfUri, size };
};

/**
 * Opens the system document scanner (VisionKit / ML Kit) and keeps its pages.
 * Resolves to `null` when the user cancels.
 */
export const scanDocument = async () => {
	const scan = await CameraView.scanDocumentAsync({
		requestPdf: true,
		quality: 0.9,
	});
	if (!scan?.pages.length) return null;
	const id = createId();
	return { id, files: await persistScan(id, scan) };
};

export const deleteDocumentFiles = (id: string) => {
	try {
		const directory = documentDirectory(id);
		if (directory.exists) directory.delete();
	} catch (error) {
		console.warn("Could not delete document files", error);
	}
};

/** Lets the user pick a folder and writes the PDF (or first page) into it. */
export const exportDocument = async (doc: {
	name: string;
	pages: string[];
	pdfUri?: string;
}) => {
	const directory = await Directory.pickDirectoryAsync();
	const isPdf = !!doc.pdfUri;
	const source = new File(doc.pdfUri ?? doc.pages[0]);
	const target = directory.createFile(
		`${doc.name}.${isPdf ? "pdf" : "jpg"}`,
		isPdf ? "application/pdf" : "image/jpeg",
	);
	await target.write(await source.bytes());
};
