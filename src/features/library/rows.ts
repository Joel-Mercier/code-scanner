import { describeItem, qrKinds, scanOnlyKinds } from "@/domain/codes/describe";
import { docSearchText } from "@/domain/library/documents";
import { isPinned, itemTitle } from "@/domain/library/items";
import type { Folder, LibraryItem } from "@/domain/library/types";
import { format } from "@/lib/date";

export type Filter = "all" | "codes" | "docs" | "folders";

/** Every kind of object the collection can hold, in the kind strip's order. */
export const KINDS = [...qrKinds, ...scanOnlyKinds, "barcode", "doc"] as const;
export type Kind = (typeof KINDS)[number];

const SCAN_ONLY = new Set<Kind>(scanOnlyKinds);

/**
 * The kinds the strip shows: the everyday ones always (dashed until found),
 * the scan-only ones (2FA, payments…) once the collection holds one.
 */
export const stripKinds = (found: Set<Kind>) =>
	KINDS.filter((kind) => !SCAN_ONLY.has(kind) || found.has(kind));

export const kindOf = (item: LibraryItem): Kind =>
	item.kind === "doc" ? "doc" : describeItem(item).kind;

export const matchesFilter = (item: LibraryItem, filter: Filter) =>
	filter === "all" ||
	(filter === "codes" ? item.kind === "code" : item.kind === "doc");

export const matchesFolder = (folder: Folder, query: string) =>
	folder.name.toLowerCase().includes(query.toLowerCase());

/**
 * Title, then a code's content and kind, or a document's notes, type and
 * the text read on its pages.
 */
export const matchesQuery = (item: LibraryItem, query: string) => {
	const needle = query.toLowerCase();
	if (item.kind === "doc") return docSearchText(item).includes(needle);
	return (
		itemTitle(item).toLowerCase().includes(needle) ||
		item.data.toLowerCase().includes(needle) ||
		describeItem(item).subtitle.toLowerCase().includes(needle)
	);
};

/** Up to this many tiles per row. */
export const COLUMNS = 3;

export type Row =
	| { type: "heading"; key: string; label: string }
	| { type: "items"; key: string; items: LibraryItem[]; offset: number };

/**
 * Groups items (newest first) by month, then into rows of `COLUMNS`. With a
 * `pinned` label, pinned items come first under it (the latest pinned on
 * top) and leave their month. `offset` is the index of a row's first item,
 * for staggering.
 */
export const toRows = (
	items: LibraryItem[],
	thisMonth: string,
	pinned?: string,
): Row[] => {
	const rows: Row[] = [];
	let month = "";
	let bucket: LibraryItem[] = [];
	let offset = 0;
	const flush = () => {
		for (let i = 0; i < bucket.length; i += COLUMNS) {
			rows.push({
				type: "items",
				key: `${month}-${i}`,
				items: bucket.slice(i, i + COLUMNS),
				offset: offset + i,
			});
		}
		offset += bucket.length;
		bucket = [];
	};
	const pins = pinned
		? items
				.filter(isPinned)
				.sort((a, b) => (b.pinnedAt ?? 0) - (a.pinnedAt ?? 0))
		: [];
	if (pinned && pins.length > 0) {
		month = "pinned";
		rows.push({ type: "heading", key: "heading-pinned", label: pinned });
		bucket = pins;
		flush();
	}
	for (const item of pinned ? items.filter((item) => !isPinned(item)) : items) {
		const key = format(item.createdAt, "yyyy-MM");
		if (key !== month) {
			flush();
			month = key;
			rows.push({
				type: "heading",
				key: `heading-${key}`,
				label:
					key === format(Date.now(), "yyyy-MM")
						? thisMonth
						: format(item.createdAt, "MMMM yyyy"),
			});
		}
		bucket.push(item);
	}
	flush();
	return rows;
};
