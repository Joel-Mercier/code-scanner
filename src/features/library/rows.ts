import { describeItem, qrKinds } from "@/domain/codes/describe";
import { itemTitle } from "@/domain/library/items";
import type { Folder, LibraryItem } from "@/domain/library/types";
import { format } from "@/lib/date";

export type Filter = "all" | "codes" | "docs" | "folders";

/** Every kind of object the collection can hold, in the kind strip's order. */
export const KINDS = [...qrKinds, "barcode", "doc"] as const;
export type Kind = (typeof KINDS)[number];

export const kindOf = (item: LibraryItem): Kind =>
	item.kind === "doc" ? "doc" : describeItem(item).kind;

export const matchesFilter = (item: LibraryItem, filter: Filter) =>
	filter === "all" ||
	(filter === "codes" ? item.kind === "code" : item.kind === "doc");

export const matchesFolder = (folder: Folder, query: string) =>
	folder.name.toLowerCase().includes(query.toLowerCase());

/** Title, then a code's content and kind. */
export const matchesQuery = (item: LibraryItem, query: string) => {
	const needle = query.toLowerCase();
	if (itemTitle(item).toLowerCase().includes(needle)) return true;
	if (item.kind === "code") {
		return (
			item.data.toLowerCase().includes(needle) ||
			describeItem(item).subtitle.toLowerCase().includes(needle)
		);
	}
	return false;
};

/** Up to this many tiles per row. */
export const COLUMNS = 3;

export type Row =
	| { type: "heading"; key: string; label: string }
	| { type: "items"; key: string; items: LibraryItem[]; offset: number };

/**
 * Groups items (newest first) by month, then into rows of `COLUMNS`. `offset`
 * is the index of a row's first item, for staggering.
 */
export const toRows = (items: LibraryItem[], thisMonth: string): Row[] => {
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
	for (const item of items) {
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
