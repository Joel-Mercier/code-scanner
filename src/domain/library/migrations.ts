import { normalizeBarcodeType } from "@/domain/codes/formats";
import {
	type CodeItem,
	type DocItem,
	type Folder,
	type FolderColor,
	folderIcons,
	type LibraryItem,
} from "./types";

/** What the library store persists (its data, without the actions). */
export type PersistedLibrary = {
	items: Record<string, LibraryItem>;
	folders: Record<string, Folder>;
	/** Next catalogue number. */
	nextSeq: number;
};

// v1 stored folders with an emoji and a colour from the previous palette,
// and code colours as that palette's preset keys.
type WithoutSeq<T> = T extends unknown ? Omit<T, "seq"> : never;
type V1State = {
	items: Record<string, WithoutSeq<LibraryItem>>;
	folders: Record<
		string,
		Omit<Folder, "color" | "icon"> & { color: string; emoji?: string }
	>;
};

const v1FolderColors: Record<string, FolderColor> = {
	sky: "blue",
	mint: "green",
	lemon: "amber",
	tangerine: "amber",
	bubblegum: "rose",
	grape: "violet",
};
const v1FolderEmojis = [
	"📁",
	"⭐️",
	"🧾",
	"🏠",
	"💼",
	"🎟️",
	"🍕",
	"✈️",
	"🎁",
	"📚",
	"💳",
	"🐾",
];
// Old presets become their exact colour, so existing codes look the same.
const v1Inks: Record<string, string> = {
	ink: "ink",
	grape: "#5B3CC4",
	sky: "#1673B8",
	bubblegum: "#C9306F",
	mint: "#0B8457",
	tangerine: "#C25A00",
};
const v1Papers: Record<string, string> = {
	white: "white",
	cream: "#FFF8EE",
	lemon: "#FFF5CC",
	mint: "#D9F8EA",
	sky: "#DDF2FF",
	bubblegum: "#FFE0EE",
	grape: "#ECE5FF",
	tangerine: "#FFEBD6",
};

/** v1 → v2: catalogue numbers, folder icons, the new colour palettes. */
const migrateV1 = (state: V1State): PersistedLibrary => {
	const ordered = Object.values(state.items ?? {}).sort(
		(a, b) => a.createdAt - b.createdAt,
	);
	const items: Record<string, LibraryItem> = {};
	ordered.forEach((item, index) => {
		const seq = index + 1;
		if (item.kind === "code" && item.style) {
			const { color, background } = item.style;
			items[item.id] = {
				...item,
				seq,
				style: {
					...item.style,
					color: v1Inks[color] ?? color,
					background: background && (v1Papers[background] ?? background),
				},
			} as CodeItem;
		} else {
			items[item.id] = { ...item, seq } as LibraryItem;
		}
	});
	const folders: Record<string, Folder> = {};
	for (const { emoji, ...folder } of Object.values(state.folders ?? {})) {
		const icon = folderIcons[v1FolderEmojis.indexOf(emoji ?? "")];
		folders[folder.id] = {
			...folder,
			color: v1FolderColors[folder.color] ?? "blue",
			icon: icon ?? "folder",
		};
	}
	return { items, folders, nextSeq: ordered.length + 1 };
};

// v2 could hold codes scanned from a photo on Android with a numeric
// (ML Kit) format instead of a `BarcodeType` string.
const migrateV2 = (state: PersistedLibrary): PersistedLibrary => {
	const items: Record<string, LibraryItem> = {};
	for (const item of Object.values(state.items ?? {})) {
		items[item.id] =
			item.kind === "code"
				? { ...item, format: normalizeBarcodeType(item.format) }
				: item;
	}
	return { ...state, items };
};

/** The last part of a path or URI ("file:///…/doc/page-1.jpg" → "page-1.jpg"). */
const fileName = (uri: string) => uri.split("/").pop() ?? uri;

type V3Doc = Omit<DocItem, "pdf"> & { pdfUri?: string };

// v3 stored a document's pages and PDF as absolute URIs, which break when
// iOS moves the app's container. They all live in the document's own
// directory, so their file names are enough.
const migrateV3 = (state: PersistedLibrary): PersistedLibrary => {
	const items: Record<string, LibraryItem> = {};
	for (const item of Object.values(state.items ?? {})) {
		if (item.kind !== "doc") {
			items[item.id] = item;
			continue;
		}
		const { pdfUri, ...doc } = item as V3Doc;
		items[item.id] = {
			...doc,
			pages: doc.pages.map(fileName),
			...(pdfUri ? { pdf: fileName(pdfUri) } : {}),
		};
	}
	return { ...state, items };
};

// v5 added `lockedAt` to items. It is optional and unset means unlocked, so
// v4 data is already valid: the step only marks the version.

/** Bump with every change to the persisted shape, and add a step below. */
export const LIBRARY_VERSION = 5;

export const migrateLibrary = (
	persisted: unknown,
	version: number,
): PersistedLibrary => {
	const v2 =
		version < 2
			? migrateV1(persisted as V1State)
			: (persisted as PersistedLibrary);
	const v3 = version < 3 ? migrateV2(v2) : v2;
	return version < 4 ? migrateV3(v3) : v3;
};
