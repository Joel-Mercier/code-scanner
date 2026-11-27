import { File, Paths } from "expo-file-system";
import { strFromU8, strToU8, unzipSync, type Zippable, zipSync } from "fflate";
import {
	archivePath,
	documentFiles,
	InvalidBackupError,
	logoArchivePath,
	logoName,
	MANIFEST,
	makeManifest,
	parseManifest,
	relocateLogos,
} from "@/domain/library/backup";
import type { PersistedLibrary } from "@/domain/library/migrations";
import type { LibraryItem } from "@/domain/library/types";
import { format } from "@/lib/date";
import { readDocumentFile, writeDocumentFile } from "./documents";
import { logoFile, readLogo, writeLogo } from "./logos";

/**
 * Writes the whole library to a .zip in the cache: `library.json`, every
 * document's pages and PDF, and the codes' logos. Images and PDFs are stored
 * as they are (they're compressed already). Resolves to the archive's URI.
 */
export const writeBackup = async (
	library: PersistedLibrary,
	now = Date.now(),
) => {
	const entries: Zippable = {
		[MANIFEST]: strToU8(JSON.stringify(makeManifest(library, now))),
	};
	for (const item of Object.values(library.items)) {
		if (item.kind === "code" && item.style?.logo) {
			const bytes = await readLogo(item.style.logo);
			if (bytes) {
				entries[logoArchivePath(logoName(item.style.logo))] = [
					bytes,
					{ level: 0 },
				];
			}
		}
		if (item.kind !== "doc") continue;
		for (const name of documentFiles(item)) {
			const bytes = await readDocumentFile(item.id, name);
			if (bytes) entries[archivePath(item.id, name)] = [bytes, { level: 0 }];
		}
	}
	const target = new File(
		Paths.cache,
		`code-scanner-backup-${format(now, "yyyy-MM-dd")}.zip`,
	);
	await target.write(zipSync(entries, { level: 6 }));
	return target.uri;
};

/**
 * Opens a backup archive, its logos pointed at where they'll be restored.
 * Throws `InvalidBackupError` for any other file.
 */
export const readBackup = async (uri: string) => {
	let entries: Record<string, Uint8Array>;
	try {
		entries = unzipSync(await new File(uri).bytes());
	} catch {
		throw new InvalidBackupError();
	}
	const manifest = entries[MANIFEST];
	if (!manifest) throw new InvalidBackupError();
	const library = relocateLogos(
		parseManifest(strFromU8(manifest)),
		(path) => !!entries[path],
		(name) => logoFile(name).uri,
	);
	return { library, entries };
};

/** Copies the files of restored items (documents, logos) out of the archive. */
export const restoreFiles = async (
	items: LibraryItem[],
	entries: Record<string, Uint8Array>,
) => {
	for (const item of items) {
		if (item.kind === "code") {
			if (!item.style?.logo) continue;
			const name = logoName(item.style.logo);
			const bytes = entries[logoArchivePath(name)];
			if (bytes) await writeLogo(name, bytes);
			continue;
		}
		for (const name of documentFiles(item)) {
			const bytes = entries[archivePath(item.id, name)];
			if (bytes) await writeDocumentFile(item.id, name, bytes);
		}
	}
};
