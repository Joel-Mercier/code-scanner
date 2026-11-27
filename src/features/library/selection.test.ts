import { makeCode, makeDoc } from "@/test/fixtures";
import {
	allSelected,
	emptySelection,
	selectedIn,
	sharedFolder,
	toggleSelected,
} from "./selection";

const a = makeCode({ id: "a" });
const b = makeDoc({ id: "b" });
const c = makeCode({ id: "c", folderId: "f" });

describe("selection", () => {
	it("toggles an id in and out without mutating the selection", () => {
		const one = toggleSelected(emptySelection, "a");
		expect([...one]).toEqual(["a"]);
		expect(emptySelection.size).toBe(0);
		expect([...toggleSelected(one, "b")]).toEqual(["a", "b"]);
		expect(toggleSelected(one, "a").size).toBe(0);
	});

	it("keeps only the picked items that are on screen, in their order", () => {
		const selection = new Set(["c", "a", "gone"]);
		expect(selectedIn([a, b, c], selection)).toEqual([a, c]);
		expect(selectedIn([b], selection)).toEqual([]);
	});

	it("tells when everything on screen is picked", () => {
		expect(allSelected([a, b], new Set(["a", "b", "c"]))).toBe(true);
		expect(allSelected([a, b], new Set(["a"]))).toBe(false);
		expect(allSelected([], new Set(["a"]))).toBe(false);
	});

	it("finds the folder the items share", () => {
		expect(sharedFolder([a, b])).toBeNull();
		expect(sharedFolder([c])).toBe("f");
		expect(sharedFolder([a, c])).toBeUndefined();
		expect(sharedFolder([])).toBeUndefined();
	});
});
