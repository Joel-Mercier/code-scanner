import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mergeLibrary } from "@/domain/library/backup";
import { keepReadings } from "@/domain/library/documents";
import { descendantFolderIds } from "@/domain/library/folders";
import {
	LIBRARY_VERSION,
	migrateLibrary,
	type PersistedLibrary,
} from "@/domain/library/migrations";
import type {
	CodeItem,
	DocItem,
	Folder,
	LibraryItem,
	NewCode,
	NewDoc,
	PageReading,
} from "@/domain/library/types";
import { createId } from "@/lib/id";
import { zustandStorage } from "@/lib/storage";
import { deleteDocumentFiles } from "@/services/documents";

interface LibraryState extends PersistedLibrary {
	/** Saves a code; scanning or creating the same code again refreshes it. */
	addCode: (code: NewCode) => CodeItem;
	addDocument: (doc: NewDoc) => DocItem;
	renameItem: (id: string, name: string) => void;
	/** Changes a document's details or files; readings of dropped pages go. */
	updateDocument: (
		id: string,
		changes: Partial<
			Pick<DocItem, "pages" | "pdf" | "size" | "docType" | "notes" | "readings">
		>,
	) => void;
	/** Keeps what a page says; ignored if the page has gone meanwhile. */
	setReading: (id: string, page: string, reading: PageReading) => void;
	/** Pins or unpins items (to the top of the collection and the home screen). */
	setPinned: (ids: string[], pinned: boolean) => void;
	/** Locks or unlocks items (opening a locked one asks first). */
	setLocked: (ids: string[], locked: boolean) => void;
	/** Adds a backup's folders and items to the library; returns what was added. */
	restore: (backup: PersistedLibrary) => LibraryItem[];
	moveItem: (id: string, folderId: string | null) => void;
	/** Moves several items at once; unknown ids are skipped. */
	moveItems: (ids: string[], folderId: string | null) => void;
	/** Also deletes a document's files. */
	deleteItem: (id: string) => void;
	/** Deletes several items at once, with their documents' files. */
	deleteItems: (ids: string[]) => void;
	createFolder: (
		folder: Pick<Folder, "name" | "color" | "icon" | "parentId">,
	) => Folder;
	updateFolder: (
		id: string,
		changes: Partial<Pick<Folder, "name" | "color" | "icon">>,
	) => void;
	/** Ignored when `parentId` is the folder itself or one of its descendants. */
	moveFolder: (id: string, parentId: string | null) => void;
	/** `keepContents` moves children to the parent folder instead of deleting them. */
	deleteFolder: (id: string, keepContents: boolean) => void;
}

const without = <T>(record: Record<string, T>, ids: Set<string>) =>
	Object.fromEntries(Object.entries(record).filter(([id]) => !ids.has(id)));

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
			updateDocument: (id, changes) =>
				set((state) => {
					const item = state.items[id];
					if (item?.kind !== "doc") return state;
					const next: DocItem = { ...item, ...changes };
					next.readings = keepReadings(next.readings, next.pages);
					if (changes.docType === undefined && "docType" in changes) {
						delete next.docType;
					}
					if (changes.notes !== undefined && !changes.notes.trim()) {
						delete next.notes;
					}
					return { items: { ...state.items, [id]: next } };
				}),
			setReading: (id, page, reading) =>
				set((state) => {
					const item = state.items[id];
					if (item?.kind !== "doc" || !item.pages.includes(page)) return state;
					return {
						items: {
							...state.items,
							[id]: {
								...item,
								readings: { ...item.readings, [page]: reading },
							},
						},
					};
				}),
			setPinned: (ids, pinned) =>
				set((state) => {
					const items = { ...state.items };
					const now = Date.now();
					ids.forEach((id, index) => {
						const item = items[id];
						if (!item) return;
						if (pinned) {
							// Keep the picked order: the first one ends up on top.
							items[id] = { ...item, pinnedAt: now + ids.length - index };
						} else {
							const { pinnedAt: _, ...rest } = item;
							items[id] = rest as LibraryItem;
						}
					});
					return { items };
				}),
			setLocked: (ids, locked) =>
				set((state) => {
					const items = { ...state.items };
					const now = Date.now();
					for (const id of ids) {
						const item = items[id];
						if (!item) continue;
						if (locked) {
							items[id] = { ...item, lockedAt: item.lockedAt ?? now };
						} else {
							const { lockedAt: _, ...rest } = item;
							items[id] = rest as LibraryItem;
						}
					}
					return { items };
				}),
			restore: (backup) => {
				const { items, folders, nextSeq } = get();
				const merged = mergeLibrary({ items, folders, nextSeq }, backup);
				set(merged.library);
				return merged.added;
			},
			moveItem: (id, folderId) => get().moveItems([id], folderId),
			moveItems: (ids, folderId) =>
				set((state) => {
					const moving = ids.filter((id) => state.items[id]);
					if (moving.length === 0) return state;
					const items = { ...state.items };
					for (const id of moving) items[id] = { ...items[id], folderId };
					return { items };
				}),
			deleteItem: (id) => get().deleteItems([id]),
			deleteItems: (ids) => {
				const { items } = get();
				const removed = new Set(ids.filter((id) => items[id]));
				if (removed.size === 0) return;
				for (const id of removed) {
					if (items[id].kind === "doc") deleteDocumentFiles(id);
				}
				set((state) => ({ items: without(state.items, removed) }));
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
			version: LIBRARY_VERSION,
			storage: createJSONStorage(() => zustandStorage),
			migrate: (persisted, version) =>
				migrateLibrary(persisted, version) as LibraryState,
		},
	),
);

export default useLibrary;
