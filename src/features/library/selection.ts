import type { LibraryItem } from "@/domain/library/types";

/** The ids of the items picked in the collection's multi-select mode. */
export type Selection = ReadonlySet<string>;

export const emptySelection: Selection = new Set();

/** Adds `id`, or takes it out when it's already in. */
export const toggleSelected = (selection: Selection, id: string): Selection => {
	const next = new Set(selection);
	if (next.has(id)) next.delete(id);
	else next.add(id);
	return next;
};

/**
 * The picked items among those on screen, in their order. Items deleted
 * meanwhile, or hidden since, drop out, so actions only touch what shows.
 */
export const selectedIn = (items: LibraryItem[], selection: Selection) =>
	items.filter((item) => selection.has(item.id));

/** Whether every one of `items` is picked (and there is at least one). */
export const allSelected = (items: LibraryItem[], selection: Selection) =>
	items.length > 0 && items.every((item) => selection.has(item.id));

/**
 * The folder the items share, to tick it in the folder picker; `undefined`
 * when they come from different folders (search results).
 */
export const sharedFolder = (items: LibraryItem[]) => {
	const folders = new Set(items.map((item) => item.folderId));
	return folders.size === 1 ? [...folders][0] : undefined;
};
