import i18n from "@/i18n";
import type { DocItem, DocType, FoundCode, PageReading } from "./types";

/** "Receipt", "ID"… */
export const docTypeLabel = (type: DocType) =>
	i18n.t(`app.document.types.${type}`);

/** The pages nobody has read yet (text and codes). */
export const unreadPages = (doc: Pick<DocItem, "pages" | "readings">) =>
	doc.pages.filter((page) => !doc.readings?.[page]);

/** Readings of the pages still in the document, the others dropped. */
export const keepReadings = (
	readings: DocItem["readings"],
	pages: string[],
): Record<string, PageReading> =>
	Object.fromEntries(
		pages.flatMap((page) => {
			const reading = readings?.[page];
			return reading ? [[page, reading] as const] : [];
		}),
	);

/** The text of every page, in page order, a blank line between pages. */
export const docText = (doc: Pick<DocItem, "pages" | "readings">) =>
	doc.pages
		.map((page) => doc.readings?.[page]?.text.trim() ?? "")
		.filter(Boolean)
		.join("\n\n");

/** The codes printed on the pages, in page order, each one once. */
export const docCodes = (
	doc: Pick<DocItem, "pages" | "readings">,
): FoundCode[] => {
	const seen = new Set<string>();
	const codes: FoundCode[] = [];
	for (const page of doc.pages) {
		for (const code of doc.readings?.[page]?.codes ?? []) {
			const key = `${code.format}\n${code.data}`;
			if (seen.has(key)) continue;
			seen.add(key);
			codes.push(code);
		}
	}
	return codes;
};

/** Everything a search looks through for a document, lower case. */
export const docSearchText = (doc: DocItem) =>
	[
		doc.name,
		doc.notes ?? "",
		doc.docType ? docTypeLabel(doc.docType) : "",
		docText(doc),
	]
		.join("\n")
		.toLowerCase();

const FORBIDDEN = /[\\/:*?"<>|]+/g;

/** Drops control characters (tabs, newlines…), which file names can't hold. */
const printable = (text: string) =>
	[...text].map((char) => (char.charCodeAt(0) < 32 ? " " : char)).join("");

/**
 * A file name for a document ("Lease 2026.pdf"): no characters file systems
 * refuse, not too long, never empty.
 */
export const fileNameFor = (name: string, extension: string) => {
	const base = printable(name)
		.replace(FORBIDDEN, "-")
		.replace(/\s+/g, " ")
		.trim();
	const short = base.slice(0, 80).trim().replace(/^\.+/, "");
	return `${short || "Document"}.${extension}`;
};

/** "Lease.pdf" → "Lease" (the name an imported file gives its document). */
export const nameFromFile = (fileName: string | null | undefined) => {
	const base = (fileName ?? "").replace(/\.[^.]+$/, "").trim();
	return base || null;
};
