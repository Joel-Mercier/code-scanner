import { describeItem } from "@/features/codes/kinds";
import { catalogueNumber, type LibraryItem } from "@/stores/library";

export const itemTitle = (item: LibraryItem) =>
	item.kind === "doc" ? item.name : describeItem(item).title;

/** What kind of object it is: "Wi-Fi", "Code 128", or `docLabel`. */
export const itemKind = (item: LibraryItem, docLabel: string) =>
	String(item.kind === "doc" ? docLabel : describeItem(item).subtitle);

/** "042 · LINK", "041 · DOCUMENT" */
export const itemCaption = (item: LibraryItem, docLabel: string) =>
	`${catalogueNumber(item)} · ${itemKind(item, docLabel).toUpperCase()}`;
