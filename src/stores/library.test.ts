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
		pages: [`file:///${id}.jpg`],
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
		expect(saved.version).toBe(3);
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
