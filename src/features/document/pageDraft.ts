import type { PageEdit } from "@/services/documents";

/** A page in the editor: one of the document's (`page`) or a new image. */
export type DraftPage = {
	key: string;
	uri: string;
	page?: string;
	/** Clockwise, 0, 90, 180 or 270. */
	rotation: number;
};

/** The document's pages, as the editor starts with them. */
export const draftOf = (pages: { page: string; uri: string }[]): DraftPage[] =>
	pages.map(({ page, uri }) => ({ key: page, uri, page, rotation: 0 }));

/** Turns a page a quarter clockwise. */
export const rotate = (draft: DraftPage[], key: string) =>
	draft.map((page) =>
		page.key === key ? { ...page, rotation: (page.rotation + 90) % 360 } : page,
	);

/** Removes a page; a document keeps at least one. */
export const remove = (draft: DraftPage[], key: string) =>
	draft.length <= 1 ? draft : draft.filter((page) => page.key !== key);

/** Moves a page `by` places (−1 earlier, +1 later), within the document. */
export const move = (draft: DraftPage[], key: string, by: number) => {
	const from = draft.findIndex((page) => page.key === key);
	const to = from + by;
	if (from < 0 || to < 0 || to >= draft.length) return draft;
	const next = [...draft];
	const [page] = next.splice(from, 1);
	next.splice(to, 0, page);
	return next;
};

/** Adds new images at the end. */
export const append = (
	draft: DraftPage[],
	uris: string[],
	keyOf: (uri: string, index: number) => string,
) => [
	...draft,
	...uris.map((uri, index) => ({ key: keyOf(uri, index), uri, rotation: 0 })),
];

/** Whether the draft differs from the document's `pages`. */
export const hasChanges = (draft: DraftPage[], pages: string[]) =>
	draft.length !== pages.length ||
	draft.some(
		(page, index) => page.page !== pages[index] || page.rotation !== 0,
	);

export const toEdits = (draft: DraftPage[]): PageEdit[] =>
	draft.map(({ uri, page, rotation }) => ({ uri, page, rotation }));
