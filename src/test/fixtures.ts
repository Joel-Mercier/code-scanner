import type { CodeItem, DocItem, Folder } from "@/domain/library/types";

/** Test data builders: sensible defaults, override what the test is about. */

export const makeFolder = (
	overrides: Partial<Folder> & { id: string },
): Folder => ({
	name: overrides.id,
	color: "blue",
	icon: "folder",
	parentId: null,
	createdAt: 0,
	...overrides,
});

export const makeCode = (overrides: Partial<CodeItem> = {}): CodeItem => ({
	kind: "code",
	id: "code",
	seq: 1,
	folderId: null,
	createdAt: 0,
	source: "scanner",
	format: "qr",
	data: "hello",
	...overrides,
});

export const makeDoc = (overrides: Partial<DocItem> = {}): DocItem => ({
	kind: "doc",
	id: "doc",
	seq: 1,
	folderId: null,
	createdAt: 0,
	name: "Scan",
	pages: ["page-1.jpg"],
	size: 100,
	...overrides,
});

/** A record keyed by id, as the store holds them. */
export const byId = <T extends { id: string }>(
	...list: T[]
): Record<string, T> =>
	Object.fromEntries(list.map((entry) => [entry.id, entry]));
