import { byId, makeCode, makeDoc, makeFolder } from "@/test/fixtures";
import {
	archivePath,
	BACKUP_FORMAT,
	documentFiles,
	InvalidBackupError,
	logoArchivePath,
	makeManifest,
	mergeLibrary,
	parseManifest,
	relocateLogos,
} from "./backup";
import { LIBRARY_VERSION } from "./migrations";
import type { LibraryItem } from "./types";

describe("manifests", () => {
	const library = {
		items: byId<LibraryItem>(makeCode({ id: "c" })),
		folders: byId(makeFolder({ id: "f" })),
		nextSeq: 2,
	};

	it("round-trip", () => {
		const manifest = makeManifest(library, 123);
		expect(manifest).toEqual({
			format: BACKUP_FORMAT,
			version: LIBRARY_VERSION,
			exportedAt: 123,
			library,
		});
		expect(parseManifest(JSON.stringify(manifest))).toEqual(library);
	});

	it("bring older backups up to date", () => {
		const old = {
			format: BACKUP_FORMAT,
			version: 3,
			exportedAt: 0,
			library: {
				items: byId({
					...makeDoc({ id: "d", pages: ["file:///old/documents/d/p.jpg"] }),
					pdfUri: "file:///old/documents/d/document.pdf",
				}),
				folders: {},
				nextSeq: 2,
			},
		};
		expect(parseManifest(JSON.stringify(old)).items.d).toMatchObject({
			pages: ["p.jpg"],
			pdf: "document.pdf",
		});
	});

	it("refuse anything else", () => {
		for (const json of [
			"not json",
			"{}",
			JSON.stringify({ format: "other", version: 1, library: {} }),
			JSON.stringify({
				format: BACKUP_FORMAT,
				version: LIBRARY_VERSION + 1,
				library: {},
			}),
			JSON.stringify({ format: BACKUP_FORMAT, version: 4, library: null }),
		]) {
			expect(() => parseManifest(json)).toThrow(InvalidBackupError);
		}
	});
});

describe("archive layout", () => {
	it("lists a document's files under its id", () => {
		expect(documentFiles(makeDoc({ pages: ["a", "b"], pdf: "d.pdf" }))).toEqual(
			["a", "b", "d.pdf"],
		);
		expect(documentFiles(makeDoc({ pages: ["a"] }))).toEqual(["a"]);
		expect(archivePath("doc", "a.jpg")).toBe("documents/doc/a.jpg");
	});
});

describe("relocateLogos", () => {
	it("points logos at their new place, or drops the missing ones", () => {
		const library = {
			items: byId<LibraryItem>(
				makeCode({
					id: "a",
					style: { color: "ink", logo: "file:///old/logos/a.png" },
				}),
				makeCode({
					id: "b",
					style: { color: "ink", logo: "file:///old/logos/gone.png" },
				}),
				makeCode({ id: "c" }),
				makeDoc({ id: "d" }),
			),
			folders: {},
			nextSeq: 5,
		};
		const moved = relocateLogos(
			library,
			(path) => path === logoArchivePath("a.png"),
			(name) => `file:///new/logos/${name}`,
		);
		expect(moved.items.a).toMatchObject({
			style: { color: "ink", logo: "file:///new/logos/a.png" },
		});
		expect(moved.items.b).toMatchObject({ style: { color: "ink" } });
		expect(moved.items.b).not.toHaveProperty("style.logo");
		expect(moved.items.c).toBe(library.items.c);
		expect(moved.items.d).toBe(library.items.d);
	});
});

describe("mergeLibrary", () => {
	const current = {
		items: byId<LibraryItem>(
			makeCode({ id: "here", seq: 1, data: "same", createdAt: 1 }),
			makeDoc({ id: "doc", seq: 2 }),
		),
		folders: byId(makeFolder({ id: "f", name: "Mine" })),
		nextSeq: 3,
	};

	it("adds what's missing, numbered after what's here", () => {
		const backup = {
			items: byId<LibraryItem>(
				makeCode({ id: "dup-id", seq: 9, data: "same", createdAt: 5 }),
				makeDoc({ id: "doc", seq: 9, name: "Theirs" }),
				makeDoc({ id: "new-doc", seq: 1, createdAt: 30, folderId: "g" }),
				makeCode({
					id: "new-code",
					seq: 2,
					data: "other",
					createdAt: 20,
					folderId: "gone",
				}),
			),
			folders: byId(
				makeFolder({ id: "f", name: "Theirs" }),
				makeFolder({ id: "g", parentId: "missing" }),
			),
			nextSeq: 50,
		};
		const { library, added, addedDocs } = mergeLibrary(current, backup);

		expect(added.map((item) => [item.id, item.seq])).toEqual([
			["new-code", 3],
			["new-doc", 4],
		]);
		expect(addedDocs.map((doc) => doc.id)).toEqual(["new-doc"]);
		expect(library.nextSeq).toBe(5);
		// Nothing here is replaced.
		expect(library.items.doc).toBe(current.items.doc);
		expect(library.folders.f.name).toBe("Mine");
		expect(library.items["dup-id"]).toBeUndefined();
		// Folders that didn't come along fall back to the root.
		expect(library.items["new-code"].folderId).toBeNull();
		expect(library.items["new-doc"].folderId).toBe("g");
		expect(library.folders.g.parentId).toBeNull();
	});

	it("changes nothing for a backup of the same library", () => {
		const { library, added } = mergeLibrary(current, current);
		expect(added).toEqual([]);
		expect(library).toEqual(current);
	});
});
