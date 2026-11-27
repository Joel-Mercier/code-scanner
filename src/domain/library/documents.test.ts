import { applyLocale } from "@/i18n";
import { makeDoc } from "@/test/fixtures";
import {
	docCodes,
	docSearchText,
	docText,
	docTypeLabel,
	fileNameFor,
	keepReadings,
	nameFromFile,
	unreadPages,
} from "./documents";

afterEach(() => applyLocale("en"));

const read = (
	text: string,
	codes: { format: "qr" | "ean13"; data: string }[] = [],
) => ({
	text,
	codes,
});

describe("readings", () => {
	const doc = makeDoc({
		pages: ["a.jpg", "b.jpg", "c.jpg"],
		readings: {
			"c.jpg": read("Total 12 €", [{ format: "qr", data: "pay" }]),
			"a.jpg": read("  Invoice 42 ", [
				{ format: "qr", data: "pay" },
				{ format: "ean13", data: "4006381333931" },
			]),
			"gone.jpg": read("old"),
		},
	});

	it("lists the pages not read yet", () => {
		expect(unreadPages(doc)).toEqual(["b.jpg"]);
		expect(unreadPages(makeDoc({ pages: ["x"] }))).toEqual(["x"]);
	});

	it("joins the text in page order", () => {
		expect(docText(doc)).toBe("Invoice 42\n\nTotal 12 €");
	});

	it("lists each code once, in page order", () => {
		expect(docCodes(doc)).toEqual([
			{ format: "qr", data: "pay" },
			{ format: "ean13", data: "4006381333931" },
		]);
	});

	it("drops readings of pages that left", () => {
		expect(Object.keys(keepReadings(doc.readings, doc.pages)).sort()).toEqual([
			"a.jpg",
			"c.jpg",
		]);
		expect(keepReadings(undefined, ["a"])).toEqual({});
	});
});

describe("docSearchText", () => {
	it("holds the name, notes, type and text", () => {
		const text = docSearchText(
			makeDoc({
				name: "Lease",
				notes: "Flat on Rue Oberkampf",
				docType: "contract",
				pages: ["p"],
				readings: { p: read("Monthly RENT") },
			}),
		);
		for (const word of ["lease", "oberkampf", "contract", "monthly rent"]) {
			expect(text).toContain(word);
		}
	});

	it("uses the current language for the type", () => {
		applyLocale("fr");
		expect(docTypeLabel("invoice")).toBe("Facture");
	});
});

describe("fileNameFor", () => {
	it("keeps names file systems accept", () => {
		expect(fileNameFor("Lease 2026", "pdf")).toBe("Lease 2026.pdf");
		expect(fileNameFor('a/b\\c:d*e?"f<g>h|i', "pdf")).toBe(
			"a-b-c-d-e-f-g-h-i.pdf",
		);
		expect(fileNameFor("tab\there\nnew", "pdf")).toBe("tab here new.pdf");
		expect(fileNameFor("...hidden", "pdf")).toBe("hidden.pdf");
		expect(fileNameFor("   ", "pdf")).toBe("Document.pdf");
		expect(fileNameFor("x".repeat(200), "pdf")).toHaveLength(84);
	});
});

describe("nameFromFile", () => {
	it("drops the extension", () => {
		expect(nameFromFile("Lease.pdf")).toBe("Lease");
		expect(nameFromFile("archive.tar.gz")).toBe("archive.tar");
		expect(nameFromFile(".pdf")).toBeNull();
		expect(nameFromFile(null)).toBeNull();
	});
});
