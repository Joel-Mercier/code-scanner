import {
	append,
	draftOf,
	hasChanges,
	move,
	remove,
	rotate,
	toEdits,
} from "./pageDraft";

const pages = ["a.jpg", "b.jpg", "c.jpg"];
const start = draftOf(pages.map((page) => ({ page, uri: `file:///${page}` })));
const keys = (draft: { key: string }[]) => draft.map((page) => page.key);

describe("page draft", () => {
	it("starts as the document, unchanged", () => {
		expect(keys(start)).toEqual(pages);
		expect(hasChanges(start, pages)).toBe(false);
	});

	it("turns a page a quarter at a time, back to 0 after four", () => {
		let draft = rotate(start, "b.jpg");
		expect(draft[1].rotation).toBe(90);
		expect(hasChanges(draft, pages)).toBe(true);
		draft = rotate(rotate(rotate(draft, "b.jpg"), "b.jpg"), "b.jpg");
		expect(draft[1].rotation).toBe(0);
		expect(hasChanges(draft, pages)).toBe(false);
	});

	it("moves pages within the document", () => {
		expect(keys(move(start, "a.jpg", 1))).toEqual(["b.jpg", "a.jpg", "c.jpg"]);
		expect(keys(move(start, "c.jpg", -2))).toEqual(["c.jpg", "a.jpg", "b.jpg"]);
		expect(move(start, "a.jpg", -1)).toBe(start);
		expect(move(start, "c.jpg", 1)).toBe(start);
		expect(move(start, "missing", 1)).toBe(start);
	});

	it("removes pages but keeps the last one", () => {
		const one = remove(remove(start, "a.jpg"), "b.jpg");
		expect(keys(one)).toEqual(["c.jpg"]);
		expect(remove(one, "c.jpg")).toBe(one);
		expect(hasChanges(one, pages)).toBe(true);
	});

	it("adds new images at the end, as new pages", () => {
		const draft = append(
			start,
			["file:///new1.jpg", "file:///new2.jpg"],
			(_, i) => `n${i}`,
		);
		expect(keys(draft)).toEqual([...pages, "n0", "n1"]);
		expect(hasChanges(draft, pages)).toBe(true);
		expect(toEdits(draft).slice(-2)).toEqual([
			{ uri: "file:///new1.jpg", page: undefined, rotation: 0 },
			{ uri: "file:///new2.jpg", page: undefined, rotation: 0 },
		]);
	});

	it("turns into edits for the document's files", () => {
		expect(toEdits(rotate(start, "a.jpg"))[0]).toEqual({
			uri: "file:///a.jpg",
			page: "a.jpg",
			rotation: 90,
		});
	});
});
