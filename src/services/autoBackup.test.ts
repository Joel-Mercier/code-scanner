import { unzipSync } from "fflate";
import type { LibraryItem } from "@/domain/library/types";
import {
	FakeDirectory as Directory,
	fileSystem,
	pickDirectory,
} from "@/test/fileSystem";
import { byId, makeCode } from "@/test/fixtures";
import {
	canWriteFolder,
	isAutoBackupAvailable,
	pickBackupFolder,
	scheduleAutoBackup,
	writeAutoBackup,
} from "./autoBackup";

const FOLDER =
	"content://com.android.externalstorage.documents/tree/primary%3ABackups";
const library = {
	items: byId<LibraryItem>(makeCode({ id: "c" })),
	folders: {},
	nextSeq: 2,
};
const at = (day: number) => new Date(2026, 10, day, 3, 0, 0).getTime();
const backup = (day: number) =>
	`${FOLDER}/code-scanner-auto-backup-202611${String(day).padStart(2, "0")}-030000.zip`;

beforeEach(() => {
	fileSystem.reset();
	fileSystem.mkdir(FOLDER);
});

describe("native side", () => {
	it("is missing in tests, and every call is a no-op", () => {
		expect(isAutoBackupAvailable()).toBe(false);
		expect(() => scheduleAutoBackup(180)).not.toThrow();
	});
});

describe("canWriteFolder", () => {
	it("writes a probe and takes it away", () => {
		expect(canWriteFolder(FOLDER)).toBe(true);
		expect(fileSystem.list()).toEqual([]);
	});

	it("is false for a folder that's gone", () => {
		expect(canWriteFolder(`${FOLDER}%2FGone`)).toBe(false);
	});
});

describe("pickBackupFolder", () => {
	it("takes a folder on the phone's storage", async () => {
		pickDirectory.mockImplementationOnce(async () => {
			fileSystem.mkdir(FOLDER);
			return new Directory(FOLDER);
		});
		await expect(pickBackupFolder()).resolves.toEqual({ uri: FOLDER });
	});

	it("says what's wrong with the others, and null when closed", async () => {
		const restricted =
			"content://com.android.externalstorage.documents/tree/primary%3ADownload";
		pickDirectory.mockImplementationOnce(async () => new Directory(restricted));
		await expect(pickBackupFolder()).resolves.toEqual({
			problem: "restricted",
		});

		pickDirectory.mockImplementationOnce(
			async () =>
				new Directory("content://com.google.android.apps.docs/tree/x"),
		);
		await expect(pickBackupFolder()).resolves.toEqual({
			problem: "unsupported",
		});

		pickDirectory.mockImplementationOnce(
			async () => new Directory(`${FOLDER}%2FReadOnly`),
		);
		await expect(pickBackupFolder()).resolves.toEqual({
			problem: "unwritable",
		});

		pickDirectory.mockImplementationOnce(async () => {
			throw new Error("cancelled");
		});
		await expect(pickBackupFolder()).resolves.toBeNull();
	});
});

describe("writeAutoBackup", () => {
	it("puts a dated backup in the folder and leaves nothing in the cache", async () => {
		await writeAutoBackup(FOLDER, library, 7, at(27));
		expect(fileSystem.list()).toEqual([backup(27)]);
		const archive = unzipSync(fileSystem.read(backup(27)) as Uint8Array);
		expect(Object.keys(archive)).toEqual(["library.json"]);
	});

	it("deletes our oldest backups beyond the ones to keep, nothing else", async () => {
		fileSystem.seed(backup(24));
		fileSystem.seed(backup(25));
		fileSystem.seed(backup(26));
		fileSystem.seed(`${FOLDER}/holiday.jpg`);
		fileSystem.seed(`${FOLDER}/code-scanner-backup-2026-11-01.zip`);
		await writeAutoBackup(FOLDER, library, 2, at(27));
		expect(fileSystem.list()).toEqual([
			backup(26),
			backup(27),
			`${FOLDER}/code-scanner-backup-2026-11-01.zip`,
			`${FOLDER}/holiday.jpg`,
		]);
	});

	it("leaves no half backup behind when the copy fails", async () => {
		fileSystem.seed(backup(26));
		fileSystem.failCopiesTo(backup(27));
		await expect(writeAutoBackup(FOLDER, library, 1, at(27))).rejects.toThrow();
		expect(fileSystem.list()).toEqual([backup(26)]);
	});
});
