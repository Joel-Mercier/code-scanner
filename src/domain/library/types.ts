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
	source: "scanner" | "created";
	format: BarcodeType;
	/** Encoded payload, exactly as scanned / generated. */
	data: string;
	/** Payload type picked in the workshop (scanned codes are parsed on read). */
	qrKind?: QRKind;
	name?: string;
	style?: CodeStyle;
};

export type DocItem = {
	kind: "doc";
	id: string;
	/** Catalogue number ("No. 045"), in order of arrival. */
	seq: number;
	folderId: string | null;
	createdAt: number;
	name: string;
	/** Page images, in the app's documents directory. */
	pages: string[];
	pdfUri?: string;
	/** Bytes on disk, pages and PDF together. */
	size: number;
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
