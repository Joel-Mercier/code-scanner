import {
	expandUpcE,
	gs1Date,
	gs1Prefix,
	gtinCheckDigit,
	isValidGtin,
	parseElementString,
} from "./gs1";

describe("GTINs", () => {
	it("computes check digits for every length", () => {
		expect(gtinCheckDigit("590123412345")).toBe("7");
		expect(gtinCheckDigit("9638507")).toBe("4");
		expect(gtinCheckDigit("03600029145")).toBe("2");
		expect(isValidGtin("5901234123457")).toBe(true);
		expect(isValidGtin("5901234123458")).toBe(false);
		expect(isValidGtin("96385074")).toBe(true);
		expect(isValidGtin("12345")).toBe(false);
	});

	it("expands UPC-E to UPC-A", () => {
		expect(expandUpcE("04252614")).toBe("042100005264");
		expect(expandUpcE("0425261")).toBe("042100005264");
		expect(expandUpcE("425261")).toBe("042100005264");
		expect(expandUpcE("01234505")).toBe("012000003455");
		expect(expandUpcE("01234531")).toBe("012300000451");
		expect(expandUpcE("01234542")).toBe("012340000053");
		expect(expandUpcE("01234565")).toBe("012345000065");
		expect(expandUpcE("21234505")).toBeUndefined();
	});
});

describe("gs1Prefix", () => {
	it("names where the brand registered", () => {
		expect(gs1Prefix("3017620422003")).toEqual({
			type: "company",
			region: "FR",
		});
		expect(gs1Prefix("4006381333931")).toEqual({
			type: "company",
			region: "DE",
		});
		expect(gs1Prefix("0036000291452")).toEqual({
			type: "company",
			region: "US",
		});
		expect(gs1Prefix("9501101530003")).toEqual({
			type: "company",
			region: undefined,
		});
	});

	it("recognises the special ranges", () => {
		expect(gs1Prefix("2001234567893").type).toBe("store");
		expect(gs1Prefix("0212345678909").type).toBe("store");
		expect(gs1Prefix("0512345678900").type).toBe("coupon");
		expect(gs1Prefix("9912345678901").type).toBe("coupon");
		expect(gs1Prefix("9801234567897").type).toBe("refund");
		expect(gs1Prefix("9771234567003").type).toBe("periodical");
		expect(gs1Prefix("9782070612758").type).toBe("book");
	});
});

describe("parseElementString", () => {
	it("reads raw element strings with FNC1 separators", () => {
		expect(
			parseElementString("]d2010340093000012017261231101234\u001d21SERIAL"),
		).toEqual([
			{ ai: "01", value: "03400930000120" },
			{ ai: "17", value: "261231" },
			{ ai: "10", value: "1234" },
			{ ai: "21", value: "SERIAL" },
		]);
		expect(parseElementString("\u001d0103400930000120")).toEqual([
			{ ai: "01", value: "03400930000120" },
		]);
	});

	it("reads the bracketed, human-readable form", () => {
		expect(
			parseElementString("(01)09506000134352(3103)000189(15)261130"),
		).toEqual([
			{ ai: "01", value: "09506000134352" },
			{ ai: "3103", value: "000189" },
			{ ai: "15", value: "261130" },
		]);
	});

	it("only takes unmarked numbers that start with a valid GTIN", () => {
		expect(parseElementString("0103400930000120")).toHaveLength(1);
		expect(parseElementString("0103400930000121")).toBeUndefined();
		expect(parseElementString("1012345")).toBeUndefined();
		expect(parseElementString("hello")).toBeUndefined();
		expect(parseElementString("(99)")).toBeUndefined();
	});
});

describe("gs1Date", () => {
	it("reads YYMMDD, with day 00 as the end of the month", () => {
		expect(gs1Date("261231")).toEqual(new Date(2026, 11, 31));
		expect(gs1Date("260200")).toEqual(new Date(2026, 1, 28));
		expect(gs1Date("261301")).toBeUndefined();
	});
});
