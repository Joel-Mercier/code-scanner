import { requireOptionalNativeModule } from "expo";
import { Directory, File } from "expo-file-system";
import { Platform } from "react-native";
import {
	autoBackupFileName,
	backupsToPrune,
} from "@/domain/library/autoBackup";
import type { PersistedLibrary } from "@/domain/library/migrations";
import { entryName, isRestrictedTreeUri, isSupportedTreeUri } from "@/lib/saf";
import { writeBackup } from "./backup";

/**
 * The OS side of automatic backups (`modules/auto-backup`, Android only):
 * WorkManager runs a job each day at the chosen time, even with the app
 * closed. The job first reads a native `pending` flag, raised by JS when the
 * library changes, so on a day nothing changed it ends without starting JS.
 * Otherwise it starts JS if needed and sends `due`; JS answers `reportDone`.
 *
 * `null` in tests, on iOS and on builds without the module: every call is
 * guarded.
 */
type AutoBackupNative = {
	schedule(hour: number, minute: number): void;
	cancel(): void;
	setPending(pending: boolean): void;
	isPending(): boolean;
	notifyReady(): void;
	reportDone(): void;
	addListener(event: "due", listener: () => void): { remove: () => void };
};

const Native =
	Platform.OS === "android"
		? requireOptionalNativeModule<AutoBackupNative>("AutoBackup")
		: null;

export const isAutoBackupAvailable = () => Native !== null;

export const scheduleAutoBackup = (minuteOfDay: number) =>
	Native?.schedule(Math.floor(minuteOfDay / 60), minuteOfDay % 60);

export const cancelAutoBackup = () => Native?.cancel();

export const setAutoBackupPending = (pending: boolean) =>
	Native?.setPending(pending);

export const isAutoBackupPending = () => Native?.isPending() ?? false;

/** Listens for the day's slot; resolves the listener's removal. */
export const onAutoBackupDue = (listener: () => void) => {
	const subscription = Native?.addListener("due", listener);
	return () => subscription?.remove();
};

/** JS is listening: a slot waiting on a cold start is handed over now. */
export const notifyAutoBackupReady = () => Native?.notifyReady();

export const reportAutoBackupDone = () => Native?.reportDone();

const PROBE = "code-scanner-write-test.tmp";

/**
 * Whether the folder can still be written to: the grant can be taken back
 * in Android's settings, and an SD card can go. Creating a file is the only
 * real test (`exists` can't tell a read-only folder from a writable one).
 */
export const canWriteFolder = (uri: string) => {
	try {
		const folder = new Directory(uri);
		if (!folder.exists) return false;
		const probe = folder.createFile(PROBE, "application/octet-stream");
		if (probe.exists) probe.delete();
		return true;
	} catch {
		return false;
	}
};

export type FolderProblem = "restricted" | "unsupported" | "unwritable";

/**
 * Asks for a folder. Resolves to its URI, to what is wrong with it, or to
 * `null` when the picker was closed.
 */
export const pickBackupFolder = async (): Promise<
	{ uri: string } | { problem: FolderProblem } | null
> => {
	let picked: Directory;
	try {
		picked = await Directory.pickDirectoryAsync();
	} catch {
		// Closing the picker rejects too.
		return null;
	}
	if (isRestrictedTreeUri(picked.uri)) return { problem: "restricted" };
	if (!isSupportedTreeUri(picked.uri)) return { problem: "unsupported" };
	if (!canWriteFolder(picked.uri)) return { problem: "unwritable" };
	return { uri: picked.uri };
};

const ownFiles = (folder: Directory) =>
	folder
		.list()
		.filter((entry): entry is File => entry instanceof File)
		.map((file) => ({ file, name: entryName(file.uri) }));

/**
 * Writes a backup of `library` into the folder, then deletes the oldest of
 * ours beyond `keep`. Anything else in the folder is never touched.
 */
export const writeAutoBackup = async (
	folderUri: string,
	library: PersistedLibrary,
	keep: number,
	now = Date.now(),
) => {
	const folder = new Directory(folderUri);
	const name = autoBackupFileName(now);
	// Made in the cache, then copied over in one go: a SAF file can't be
	// renamed, so this keeps a half-written backup out of the folder.
	const staged = new File(await writeBackup(library, now, name));
	try {
		await staged.copy(folder);
	} catch (error) {
		for (const entry of ownFiles(folder)) {
			if (entry.name === name) entry.file.delete();
		}
		throw error;
	} finally {
		if (staged.exists) staged.delete();
	}
	const entries = ownFiles(folder);
	const doomed = new Set(
		backupsToPrune(
			entries.map((entry) => entry.name),
			keep,
		),
	);
	for (const entry of entries) {
		if (!doomed.has(entry.name)) continue;
		try {
			entry.file.delete();
		} catch {}
	}
};
