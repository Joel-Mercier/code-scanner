import {
	codeDefaults,
	codeInks,
	codePapers,
	hasPaper,
	inkOf,
	paperOf,
	scanRisk,
} from "./style";

describe("inkOf / paperOf", () => {
	it("default to dark ink on white paper", () => {
		expect(inkOf()).toBe(codeDefaults.ink);
		expect(inkOf({ color: "ink" })).toBe(codeDefaults.ink);
		expect(paperOf()).toBe(codeDefaults.paper);
		expect(paperOf({})).toBe(codeDefaults.paper);
	});

	it("resolve preset keys", () => {
		expect(inkOf({ color: "blue" })).toBe(codeInks.blue);
		expect(paperOf({ background: "mint" })).toBe(codePapers.mint);
	});

	it("pass custom colours through", () => {
		expect(inkOf({ color: "#123456" })).toBe("#123456");
		expect(paperOf({ background: "#abcdef" })).toBe("#abcdef");
	});
});

describe("hasPaper", () => {
	it("is false for white, however it is written", () => {
		expect(hasPaper()).toBe(false);
		expect(hasPaper({ color: "ink", background: "white" })).toBe(false);
		expect(hasPaper({ color: "ink", background: "#ffffff" })).toBe(false);
		expect(hasPaper({ color: "ink", background: "#FFFFFF" })).toBe(false);
	});

	it("is true for any other background", () => {
		expect(hasPaper({ color: "ink", background: "butter" })).toBe(true);
		expect(hasPaper({ color: "ink", background: "#fafafa" })).toBe(true);
	});
});

describe("scanRisk", () => {
	it("accepts dark ink on light paper", () => {
		expect(scanRisk("#000000", "#ffffff")).toBeNull();
	});

	it("flags light ink on dark paper as inverted", () => {
		expect(scanRisk("#ffffff", "#000000")).toBe("inverted");
	});

	it("flags low contrast", () => {
		expect(scanRisk("#bbbbbb", "#ffffff")).toBe("low_contrast");
	});

	it("never flags a preset ink on a preset paper", () => {
		for (const ink of Object.values(codeInks)) {
			for (const paper of Object.values(codePapers)) {
				expect([ink, paper, scanRisk(ink, paper)]).toEqual([ink, paper, null]);
			}
		}
	});
});
