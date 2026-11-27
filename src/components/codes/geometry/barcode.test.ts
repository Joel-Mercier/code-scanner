/** @jest-environment @shopify/react-native-skia/jestEnv.js */
import "@shopify/react-native-skia/jestSetup.js";
import { bwipIds, type GeneratableBarcode } from "@/domain/codes/formats";
import { buildBarcode, validateBarcode } from "./barcode";

/** Valid content for every format bwip-js draws. */
const samples: Record<GeneratableBarcode, string> = {
	aztec: "Hello, Aztec",
	codabar: "A40156B",
	code128: "Code-128 ok",
	code39: "CODE 39",
	code93: "CODE-93",
	datamatrix: "Hello, Data Matrix",
	ean13: "5901234123457",
	ean8: "96385074",
	itf14: "00012345600012",
	pdf417: "Hello, PDF417",
	upc_a: "036000291452",
	upc_e: "01234565",
};

describe("buildBarcode", () => {
	it.each(Object.keys(bwipIds) as GeneratableBarcode[])("draws %s", (type) => {
		const geometry = buildBarcode(type, samples[type]);
		expect(geometry.width).toBeGreaterThan(0);
		expect(geometry.height).toBeGreaterThan(0);
		expect(geometry.bars.countPoints()).toBeGreaterThan(0);
		const bounds = geometry.bars.computeTightBounds();
		expect(bounds.x).toBeGreaterThanOrEqual(0);
		expect(bounds.x + bounds.width).toBeLessThanOrEqual(geometry.width + 1);
	});

	it("draws the human-readable line under linear codes only", () => {
		expect(
			buildBarcode("ean13", samples.ean13).text.countPoints(),
		).toBeGreaterThan(0);
		expect(
			buildBarcode("ean13", samples.ean13, {
				includeText: false,
			}).text.countPoints(),
		).toBe(0);
		expect(
			buildBarcode("datamatrix", samples.datamatrix).text.countPoints(),
		).toBe(0);
	});

	it("throws on content the format can't hold", () => {
		expect(() => buildBarcode("ean13", "not digits")).toThrow();
	});
});

describe("symbology from content", () => {
	const width = (type: GeneratableBarcode, content: string) =>
		buildBarcode(type, content, { includeText: false }).width;

	it("draws GS1 data as GS1-128, keeping FNC1", () => {
		const bracketed = "(01)09506000134352(10)A1";
		// The same data, as a scanner hands it back: FNC1 as GS separators.
		const raw = "\u001d010950600013435210A1";
		expect(width("code128", raw)).toBe(width("code128", bracketed));
		expect(() =>
			buildBarcode("code128", bracketed, { strict: true }),
		).not.toThrow();
	});

	it("falls back to the plain symbology when the specialised one refuses", () => {
		// AI 17 with month 13 parses as GS1, but GS1-128 rejects the date.
		const data = "(01)09506000134352(17)991340";
		expect(() => buildBarcode("code128", data, { strict: true })).toThrow();
		expect(buildBarcode("code128", data).width).toBeGreaterThan(0);
	});

	it("draws ITF codes that aren't 14 digits as Interleaved 2 of 5", () => {
		expect(() => buildBarcode("itf14", "123456")).not.toThrow();
		expect(width("itf14", "123456")).toBeLessThan(
			width("itf14", "00012345600012"),
		);
	});

	it("prints the ISBN and ISSN lines above books and periodicals", () => {
		const lines = (content: string) =>
			buildBarcode("ean13", content).text.computeTightBounds();
		const plain = lines("9782070368228");
		// A hyphenated ISBN adds text above the bars, so it starts higher.
		expect(lines("978-2-07-036822-8").y).toBeLessThan(plain.y);
		expect(lines("9770317847001").y).toBeLessThan(plain.y);
	});
});

describe("validateBarcode", () => {
	it("is null for valid content", () => {
		for (const [type, content] of Object.entries(samples)) {
			expect([
				type,
				validateBarcode(type as GeneratableBarcode, content),
			]).toEqual([type, null]);
		}
	});

	it("explains what is wrong, without bwip-js' error code", () => {
		const message = validateBarcode("ean13", "5901234123458");
		expect(message).toEqual(expect.any(String));
		expect(message).not.toMatch(/^bwipp\./);
		expect(validateBarcode("ean8", "12")).toEqual(expect.any(String));
		expect(validateBarcode("upc_a", "abcdefghijkl")).toEqual(
			expect.any(String),
		);
	});
});
