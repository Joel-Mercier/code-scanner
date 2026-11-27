import type { BarcodeType } from "expo-camera";
import type { QRKind } from "@/domain/codes/payload";
import type { CodeStyle } from "@/domain/codes/style";

export const folderIcons = [
	"folder",
	"star",
	"receipt",
	"home",
	"briefcase",
	"ticket",
	"food",
	"plane",
	"gift",
	"book",
	"card",
	"heart",
] as const;

export type FolderIcon = (typeof folderIcons)[number];

/** Folder colour keys; each theme maps them to a tint and an ink. */
export const folderColors = [
	"blue",
	"green",
	"amber",
	"rose",
	"violet",
	"graphite",
] as const;

export type FolderColor = (typeof folderColors)[number];

export type Folder = {
	id: string;
	name: string;
	color: FolderColor;
	icon: FolderIcon;
	parentId: string | null;
	createdAt: number;
};

export type CodeItem = {
	kind: "code";
	id: string;
	/** Catalogue number ("No. 044"), in order of arrival. */
	seq: number;
	folderId: string | null;
	createdAt: number;
	/** When it was pinned (to the top of the collection and the home screen). */
	pinnedAt?: number;
	source: "scanner" | "created";
	format: BarcodeType;
	/** Encoded payload, exactly as scanned / generated. */
	data: string;
	/** Payload type picked in the workshop (scanned codes are parsed on read). */
	qrKind?: QRKind;
	name?: string;
	style?: CodeStyle;
};

/** What sort of paper a document is, picked by the user. */
export const docTypes = [
	"receipt",
	"invoice",
	"id",
	"ticket",
	"letter",
	"contract",
	"warranty",
	"medical",
	"other",
] as const;

export type DocType = (typeof docTypes)[number];

/** A code found printed on a page. */
export type FoundCode = { format: BarcodeType; data: string };

/** What a page says, read on the device: its text and the codes on it. */
export type PageReading = { text: string; codes: FoundCode[] };

export type DocItem = {
	kind: "doc";
	id: string;
	/** Catalogue number ("No. 045"), in order of arrival. */
	seq: number;
	folderId: string | null;
	createdAt: number;
	pinnedAt?: number;
	name: string;
	/**
	 * Page images, as file names in the document's own directory. Never
	 * absolute: iOS moves the app's container between installs and updates.
	 */
	pages: string[];
	/** The PDF's file name in that directory. */
	pdf?: string;
	/** Bytes on disk, pages and PDF together. */
	size: number;
	docType?: DocType;
	notes?: string;
	/** Each page's text and codes, by page file name; unread pages are missing. */
	readings?: Record<string, PageReading>;
};

export type LibraryItem = CodeItem | DocItem;

export type NewCode = Omit<
	CodeItem,
	"kind" | "id" | "seq" | "createdAt" | "folderId"
> & {
	folderId?: string | null;
};

export type NewDoc = Omit<
	DocItem,
	"kind" | "seq" | "createdAt" | "folderId"
> & {
	folderId?: string | null;
};
