import { strToU8, unzipSync, zipSync } from "fflate";
import { InvalidBackupError } from "@/domain/library/backup";
import { LIBRARY_VERSION } from "@/domain/library/migrations";
import type { LibraryItem } from "@/domain/library/types";
import { fileSystem } from "@/test/fileSystem";
import { byId, makeCode, makeDoc, makeFolder } from "@/test/fixtures";
import { readBackup, restoreFiles, writeBackup } from "./backup";

const DIR = "file:///document/documents";

beforeEach(() => fileSystem.reset());

const library = {
	items: byId<LibraryItem>(
		makeCode({ id: "c" }),
		makeDoc({ id: "d", pages: ["p1.jpg", "missing.jpg"], pdf: "document.pdf" }),
	),
	folders: byId(makeFolder({ id: "f" })),
	nextSeq: 3,
};

describe("writeBackup", () => {
	it("zips the manifest and every document file that exists", async () => {
		fileSystem.seed(`${DIR}/d/p1.jpg`, new Uint8Array([1, 2, 3]));
		fileSystem.seed(`${DIR}/d/document.pdf`, new Uint8Array([4]));
		const uri = await writeBackup(library, new Date(2026, 10, 27).getTime());
		expect(uri).toBe("file:///cache/code-scanner-backup-2026-11-27.zip");

		const archive = unzipSync(fileSystem.read(uri) as Uint8Array);
		expect(Object.keys(archive).sort()).toEqual([
			"documents/d/document.pdf",
			"documents/d/p1.jpg",
			"library.json",
		]);
		expect([...archive["documents/d/p1.jpg"]]).toEqual([1, 2, 3]);
		const manifest = JSON.parse(
			new TextDecoder().decode(archive["library.json"]),
		);
		expect(manifest).toMatchObject({
			format: "code-scanner-backup",
			version: LIBRARY_VERSION,
			library,
		});
	});
});

describe("logos", () => {
	it("travel with the backup and land in the logos folder", async () => {
		fileSystem.seed("file:///old/logos/cat.png", new Uint8Array([7]));
		const withLogo = {
			items: byId<LibraryItem>(
				makeCode({
					id: "l",
					style: { color: "ink", logo: "file:///old/logos/cat.png" },
				}),
			),
			folders: {},
			nextSeq: 2,
		};
		const uri = await writeBackup(withLogo);
		const archive = fileSystem.read(uri) as Uint8Array;
		fileSystem.reset();
		fileSystem.seed(uri, archive);

		const { library: restored, entries } = await readBackup(uri);
		expect(restored.items.l).toMatchObject({
			style: { logo: "file:///document/logos/cat.png" },
		});
		await restoreFiles(Object.values(restored.items), entries);
		expect([
			...(fileSystem.read("file:///document/logos/cat.png") ?? []),
		]).toEqual([7]);
	});
});

describe("readBackup / restoreFiles", () => {
	it("round-trips a backup", async () => {
		fileSystem.seed(`${DIR}/d/p1.jpg`, new Uint8Array([9]));
		const uri = await writeBackup(library);
		// A new phone: only the archive is there.
		const archive = fileSystem.read(uri) as Uint8Array;
		fileSystem.reset();
		fileSystem.seed(uri, archive);

		const { library: restored, entries } = await readBackup(uri);
		expect(restored).toEqual(library);
		await restoreFiles([restored.items.d], entries);
		expect([...(fileSystem.read(`${DIR}/d/p1.jpg`) ?? [])]).toEqual([9]);
		expect(fileSystem.has(`${DIR}/d/missing.jpg`)).toBe(false);
	});

	it("refuses files that aren't backups", async () => {
		fileSystem.seed("file:///cache/random.zip", new Uint8Array([1, 2, 3]));
		await expect(readBackup("file:///cache/random.zip")).rejects.toBeInstanceOf(
			InvalidBackupError,
		);
		fileSystem.seed(
			"file:///cache/other.zip",
			zipSync({ "a.txt": strToU8("hi") }),
		);
		await expect(readBackup("file:///cache/other.zip")).rejects.toBeInstanceOf(
			InvalidBackupError,
		);
	});
});
