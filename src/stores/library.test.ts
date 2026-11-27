import { LIBRARY_VERSION } from "@/domain/library/migrations";
import { storage } from "@/lib/storage";
import { deleteDocumentFiles } from "@/services/documents";
import { makeFolder } from "@/test/fixtures";
import useLibrary from "./library";

jest.mock("@/services/documents", () => ({ deleteDocumentFiles: jest.fn() }));

const library = () => useLibrary.getState();

const scan = (data: string, format = "qr" as const) =>
	library().addCode({ source: "scanner", format, data });

const doc = (id: string, folderId: string | null = null) =>
	library().addDocument({
		id,
		name: id,
		pages: [`${id}.jpg`],
		size: 1,
		folderId,
	});

/** a ── b ── c, and d at the top. */
const folderTree = () => {
	const a = library().createFolder({
		name: "A",
		color: "blue",
		icon: "folder",
		parentId: null,
	});
	const b = library().createFolder({ ...a, name: "B", parentId: a.id });
	const c = library().createFolder({ ...a, name: "C", parentId: b.id });
	const d = library().createFolder({ ...a, name: "D", parentId: null });
	return { a, b, c, d };
};

beforeEach(() => {
	useLibrary.setState({ items: {}, folders: {}, nextSeq: 1 });
	jest.clearAllMocks();
});
afterEach(() => jest.useRealTimers());

describe("codes", () => {
	it("numbers new codes in order of arrival", () => {
		expect(scan("one").seq).toBe(1);
		expect(scan("two").seq).toBe(2);
		expect(library().nextSeq).toBe(3);
		expect(Object.keys(library().items)).toHaveLength(2);
	});

	it("refreshes a code scanned again instead of duplicating it", () => {
		jest.useFakeTimers({ now: 1000 });
		const first = scan("same");
		library().moveItem(first.id, "folder");
		jest.setSystemTime(5000);
		const again = scan("same");

		expect(again).toMatchObject({
			id: first.id,
			seq: first.seq,
			folderId: "folder",
			createdAt: 5000,
		});
		expect(Object.keys(library().items)).toEqual([first.id]);
		expect(library().nextSeq).toBe(2);
	});

	it("keeps scanned and created copies of a code apart", () => {
		scan("same");
		library().addCode({ source: "created", format: "qr", data: "same" });
		scan("same", "code128" as never);
		expect(Object.keys(library().items)).toHaveLength(3);
	});

	it("saves into a folder when asked", () => {
		const code = library().addCode({
			source: "created",
			format: "qr",
			data: "x",
			folderId: "f",
		});
		expect(code.folderId).toBe("f");
		expect(scan("y").folderId).toBeNull();
	});
});

describe("items", () => {
	it("adds documents with the next number", () => {
		scan("one");
		expect(doc("d1")).toMatchObject({ kind: "doc", id: "d1", seq: 2 });
		expect(library().nextSeq).toBe(3);
	});

	it("renames and moves items, and ignores unknown ids", () => {
		const code = scan("x");
		library().renameItem(code.id, "Menu");
		library().moveItem(code.id, "f");
		expect(library().items[code.id]).toMatchObject({
			name: "Menu",
			folderId: "f",
		});

		const before = library().items;
		library().renameItem("missing", "Nope");
		library().moveItem("missing", "f");
		expect(library().items).toBe(before);
	});

	it("deletes a document with its files", () => {
		doc("d1");
		library().deleteItem("d1");
		expect(library().items).toEqual({});
		expect(deleteDocumentFiles).toHaveBeenCalledWith("d1");
	});

	it("deletes a code without touching files", () => {
		const code = scan("x");
		library().deleteItem(code.id);
		expect(library().items).toEqual({});
		expect(deleteDocumentFiles).not.toHaveBeenCalled();
	});
	it("moves several items at once, skipping unknown ids", () => {
		const one = scan("one");
		const two = scan("two");
		const three = scan("three");
		library().moveItems([one.id, two.id, "missing"], "f");
		expect(library().items[one.id].folderId).toBe("f");
		expect(library().items[two.id].folderId).toBe("f");
		expect(library().items[three.id].folderId).toBeNull();

		const before = library().items;
		library().moveItems(["missing"], "f");
		expect(library().items).toBe(before);
	});

	it("deletes several items at once, with their documents' files", () => {
		const code = scan("x");
		const kept = scan("kept");
		doc("d1");
		library().deleteItems([code.id, "d1", "missing"]);
		expect(Object.keys(library().items)).toEqual([kept.id]);
		expect(jest.mocked(deleteDocumentFiles).mock.calls).toEqual([["d1"]]);

		const before = library().items;
		library().deleteItems(["missing"]);
		expect(library().items).toBe(before);
	});
});

describe("documents", () => {
	const reading = { text: "Hello", codes: [] };

	it("updates details, dropping readings of pages that left", () => {
		doc("d");
		library().setReading("d", "d.jpg", reading);
		library().updateDocument("d", {
			docType: "receipt",
			notes: "Lunch",
			pages: ["new.jpg"],
			pdf: "document.pdf",
			size: 9,
		});
		expect(library().items.d).toMatchObject({
			docType: "receipt",
			notes: "Lunch",
			pages: ["new.jpg"],
			pdf: "document.pdf",
			size: 9,
			readings: {},
		});
	});

	it("clears the type and empty notes", () => {
		doc("d");
		library().updateDocument("d", { docType: "receipt", notes: "x" });
		library().updateDocument("d", { docType: undefined, notes: "  " });
		expect(library().items.d).not.toHaveProperty("docType");
		expect(library().items.d).not.toHaveProperty("notes");
	});

	it("keeps readings only for pages still there", () => {
		doc("d");
		library().setReading("d", "d.jpg", reading);
		library().setReading("d", "gone.jpg", reading);
		expect(library().items.d).toMatchObject({ readings: { "d.jpg": reading } });
	});

	it("ignores codes and unknown ids", () => {
		const code = scan("x");
		library().updateDocument(code.id, { notes: "nope" });
		library().updateDocument("missing", { notes: "nope" });
		library().setReading(code.id, "p", reading);
		expect(library().items[code.id]).not.toHaveProperty("notes");
		expect(library().items.missing).toBeUndefined();
	});
});

