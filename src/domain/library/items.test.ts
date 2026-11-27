import type { LibraryItem } from "@/domain/library/types";
import { byId, makeCode, makeDoc } from "@/test/fixtures";
import {
	catalogueNumber,
	countInFolder,
	isLocked,
	isNew,
	isPinned,
	itemCaption,
	itemTitle,
	shownTitle,
	sortByRecent,
	sortPinnedFirst,
} from "./items";

describe("isNew", () => {
	afterEach(() => jest.useRealTimers());

	it("is true for a day after the capture", () => {
		jest.useFakeTimers({ now: new Date("2026-06-02T12:00:00Z") });
		const hour = 60 * 60 * 1000;
		const now = Date.now();
		expect(isNew(makeCode({ createdAt: now - hour }))).toBe(true);
		expect(isNew(makeCode({ createdAt: now - 23 * hour }))).toBe(true);
		expect(isNew(makeCode({ createdAt: now - 25 * hour }))).toBe(false);
	});
});

describe("sortByRecent", () => {
	it("puts the newest first without touching the input", () => {
		const list = [{ createdAt: 1 }, { createdAt: 3 }, { createdAt: 2 }];
		expect(sortByRecent(list).map((entry) => entry.createdAt)).toEqual([
			3, 2, 1,
		]);
		expect(list.map((entry) => entry.createdAt)).toEqual([1, 3, 2]);
	});
});

describe("sortPinnedFirst", () => {
	it("puts the latest pinned on top, then the newest", () => {
		const list = [
			{ id: "old", createdAt: 1 },
			{ id: "pinned-first", createdAt: 2, pinnedAt: 10 },
			{ id: "new", createdAt: 5 },
			{ id: "pinned-last", createdAt: 0, pinnedAt: 20 },
		];
		expect(sortPinnedFirst(list).map((entry) => entry.id)).toEqual([
			"pinned-last",
			"pinned-first",
			"new",
			"old",
		]);
		expect(isPinned(list[1])).toBe(true);
		expect(isPinned(list[0])).toBe(false);
	});
});

describe("catalogueNumber", () => {
	it("pads to three digits", () => {
		expect(catalogueNumber({ seq: 7 })).toBe("007");
		expect(catalogueNumber({ seq: 44 })).toBe("044");
		expect(catalogueNumber({ seq: 1234 })).toBe("1234");
	});

	it("reads 000 for items saved before catalogue numbers", () => {
		expect(catalogueNumber({} as { seq: number })).toBe("000");
	});
});

describe("itemTitle / itemCaption", () => {
	it("use a document's name", () => {
		const doc = makeDoc({ seq: 41, name: "Lease" });
		expect(itemTitle(doc)).toBe("Lease");
		expect(itemCaption(doc, "Document")).toBe("041 · DOCUMENT");
		expect(itemCaption({ ...doc, docType: "receipt" }, "Document")).toBe(
			"041 · RECEIPT",
		);
	});

	it("describe a code by its content and kind", () => {
		const code = makeCode({ seq: 42, data: "https://example.com/" });
		expect(itemTitle(code)).toBe("example.com");
		expect(itemCaption(code, "Document")).toBe("042 · LINK");
	});
});

describe("countInFolder", () => {
	it("counts the items directly inside a folder", () => {
		const items = byId<LibraryItem>(
			makeCode({ id: "a", folderId: "f" }),
			makeDoc({ id: "b", folderId: "f" }),
			makeCode({ id: "c", folderId: "sub" }),
			makeCode({ id: "d" }),
		);
		expect(countInFolder(items, "f")).toBe(2);
		expect(countInFolder(items, "sub")).toBe(1);
		expect(countInFolder(items, "empty")).toBe(0);
	});
});

describe("locks", () => {
	it("tells locked items apart", () => {
		expect(isLocked(makeCode({ lockedAt: 5 }))).toBe(true);
		expect(isLocked(makeCode())).toBe(false);
	});

	it("hides a locked code's content-based title until revealed", () => {
		const wifi = makeCode({
			data: "WIFI:T:WPA;S:Home;P:hunter2;;",
			lockedAt: 5,
		});
		expect(shownTitle(wifi, false)).toBe("Wi-Fi");
		expect(shownTitle(wifi, true)).toBe(itemTitle(wifi));
		expect(shownTitle({ ...wifi, name: "Flat" }, false)).toBe("Flat");
		expect(shownTitle(makeCode({ data: "WIFI:S:Home;;" }), false)).toBe(
			itemTitle(makeCode({ data: "WIFI:S:Home;;" })),
		);
	});

	it("keeps a locked document's name", () => {
		expect(shownTitle(makeDoc({ name: "Passport", lockedAt: 5 }), false)).toBe(
			"Passport",
		);
	});
});
