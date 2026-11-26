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
