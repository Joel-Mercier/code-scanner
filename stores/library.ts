import type { BarcodeType } from "expo-camera";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { zustandStorage } from "@/config/storage";
import type { CodeInk, CodePaper, FolderColor } from "@/theme";
import { normalizeBarcodeType } from "@/utils/barcodeType";
import type { QRKind } from "@/utils/codePayload";
import { deleteDocumentFiles } from "@/utils/documentFiles";
import { createId } from "@/utils/id";
import type { QRDotStyle } from "@/utils/qrGeometry";

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

export type Folder = {
	id: string;
	name: string;
	color: FolderColor;
	icon: FolderIcon;
	parentId: string | null;
	createdAt: number;
};

export type CodeStyle = {
	/** A `codeInks` preset, or a custom `#rrggbb` colour. */
	color: CodeInk | (string & {});
	/** A `codePapers` preset, or a custom `#rrggbb` colour. Defaults to white. */
	background?: CodePaper | (string & {});
	dots?: QRDotStyle;
	logo?: string;
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
	pages: string[];
	pdfUri?: string;
	size: number;
};

export type LibraryItem = CodeItem | DocItem;

type NewCode = Omit<
	CodeItem,
	"kind" | "id" | "seq" | "createdAt" | "folderId"
> & {
	folderId?: string | null;
};
type NewDoc = Omit<DocItem, "kind" | "seq" | "createdAt" | "folderId"> & {
	folderId?: string | null;
};

interface LibraryState {
	items: Record<string, LibraryItem>;
	folders: Record<string, Folder>;
	/** Next catalogue number. */
	nextSeq: number;
	addCode: (code: NewCode) => CodeItem;
	addDocument: (doc: NewDoc) => DocItem;
	renameItem: (id: string, name: string) => void;
	moveItem: (id: string, folderId: string | null) => void;
	deleteItem: (id: string) => void;
	createFolder: (
		folder: Pick<Folder, "name" | "color" | "icon" | "parentId">,
	) => Folder;
	updateFolder: (
		id: string,
		changes: Partial<Pick<Folder, "name" | "color" | "icon">>,
	) => void;
	moveFolder: (id: string, parentId: string | null) => void;
	/** `keepContents` moves children to the parent folder instead of deleting them. */
	deleteFolder: (id: string, keepContents: boolean) => void;
}

const without = <T>(record: Record<string, T>, ids: Set<string>) =>
	Object.fromEntries(Object.entries(record).filter(([id]) => !ids.has(id)));

const descendantFolderIds = (
	folders: Record<string, Folder>,
	rootId: string,
) => {
	const ids = new Set([rootId]);
	let grew = true;
	while (grew) {
		grew = false;
		for (const folder of Object.values(folders)) {
			if (folder.parentId && ids.has(folder.parentId) && !ids.has(folder.id)) {
				ids.add(folder.id);
				grew = true;
			}
		}
	}
	return ids;
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

const migrateV1 = (state: V1State) => {
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
const migrateV2 = (state: LibraryState) => {
	const items: Record<string, LibraryItem> = {};
	for (const item of Object.values(state.items ?? {})) {
		items[item.id] =
			item.kind === "code"
				? { ...item, format: normalizeBarcodeType(item.format) }
				: item;
	}
	return { ...state, items };
};

const useLibrary = create<LibraryState>()(
	persist(
		(set, get) => ({
			items: {},
			folders: {},
			nextSeq: 1,
			addCode: (code) => {
				const existing = Object.values(get().items).find(
					(item): item is CodeItem =>
						item.kind === "code" &&
						item.source === code.source &&
						item.data === code.data &&
						item.format === code.format,
				);
				const item: CodeItem = existing
					? {
							...existing,
							...code,
							folderId: existing.folderId,
							createdAt: Date.now(),
						}
					: {
							kind: "code",
							id: createId(),
							seq: get().nextSeq,
							createdAt: Date.now(),
							folderId: code.folderId ?? null,
							...code,
						};
				set((state) => ({
					items: { ...state.items, [item.id]: item },
					nextSeq: existing ? state.nextSeq : state.nextSeq + 1,
				}));
				return item;
			},
			addDocument: (doc) => {
				const item: DocItem = {
					kind: "doc",
					seq: get().nextSeq,
					createdAt: Date.now(),
					...doc,
					folderId: doc.folderId ?? null,
				};
				set((state) => ({
					items: { ...state.items, [item.id]: item },
					nextSeq: state.nextSeq + 1,
				}));
				return item;
			},
			renameItem: (id, name) =>
				set((state) => {
					const item = state.items[id];
					return item
						? { items: { ...state.items, [id]: { ...item, name } } }
						: state;
				}),
			moveItem: (id, folderId) =>
				set((state) => {
					const item = state.items[id];
					return item
						? { items: { ...state.items, [id]: { ...item, folderId } } }
						: state;
				}),
			deleteItem: (id) => {
				const item = get().items[id];
				if (item?.kind === "doc") deleteDocumentFiles(item.id);
				set((state) => ({ items: without(state.items, new Set([id])) }));
			},
			createFolder: (folder) => {
				const created: Folder = {
					...folder,
					id: createId(),
					createdAt: Date.now(),
				};
				set((state) => ({
					folders: { ...state.folders, [created.id]: created },
				}));
				return created;
			},
			updateFolder: (id, changes) =>
				set((state) => {
					const folder = state.folders[id];
					return folder
						? { folders: { ...state.folders, [id]: { ...folder, ...changes } } }
						: state;
				}),
			moveFolder: (id, parentId) =>
				set((state) => {
					const folder = state.folders[id];
					if (!folder) return state;
					if (
						parentId &&
						descendantFolderIds(state.folders, id).has(parentId)
					) {
						return state;
					}
					return {
						folders: { ...state.folders, [id]: { ...folder, parentId } },
					};
				}),
			deleteFolder: (id, keepContents) => {
				const { folders, items } = get();
				const folder = folders[id];
				if (!folder) return;
				if (keepContents) {
					const nextFolders = without(folders, new Set([id]));
					for (const child of Object.values(nextFolders)) {
						if (child.parentId === id) {
							nextFolders[child.id] = { ...child, parentId: folder.parentId };
						}
					}
					const nextItems = { ...items };
					for (const item of Object.values(items)) {
						if (item.folderId === id) {
							nextItems[item.id] = { ...item, folderId: folder.parentId };
						}
					}
					set({ folders: nextFolders, items: nextItems });
					return;
				}
				const removedFolders = descendantFolderIds(folders, id);
				const removedItems = new Set(
					Object.values(items)
						.filter(
							(item) => item.folderId && removedFolders.has(item.folderId),
						)
						.map((item) => item.id),
				);
				for (const itemId of removedItems) {
					const item = items[itemId];
					if (item.kind === "doc") deleteDocumentFiles(item.id);
				}
				set({
					folders: without(folders, removedFolders),
					items: without(items, removedItems),
				});
			},
		}),
		{
			name: "library",
			version: 3,
			storage: createJSONStorage(() => zustandStorage),
			migrate: (persisted, version) => {
				const v2 = (
					version < 2 ? migrateV1(persisted as V1State) : persisted
				) as LibraryState;
				return version < 3 ? migrateV2(v2) : v2;
			},
		},
	),
);

export default useLibrary;

export const sortByRecent = <T extends { createdAt: number }>(list: T[]) =>
	[...list].sort((a, b) => b.createdAt - a.createdAt);

/** "044": the catalogue number as printed on objects. */
export const catalogueNumber = (item: Pick<LibraryItem, "seq">) =>
	String(item.seq ?? 0).padStart(3, "0");
