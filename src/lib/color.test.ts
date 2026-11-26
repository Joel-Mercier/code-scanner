import {
	contrastRatio,
	luminance,
	normalizeHex,
	readableOn,
	withAlpha,
} from "./color";

describe("luminance", () => {
	it("goes from 0 (black) to 1 (white)", () => {
		expect(luminance("#000000")).toBe(0);
		expect(luminance("#ffffff")).toBeCloseTo(1);
		expect(luminance("#808080")).toBeCloseTo(0.2159, 3);
	});

	it("reads shorthand and hash-less colours", () => {
		expect(luminance("#fff")).toBeCloseTo(1);
		expect(luminance("ffffff")).toBeCloseTo(1);
	});

	it("is 0 for garbage", () => {
		expect(luminance("nope")).toBe(0);
	});
});

describe("contrastRatio", () => {
	it("is 21 for black on white, in either order", () => {
		expect(contrastRatio("#000", "#fff")).toBeCloseTo(21);
		expect(contrastRatio("#fff", "#000")).toBeCloseTo(21);
	});

	it("is 1 for a colour on itself", () => {
		expect(contrastRatio("#2a44ff", "#2a44ff")).toBe(1);
	});
});

describe("readableOn", () => {
	it("picks ink on light fills and white on dark ones", () => {
		expect(readableOn("#ffffff")).toBe("#0E0E10");
		expect(readableOn("#FFF6DB")).toBe("#0E0E10");
		expect(readableOn("#0e0e10")).toBe("#FFFFFF");
		expect(readableOn("#2A44FF")).toBe("#FFFFFF");
	});
});

describe("withAlpha", () => {
	it("turns #rrggbb into rgba()", () => {
		expect(withAlpha("#F6F6F4", 0.5)).toBe("rgba(246,246,244,0.5)");
		expect(withAlpha("#000000", 0)).toBe("rgba(0,0,0,0)");
	});
});

describe("normalizeHex", () => {
	it("accepts 3 or 6 digits, with or without #, in any case", () => {
		expect(normalizeHex("#ABCDEF")).toBe("#abcdef");
		expect(normalizeHex("abcdef")).toBe("#abcdef");
		expect(normalizeHex("#Fa0")).toBe("#ffaa00");
		expect(normalizeHex("  0f0 ")).toBe("#00ff00");
	});

	it("rejects anything else", () => {
		expect(normalizeHex("")).toBeNull();
		expect(normalizeHex("#abcd")).toBeNull();
		expect(normalizeHex("#ggg")).toBeNull();
		expect(normalizeHex("#abcdef00")).toBeNull();
	});
});
