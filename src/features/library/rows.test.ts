import { sortByRecent } from "@/domain/library/items";
import { makeCode, makeDoc, makeFolder } from "@/test/fixtures";
import {
	KINDS,
	kindOf,
	matchesFilter,
	matchesFolder,
	matchesQuery,
	stripKinds,
	toRows,
} from "./rows";

describe("kinds", () => {
	it("lists the 9 QR kinds, 5 scan-only kinds, barcodes and documents", () => {
		expect(KINDS).toHaveLength(16);
		expect(new Set(KINDS).size).toBe(16);
	});

	it("shows scan-only kinds in the strip once one is found", () => {
		expect(stripKinds(new Set())).toHaveLength(11);
		expect(stripKinds(new Set(["otp"]))).toContain("otp");
		expect(stripKinds(new Set(["otp"]))).toHaveLength(12);
	});

	it("tells the kind of an item", () => {
		expect(kindOf(makeDoc())).toBe("doc");
		expect(kindOf(makeCode({ data: "tel:+1" }))).toBe("phone");
		expect(kindOf(makeCode({ format: "ean13", data: "1" }))).toBe("barcode");
	});
});

describe("filters", () => {
	it("filter by tab", () => {
		const code = makeCode();
		const doc = makeDoc();
		expect(matchesFilter(code, "all")).toBe(true);
		expect(matchesFilter(code, "codes")).toBe(true);
		expect(matchesFilter(code, "docs")).toBe(false);
		expect(matchesFilter(doc, "docs")).toBe(true);
		expect(matchesFilter(doc, "codes")).toBe(false);
	});

	it("search folders by name, ignoring case", () => {
		expect(matchesFolder(makeFolder({ id: "f", name: "Travel" }), "TRAV")).toBe(
			true,
		);
		expect(matchesFolder(makeFolder({ id: "f", name: "Bills" }), "trav")).toBe(
			false,
		);
	});

	it("search items by title, content and kind", () => {
		const wifi = makeCode({ data: "WIFI:T:WPA;S:Home;P:hunter2;;" });
		expect(matchesQuery(wifi, "home")).toBe(true);
		expect(matchesQuery(wifi, "HUNTER")).toBe(true);
		expect(matchesQuery(wifi, "wi-fi")).toBe(true);
		expect(matchesQuery(wifi, "office")).toBe(false);
		expect(
			matchesQuery(makeCode({ data: "x", name: "Gym locker" }), "locker"),
		).toBe(true);
		expect(matchesQuery(makeDoc({ name: "Lease 2026" }), "lease")).toBe(true);
		expect(matchesQuery(makeDoc({ name: "Lease" }), "page")).toBe(false);
	});

	it("searches a document's notes, type and the text read on it", () => {
		const doc = makeDoc({
			name: "Scan",
			notes: "Dentist",
			docType: "invoice",
			pages: ["p"],
			readings: { p: { text: "Total due 84,00 EUR", codes: [] } },
		});
		expect(matchesQuery(doc, "dentist")).toBe(true);
		expect(matchesQuery(doc, "invoice")).toBe(true);
		expect(matchesQuery(doc, "total due")).toBe(true);
		expect(matchesQuery(doc, "receipt")).toBe(false);
	});

	it("matches a hidden locked item by the title it shows only", () => {
		const wifi = makeCode({
			data: "WIFI:T:WPA;S:Home;P:hunter2;;",
			lockedAt: 1,
		});
		expect(matchesQuery(wifi, "home", false)).toBe(false);
		expect(matchesQuery(wifi, "hunter", false)).toBe(false);
		expect(matchesQuery(wifi, "wi-fi", false)).toBe(true);
		expect(matchesQuery(wifi, "home", true)).toBe(true);

		const doc = makeDoc({
			name: "Passport",
			notes: "Renew in May",
			pages: ["p"],
			readings: { p: { text: "Republique francaise", codes: [] } },
			lockedAt: 1,
		});
		expect(matchesQuery(doc, "passport", false)).toBe(true);
		expect(matchesQuery(doc, "renew", false)).toBe(false);
		expect(matchesQuery(doc, "francaise", false)).toBe(false);
		expect(matchesQuery(doc, "francaise", true)).toBe(true);
	});
});

describe("toRows", () => {
	beforeEach(() => jest.useFakeTimers({ now: new Date(2026, 5, 15, 12) }));
	afterEach(() => jest.useRealTimers());

	const at = (id: string, month: number, day = 1) =>
		makeCode({ id, createdAt: new Date(2026, month, day).getTime() });

	it("groups items by month, three per row", () => {
		const items = [
			at("a", 5, 14),
			at("b", 5, 10),
			at("c", 5, 9),
			at("d", 5, 2),
			at("e", 3, 20),
		];
		const rows = toRows(items, "This month");
		expect(
			rows.map((row) =>
				row.type === "heading"
					? row.label
					: row.items.map((item) => item.id).join(""),
			),
		).toEqual(["This month", "abc", "d", "April 2026", "e"]);
	});

	it("numbers rows by their first item, across months", () => {
		const rows = toRows(
			[at("a", 5), at("b", 5), at("c", 5), at("d", 5), at("e", 4)],
			"Now",
		);
		expect(
			rows.filter((row) => row.type === "items").map((row) => row.offset),
		).toEqual([0, 3, 4]);
	});

	it("gives every row a unique key", () => {
		const items = Array.from({ length: 10 }, (_, index) =>
			at(`i${index}`, 5 - (index % 3), 1 + index),
		);
		const rows = toRows(sortByRecent(items), "Now");
		expect(new Set(rows.map((row) => row.key)).size).toBe(rows.length);
	});

	it("is empty without items", () => {
		expect(toRows([], "Now")).toEqual([]);
		expect(toRows([], "Now", "Pinned")).toEqual([]);
	});

	it("puts pinned items first, out of their month", () => {
		const items = [
			at("a", 5, 10),
			{ ...at("b", 5, 9), pinnedAt: 1 },
			at("c", 4),
			{ ...at("d", 3), pinnedAt: 2 },
		];
		const rows = toRows(items, "Now", "Pinned");
		expect(
			rows.map((row) =>
				row.type === "heading"
					? row.label
					: row.items.map((item) => item.id).join(""),
			),
		).toEqual(["Pinned", "db", "Now", "a", "May 2026", "c"]);
		expect(new Set(rows.map((row) => row.key)).size).toBe(rows.length);
		// Without the label, pinned items stay in their month.
		expect(
			toRows(items, "Now").filter((row) => row.type === "heading"),
		).toHaveLength(3);
	});
});
