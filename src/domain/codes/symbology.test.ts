import {
	gs1Bracketed,
	isHyphenatedIsbn,
	issnOf,
	normalizeIsbn,
	symbologiesOf,
	symbologyLabel,
} from "./symbology";

const bcids = (...args: Parameters<typeof symbologiesOf>) =>
	symbologiesOf(...args).map(({ bcid }) => bcid);

describe("gs1Bracketed", () => {
	it("writes GS1 data in brackets, however it was scanned", () => {
		const expected = "(01)03400930000120(17)261231(10)12AB";
		expect(gs1Bracketed("]d20103400930000120172612311012AB")).toBe(expected);
		expect(gs1Bracketed("\u001d0103400930000120172612311012AB")).toBe(expected);
		expect(gs1Bracketed(expected)).toBe(expected);
	});

	it("is undefined for anything else", () => {
		expect(gs1Bracketed("HELLO")).toBeUndefined();
		expect(gs1Bracketed("1234567890")).toBeUndefined();
	});
});

describe("normalizeIsbn", () => {
	it("keeps an ISBN-13 typed with all its hyphens", () => {
		expect(normalizeIsbn("978-2-07-036822-8")).toBe("978-2-07-036822-8");
		expect(normalizeIsbn(" ISBN 978 2 07 036822 8 ")).toBe("978-2-07-036822-8");
	});

	it("turns an ISBN-10 into an ISBN-13, keeping its groups", () => {
		expect(normalizeIsbn("2-07-036822-X")).toBe("978-2-07-036822-8");
		expect(normalizeIsbn("207036822x")).toBe("9782070368228");
	});

	it("falls back to digits when the hyphens are partial", () => {
		expect(normalizeIsbn("978-2070368228")).toBe("9782070368228");
		expect(normalizeIsbn("9782070368228")).toBe("9782070368228");
	});

	it("accepts ISMNs", () => {
		expect(normalizeIsbn("979-0-2600-0043-8")).toBe("979-0-2600-0043-8");
	});

	it("rejects wrong check digits and other numbers", () => {
		expect(normalizeIsbn("978-2-07-036822-9")).toBeUndefined();
		expect(normalizeIsbn("2-07-036822-1")).toBeUndefined();
		expect(normalizeIsbn("5901234123457")).toBeUndefined();
		expect(normalizeIsbn("978--2-07-036822-8")).toBeUndefined();
		expect(normalizeIsbn("")).toBeUndefined();
	});
});

describe("isHyphenatedIsbn", () => {
	it("needs 13 digits in five hyphenated groups", () => {
		expect(isHyphenatedIsbn("978-2-07-036822-8")).toBe(true);
		expect(isHyphenatedIsbn("978-2070368228")).toBe(false);
		expect(isHyphenatedIsbn("978-2-07-03682-8")).toBe(false);
	});
});

describe("issnOf", () => {
	it("reads the ISSN and issue variant of a periodical", () => {
		expect(issnOf("9770317847001")).toBe("0317-8471 00");
	});

	it("is undefined for other numbers or a wrong check digit", () => {
		expect(issnOf("9782070368228")).toBeUndefined();
		expect(issnOf("9770317847002")).toBeUndefined();
	});
});

describe("symbologiesOf", () => {
	it("draws GS1 data with FNC1, the plain symbology as a fallback", () => {
		const gs1 = "(01)09506000134352(10)A1";
		expect(bcids("code128", gs1)).toEqual(["gs1-128", "code128"]);
		expect(bcids("datamatrix", gs1)).toEqual(["gs1datamatrix", "datamatrix"]);
		expect(bcids("code128", "HELLO")).toEqual(["code128"]);
	});

	it("draws Data Matrix codes as rectangles when asked", () => {
		expect(bcids("datamatrix", "abc", { shape: "rectangle" })).toEqual([
			"datamatrixrectangular",
		]);
		expect(
			bcids("datamatrix", "(01)09506000134352", { shape: "rectangle" }),
		).toEqual(["gs1datamatrixrectangular", "datamatrixrectangular"]);
	});

	it("prints the ISBN, ISMN or ISSN line on EAN-13s that carry one", () => {
		expect(symbologiesOf("ean13", "978-2-07-036822-8")).toEqual([
			{ bcid: "isbn", text: "978-2-07-036822-8", label: "ISBN" },
			{ bcid: "ean13", text: "9782070368228", label: "EAN-13" },
		]);
		expect(bcids("ean13", "979-0-2600-0043-8")[0]).toBe("ismn");
		expect(symbologiesOf("ean13", "9770317847001")[0]).toEqual({
			bcid: "issn",
			text: "0317-8471 00",
			label: "ISSN",
		});
		// A scanned ISBN has no hyphens to print: plain EAN-13.
		expect(bcids("ean13", "9782070368228")).toEqual(["ean13"]);
	});

	it("draws ITF codes that aren't 13 or 14 digits as Interleaved 2 of 5", () => {
		expect(bcids("itf14", "00012345600012")).toEqual(["itf14"]);
		expect(bcids("itf14", "123456")).toEqual(["interleaved2of5"]);
	});

	it("labels the code by the symbology its content calls for", () => {
		expect(symbologyLabel("code128", "(01)09506000134352")).toBe("GS1-128");
		expect(symbologyLabel("itf14", "1234")).toBe("ITF");
		expect(symbologyLabel("code93", "ABC")).toBe("Code 93");
	});
});
