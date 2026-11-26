import type { Href } from "expo-router";
import type { LibraryItem } from "@/domain/library/types";

/** The detail screen of an item. */
export const itemHref = (item: LibraryItem): Href =>
	item.kind === "doc"
		? { pathname: "/document/[id]", params: { id: item.id } }
		: { pathname: "/code/[id]", params: { id: item.id } };

/** A folder of the collection, or its root. */
export const folderHref = (folderId: string | null): Href =>
	folderId
		? { pathname: "/library/[folderId]", params: { folderId } }
		: "/library";
