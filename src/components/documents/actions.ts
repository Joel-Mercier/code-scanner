import * as Clipboard from "expo-clipboard";
import { reportGallerySave } from "@/components/ui/galleryFeedback";
import { toast } from "@/components/ui/Toast";
import { docText, unreadPages } from "@/domain/library/documents";
import type { DocItem } from "@/domain/library/types";
import i18n from "@/i18n";
import { attempt } from "@/lib/attempt";
import { format } from "@/lib/date";
import { haptics } from "@/lib/haptics";
import {
	addMissingPdf,
	applyPageEdits,
	createDocumentFromPdf,
	createDocumentFromPhotos,
	exportDocument,
	mergeDocumentFiles,
	type PageEdit,
	pageUri,
	pageUris,
	printDocument as printPdf,
} from "@/services/documents";
import { saveImagesToGallery } from "@/services/gallery";
import { readPage } from "@/services/recognition";
import { shareItem } from "@/services/share";
import useLibrary from "@/stores/library";

const t = (key: string, options?: Record<string, unknown>) =>
	i18n.t(key, options);

/** Documents being read right now, so a page is never read twice at once. */
const preparing = new Set<string>();

/**
 * Brings a document up to date in the background: builds its PDF if it has
 * none, then reads the pages nobody has read yet (text and codes). Safe to
 * call often; a page that can't be read now is tried again next time.
 */
export const prepareDocument = async (id: string) => {
	if (preparing.has(id)) return;
	preparing.add(id);
	try {
		const store = () => useLibrary.getState();
		const doc = store().items[id];
		if (doc?.kind !== "doc") return;
		if (!doc.pdf && doc.pages.length > 0) {
			const files = await attempt(() => addMissingPdf(doc));
			if (files.ok) store().updateDocument(id, files.value);
		}
		for (const page of unreadPages(doc)) {
			const reading = await attempt(() => readPage(pageUri(doc, page)));
			if (!reading.ok) break;
			store().setReading(id, page, reading.value);
		}
	} finally {
		preparing.delete(id);
	}
};

/** Lets the user pick a folder for the PDF, then confirms. */
export const saveDocumentToFiles = async (doc: DocItem) => {
	const result = await attempt(() => exportDocument(doc));
	if (result.ok) toast(t("app.document.saved"));
};

export const shareDocument = async (doc: DocItem) => {
	await attempt(() => shareItem(doc));
};

export const printDocument = async (doc: DocItem) => {
	const result = await attempt(() => printPdf(doc));
	if (!result.ok) toast(t("app.common.something_went_wrong"), "warning");
};

/** Adds every page to the photo gallery. */
export const savePagesToGallery = (doc: DocItem) =>
	reportGallerySave(
		() => saveImagesToGallery(pageUris(doc)),
		t("app.document.pages_saved", { count: doc.pages.length }),
	);

/** Copies the document's recognised text. */
export const copyDocumentText = async (doc: DocItem) => {
	await Clipboard.setStringAsync(docText(doc));
	haptics.success();
	toast(t("app.common.copied"));
};

/** The default name of an imported document ("Import · 27 Nov, 14:32"). */
const importName = () =>
	t("app.document.import_name", {
		date: format(Date.now(), "d MMM, HH:mm"),
	});

/**
 * Saves photos as a new document (one page each), then starts reading it.
 * Resolves to its id, or `null` when it failed (the user has been told).
 */
export const importPhotos = async (uris: string[], name?: string) => {
	if (uris.length === 0) return null;
	const result = await attempt(() => createDocumentFromPhotos(uris));
	if (!result.ok) {
		toast(t("app.document.import_failed"), "warning");
		return null;
	}
	const { id, files } = result.value;
	useLibrary
		.getState()
		.addDocument({ id, name: name ?? importName(), ...files });
	haptics.success();
	prepareDocument(id);
	return id;
};

/** Saves a PDF file as a new document, like `importPhotos`. */
export const importPdf = async (uri: string, name?: string | null) => {
	const result = await attempt(() => createDocumentFromPdf(uri));
	if (!result.ok) {
		toast(t("app.document.import_pdf_failed"), "warning");
		return null;
	}
	const { id, files } = result.value;
	useLibrary
		.getState()
		.addDocument({ id, name: name || importName(), ...files });
	haptics.success();
	prepareDocument(id);
	return id;
};

/** Saves the page editor's work. Resolves to `false` when it failed. */
export const savePageEdits = async (doc: DocItem, edits: PageEdit[]) => {
	const result = await attempt(() => applyPageEdits(doc, edits));
	if (!result.ok) {
		toast(t("app.common.something_went_wrong"), "warning");
		return false;
	}
	useLibrary.getState().updateDocument(doc.id, result.value);
	prepareDocument(doc.id);
	return true;
};

/**
 * Puts the pages of `docs` (oldest first) into one new document, in the
 * folder of the first. The originals stay. Resolves to the new id.
 */
export const mergeDocuments = async (docs: DocItem[]) => {
	const ordered = [...docs].sort((a, b) => a.createdAt - b.createdAt);
	const first = ordered[0];
	if (!first) return null;
	const result = await attempt(() => mergeDocumentFiles(ordered));
	if (!result.ok) {
		toast(t("app.common.something_went_wrong"), "warning");
		return null;
	}
	const { id, files, readings } = result.value;
	useLibrary.getState().addDocument({
		id,
		name: t("app.document.merged_name", { name: first.name }),
		folderId: first.folderId,
		readings,
		...files,
	});
	haptics.success();
	toast(t("app.document.merged", { count: ordered.length }));
	prepareDocument(id);
	return id;
};