describe("pins", () => {
	it("pins in the picked order (the first on top) and unpins", () => {
		jest.useFakeTimers({ now: 1000 });
		const a = scan("a");
		const b = scan("b");
		library().setPinned([a.id, b.id, "missing"], true);
		const pinnedA = library().items[a.id].pinnedAt ?? 0;
		const pinnedB = library().items[b.id].pinnedAt ?? 0;
		expect(pinnedA).toBeGreaterThan(pinnedB);
		expect(library().items.missing).toBeUndefined();

		library().setPinned([a.id], false);
		expect(library().items[a.id]).not.toHaveProperty("pinnedAt");
		expect(library().items[b.id].pinnedAt).toBe(pinnedB);
	});
});

describe("restore", () => {
	it("adds a backup's new items and folders, numbered after ours", () => {
		scan("mine");
		const added = library().restore({
			items: {
				t: {
					kind: "code",
					id: "t",
					seq: 7,
					folderId: "tf",
					createdAt: 5,
					source: "scanner",
					format: "qr",
					data: "theirs",
				},
			},
			folders: { tf: makeFolder({ id: "tf" }) },
			nextSeq: 8,
		});
		expect(added.map((item) => item.id)).toEqual(["t"]);
		expect(library().items.t).toMatchObject({ seq: 2, folderId: "tf" });
		expect(library().folders.tf).toBeDefined();
		expect(library().nextSeq).toBe(3);
	});
});

describe("folders", () => {
	it("creates and updates folders", () => {
		const { a } = folderTree();
		expect(a).toMatchObject({
			name: "A",
			parentId: null,
			id: expect.any(String),
		});
		library().updateFolder(a.id, { name: "Travel", color: "rose" });
		expect(library().folders[a.id]).toMatchObject({
			name: "Travel",
			color: "rose",
			icon: "folder",
		});
	});

	it("moves a folder under another one", () => {
		const { c, d } = folderTree();
		library().moveFolder(c.id, d.id);
		expect(library().folders[c.id].parentId).toBe(d.id);
		library().moveFolder(c.id, null);
		expect(library().folders[c.id].parentId).toBeNull();
	});

	it("refuses to move a folder into itself or its descendants", () => {
		const { a, c } = folderTree();
		const before = library().folders;
		library().moveFolder(a.id, c.id);
		library().moveFolder(a.id, a.id);
		expect(library().folders).toBe(before);
	});

	it("can delete a folder but keep its contents in the parent", () => {
		const { a, b, c } = folderTree();
		const code = library().addCode({
			source: "scanner",
			format: "qr",
			data: "x",
			folderId: b.id,
		});

		library().deleteFolder(b.id, true);

		expect(library().folders[b.id]).toBeUndefined();
		expect(library().folders[c.id].parentId).toBe(a.id);
		expect(library().items[code.id].folderId).toBe(a.id);
		expect(deleteDocumentFiles).not.toHaveBeenCalled();
	});

	it("can delete a folder with everything inside it", () => {
		const { a, b, c, d } = folderTree();
		doc("in-b", b.id);
		doc("in-c", c.id);
		doc("in-d", d.id);
		const outside = scan("top");

		library().deleteFolder(a.id, false);

		expect(Object.keys(library().folders)).toEqual([d.id]);
		expect(Object.keys(library().items).sort()).toEqual(
			["in-d", outside.id].sort(),
		);
		expect(jest.mocked(deleteDocumentFiles).mock.calls.flat().sort()).toEqual([
			"in-b",
			"in-c",
		]);
	});

	it("ignores unknown folders", () => {
		folderTree();
		const before = library();
		library().updateFolder("missing", { name: "x" });
		library().moveFolder("missing", null);
		library().deleteFolder("missing", false);
		expect(library().folders).toBe(before.folders);
	});
});

describe("persistence", () => {
	it("saves the data (not the actions) under 'library', at the current version", () => {
		useLibrary.setState({
			folders: { f: makeFolder({ id: "f" }) },
		});
		scan("saved");
		const saved = JSON.parse(storage.getString("library") ?? "{}");
		expect(saved.version).toBe(LIBRARY_VERSION);
		expect(Object.keys(saved.state).sort()).toEqual([
			"folders",
			"items",
			"nextSeq",
		]);
		expect(Object.values(saved.state.items)).toEqual([
			expect.objectContaining({ data: "saved" }),
		]);
	});

	it("migrates older data when it loads", async () => {
		storage.set(
			"library",
			JSON.stringify({
				version: 2,
				state: {
					items: {
						x: {
							kind: "code",
							id: "x",
							seq: 1,
							folderId: null,
							createdAt: 0,
							source: "scanner",
							format: 32,
							data: "5901234123457",
						},
					},
					folders: {},
					nextSeq: 2,
				},
			}),
		);
		await useLibrary.persist.rehydrate();
		expect(library().items.x).toMatchObject({ format: "ean13" });
		expect(library().nextSeq).toBe(2);
	});
});
