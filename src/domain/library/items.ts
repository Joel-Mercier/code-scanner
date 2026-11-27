import { describeItem } from "@/domain/codes/describe";
import { docTypeLabel } from "./documents";
import type { LibraryItem } from "./types";

/** How long a capture counts as new (its blue dot). */
const NEW_FOR = 24 * 60 * 60 * 1000;

export const isNew = (item: LibraryItem) =>
	Date.now() - item.createdAt < NEW_FOR;

export const sortByRecent = <T extends { createdAt: number }>(list: T[]) =>
	[...list].sort((a, b) => b.createdAt - a.createdAt);

export const isPinned = (item: Pick<LibraryItem, "pinnedAt">) =>
	item.pinnedAt !== undefined;

/** Pinned items first (the latest pinned on top), then the newest. */
export const sortPinnedFirst = <
	T extends { createdAt: number; pinnedAt?: number },
>(
	list: T[],
) =>
	[...list].sort(
		(a, b) =>
			(b.pinnedAt ?? -1) - (a.pinnedAt ?? -1) || b.createdAt - a.createdAt,
	);

/** "044": the catalogue number as printed on objects. */
export const catalogueNumber = (item: Pick<LibraryItem, "seq">) =>
	String(item.seq ?? 0).padStart(3, "0");

export const itemTitle = (item: LibraryItem) =>
	item.kind === "doc" ? item.name : describeItem(item).title;

/** What kind of object it is: "Wi-Fi", "Code 128", "Receipt" or `docLabel`. */
const itemKind = (item: LibraryItem, docLabel: string) =>
	String(
		item.kind === "doc"
			? item.docType
				? docTypeLabel(item.docType)
				: docLabel
			: describeItem(item).subtitle,
	);

/** "042 · LINK", "041 · DOCUMENT" */
export const itemCaption = (item: LibraryItem, docLabel: string) =>
	`${catalogueNumber(item)} · ${itemKind(item, docLabel).toUpperCase()}`;

/** Items directly inside a folder (not in its subfolders). */
export const countInFolder = (
	items: Record<string, LibraryItem>,
	folderId: string,
) => Object.values(items).filter((item) => item.folderId === folderId).length;
