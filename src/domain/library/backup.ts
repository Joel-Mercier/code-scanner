import {
	LIBRARY_VERSION,
	migrateLibrary,
	type PersistedLibrary,
} from "./migrations";
import type { CodeItem, DocItem, Folder, LibraryItem } from "./types";

/** Marks a backup's manifest, so any other JSON is refused. */
export const BACKUP_FORMAT = "code-scanner-backup";

/** The manifest's path inside a backup archive. */
export const MANIFEST = "library.json";

export type BackupManifest = {
	format: typeof BACKUP_FORMAT;
	/** The library version the data is in. */
	version: number;
	exportedAt: number;
	library: PersistedLibrary;
};

export const makeManifest = (
	library: PersistedLibrary,
	exportedAt: number,
): BackupManifest => ({
	format: BACKUP_FORMAT,
	version: LIBRARY_VERSION,
	exportedAt,
	library: {
		items: library.items,
		folders: library.folders,
		nextSeq: library.nextSeq,
	},
});

export class InvalidBackupError extends Error {
	constructor() {
		super("Not a Code Scanner backup");
		this.name = "InvalidBackupError";
	}
}

/**
 * Reads a manifest, bringing older backups up to the current version.
 * Throws `InvalidBackupError` for anything that isn't one.
 */
export const parseManifest = (json: string): PersistedLibrary => {
	let manifest: Partial<BackupManifest>;
	try {
		manifest = JSON.parse(json);
	} catch {
		throw new InvalidBackupError();
	}
	if (
		manifest?.format !== BACKUP_FORMAT ||
		typeof manifest.version !== "number" ||
		manifest.version > LIBRARY_VERSION ||
		typeof manifest.library !== "object" ||
		manifest.library === null
	) {
		throw new InvalidBackupError();
	}
	const library = migrateLibrary(manifest.library, manifest.version);
	return {
		items: library.items ?? {},
		folders: library.folders ?? {},
		nextSeq: library.nextSeq ?? 1,
	};
};

/** Where a document's file sits in an archive. */
export const archivePath = (docId: string, file: string) =>
	`documents/${docId}/${file}`;

/** Where a code's logo sits in an archive. */
export const logoArchivePath = (name: string) => `logos/${name}`;

/** A logo's file name, from its URI. */
export const logoName = (uri: string) => uri.split("/").pop() ?? uri;

/**
 * Points the backup's code logos at `uriOf(name)` (where they'll be restored),
 * or drops the logo when the archive doesn't hold it.
 */
export const relocateLogos = (
	library: PersistedLibrary,
	has: (path: string) => boolean,
	uriOf: (name: string) => string,
): PersistedLibrary => {
	const items: Record<string, LibraryItem> = {};
	for (const item of Object.values(library.items)) {
		if (item.kind !== "code" || !item.style?.logo) {
			items[item.id] = item;
			continue;
		}
		const name = logoName(item.style.logo);
		const { logo: _, ...style } = item.style;
		items[item.id] = {
			...item,
			style: has(logoArchivePath(name))
				? { ...style, logo: uriOf(name) }
				: style,
		};
	}
	return { ...library, items };
};

/** The files a document owns: its pages, then its PDF. */
export const documentFiles = (doc: Pick<DocItem, "pages" | "pdf">) => [
	...doc.pages,
	...(doc.pdf ? [doc.pdf] : []),
];

const sameCode = (a: CodeItem, b: CodeItem) =>
	a.source === b.source && a.data === b.data && a.format === b.format;

export type MergeResult = {
	library: PersistedLibrary;
	/** The backup's items that were added. */
	added: LibraryItem[];
	/** The backup's documents that were added (their files must be copied). */
	addedDocs: DocItem[];
};

/**
 * Adds a backup to the current library without touching what's there:
 * folders and items it already has (same id, or the same code) are skipped.
 * New items get the next catalogue numbers, in their order of arrival;
 * folders that didn't come along fall back to the root.
 */
export const mergeLibrary = (
	current: PersistedLibrary,
	backup: PersistedLibrary,
): MergeResult => {
	const folders: Record<string, Folder> = { ...current.folders };
	for (const folder of Object.values(backup.folders)) {
		if (!folders[folder.id]) folders[folder.id] = folder;
	}
	for (const folder of Object.values(folders)) {
		if (folder.parentId && !folders[folder.parentId]) {
			folders[folder.id] = { ...folder, parentId: null };
		}
	}

	const items: Record<string, LibraryItem> = { ...current.items };
	const codes = Object.values(items).filter(
		(item): item is CodeItem => item.kind === "code",
	);
	const incoming = Object.values(backup.items)
		.filter((item) => !items[item.id])
		.filter(
			(item) =>
				item.kind !== "code" || !codes.some((code) => sameCode(code, item)),
		)
		.sort((a, b) => a.createdAt - b.createdAt);

	let nextSeq = current.nextSeq;
	const added: LibraryItem[] = [];
	for (const item of incoming) {
		const folderId =
			item.folderId && folders[item.folderId] ? item.folderId : null;
		const next = { ...item, seq: nextSeq++, folderId } as LibraryItem;
		items[next.id] = next;
		added.push(next);
	}

	return {
		library: { items, folders, nextSeq },
		added,
		addedDocs: added.filter((item): item is DocItem => item.kind === "doc"),
	};
};
