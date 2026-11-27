/** GS1 numbers: GTIN check digits, UPC-E, company prefixes, element strings. */

/** The check digit of a GTIN body (every digit but the last). */
export const gtinCheckDigit = (body: string) => {
	let sum = 0;
	for (let i = 0; i < body.length; i++) {
		// Weights alternate 3, 1, … from the rightmost digit of the body.
		const weight = (body.length - i) % 2 === 1 ? 3 : 1;
		sum += Number(body[i]) * weight;
	}
	return String((10 - (sum % 10)) % 10);
};

/** An 8, 12, 13 or 14-digit GTIN with the right check digit. */
export const isValidGtin = (code: string) =>
	/^(\d{8}|\d{12,14})$/.test(code) &&
	gtinCheckDigit(code.slice(0, -1)) === code.slice(-1);

/**
 * Expands a UPC-E code (6, 7 or 8 digits) to its 12-digit UPC-A: product
 * sites only know the long form.
 */
export const expandUpcE = (code: string) => {
	const digits =
		code.length === 6 ? `0${code}` : code.length >= 7 ? code.slice(0, 7) : "";
	if (!/^[01]\d{6}$/.test(digits)) return undefined;
	const [system, d1, d2, d3, d4, d5, d6] = digits;
	let body: string;
	if (d6 === "0" || d6 === "1" || d6 === "2") {
		body = `${system}${d1}${d2}${d6}0000${d3}${d4}${d5}`;
	} else if (d6 === "3") {
		body = `${system}${d1}${d2}${d3}00000${d4}${d5}`;
	} else if (d6 === "4") {
		body = `${system}${d1}${d2}${d3}${d4}00000${d5}`;
	} else {
		body = `${system}${d1}${d2}${d3}${d4}${d5}0000${d6}`;
	}
	return body + gtinCheckDigit(body);
};

/** What a GS1 prefix says about the number it starts. */
export type Gs1Prefix =
	| { type: "company"; region?: string }
	| { type: "store" }
	| { type: "coupon" }
	| { type: "refund" }
	| { type: "periodical" }
	| { type: "book" };

/**
 * GS1 member organisations by three-digit prefix (from, to, ISO region).
 * The prefix says where the brand registered its numbers, not where the
 * product was made.
 */
const REGIONS: [number, number, string][] = [
	[1, 19, "US"],
	[30, 39, "US"],
	[60, 139, "US"],
	[300, 379, "FR"],
	[380, 380, "BG"],
	[383, 383, "SI"],
	[385, 385, "HR"],
	[387, 387, "BA"],
	[389, 389, "ME"],
	[390, 390, "XK"],
	[400, 440, "DE"],
	[450, 459, "JP"],
	[460, 469, "RU"],
	[470, 470, "KG"],
	[471, 471, "TW"],
	[474, 474, "EE"],
	[475, 475, "LV"],
	[476, 476, "AZ"],
	[477, 477, "LT"],
	[478, 478, "UZ"],
	[479, 479, "LK"],
	[480, 480, "PH"],
	[481, 481, "BY"],
	[482, 482, "UA"],
	[483, 483, "TM"],
	[484, 484, "MD"],
	[485, 485, "AM"],
	[486, 486, "GE"],
	[487, 487, "KZ"],
	[488, 488, "TJ"],
	[489, 489, "HK"],
	[490, 499, "JP"],
	[500, 509, "GB"],
	[520, 521, "GR"],
	[528, 528, "LB"],
	[529, 529, "CY"],
	[530, 530, "AL"],
	[531, 531, "MK"],
	[535, 535, "MT"],
	[539, 539, "IE"],
	[540, 549, "BE"],
	[560, 560, "PT"],
	[569, 569, "IS"],
	[570, 579, "DK"],
	[590, 590, "PL"],
	[594, 594, "RO"],
	[599, 599, "HU"],
	[600, 601, "ZA"],
	[603, 603, "GH"],
	[604, 604, "SN"],
	[608, 608, "BH"],
	[609, 609, "MU"],
	[611, 611, "MA"],
	[613, 613, "DZ"],
	[615, 615, "NG"],
	[616, 616, "KE"],
	[617, 617, "CM"],
	[618, 618, "CI"],
	[619, 619, "TN"],
	[620, 620, "TZ"],
	[621, 621, "SY"],
	[622, 622, "EG"],
	[624, 624, "LY"],
	[625, 625, "JO"],
	[626, 626, "IR"],
	[627, 627, "KW"],
	[628, 628, "SA"],
	[629, 629, "AE"],
	[630, 630, "QA"],
	[631, 631, "NA"],
	[640, 649, "FI"],
	[690, 699, "CN"],
	[700, 709, "NO"],
	[729, 729, "IL"],
	[730, 739, "SE"],
	[740, 740, "GT"],
	[741, 741, "SV"],
	[742, 742, "HN"],
	[743, 743, "NI"],
	[744, 744, "CR"],
	[745, 745, "PA"],
	[746, 746, "DO"],
	[750, 750, "MX"],
	[754, 755, "CA"],
	[759, 759, "VE"],
	[760, 769, "CH"],
	[770, 771, "CO"],
	[773, 773, "UY"],
	[775, 775, "PE"],
	[777, 777, "BO"],
	[778, 779, "AR"],
	[780, 780, "CL"],
	[784, 784, "PY"],
	[786, 786, "EC"],
	[789, 790, "BR"],
	[800, 839, "IT"],
	[840, 849, "ES"],
	[850, 850, "CU"],
	[858, 858, "SK"],
	[859, 859, "CZ"],
	[860, 860, "RS"],
	[865, 865, "MN"],
	[867, 867, "KP"],
	[868, 869, "TR"],
	[870, 879, "NL"],
	[880, 880, "KR"],
	[883, 883, "MM"],
	[884, 884, "KH"],
	[885, 885, "TH"],
	[888, 888, "SG"],
	[890, 890, "IN"],
	[893, 893, "VN"],
	[896, 896, "PK"],
	[899, 899, "ID"],
	[900, 919, "AT"],
	[930, 939, "AU"],
	[940, 949, "NZ"],
	[955, 955, "MY"],
	[958, 958, "MO"],
];

/** Reads the GS1 prefix of a 13-digit GTIN. */
export const gs1Prefix = (gtin13: string): Gs1Prefix => {
	const prefix = Number(gtin13.slice(0, 3));
	if ((prefix >= 20 && prefix <= 29) || (prefix >= 40 && prefix <= 49)) {
		return { type: "store" };
	}
	if (prefix >= 200 && prefix <= 299) return { type: "store" };
	if (prefix >= 50 && prefix <= 59) return { type: "coupon" };
	if (prefix === 977) return { type: "periodical" };
	if (prefix === 978 || prefix === 979) return { type: "book" };
	if (prefix === 980) return { type: "refund" };
	if ((prefix >= 981 && prefix <= 984) || prefix >= 990) {
		return { type: "coupon" };
	}
	const region = REGIONS.find(([from, to]) => prefix >= from && prefix <= to);
	return { type: "company", region: region?.[2] };
};

/** One application identifier and its value: `(17)261231`. */
export type Gs1Element = { ai: string; value: string };

/** Fixed lengths (value only) of the AIs that don't end with a separator. */
const FIXED: Record<string, number> = {
	"00": 18,
	"01": 14,
	"02": 14,
	"11": 6,
	"12": 6,
	"13": 6,
	"15": 6,
	"16": 6,
	"17": 6,
	"20": 2,
	"402": 17,
	"410": 13,
	"411": 13,
	"412": 13,
	"413": 13,
	"414": 13,
	"415": 13,
	"416": 13,
	"417": 13,
	"422": 3,
	"424": 3,
	"426": 3,
	"7003": 10,
	"8005": 6,
};

/** Variable-length AIs and their longest value. */
const VARIABLE: Record<string, number> = {
	"10": 20,
	"21": 20,
	"22": 20,
	"30": 8,
	"37": 8,
	"240": 30,
	"241": 30,
	"242": 6,
	"243": 20,
	"250": 30,
	"251": 30,
	"253": 30,
	"254": 20,
	"255": 25,
	"400": 30,
	"401": 30,
	"403": 30,
	"420": 20,
	"421": 12,
	"423": 15,
	"425": 15,
	"427": 3,
	"7007": 12,
	"8003": 30,
	"8004": 30,
	"8008": 12,
	"8020": 25,
	"8200": 70,
};

/** The AI at the start of `data`, and how long its value can be. */
const readAi = (
	data: string,
): { ai: string; fixed?: number; max: number } | undefined => {
	for (const length of [2, 3, 4]) {
		const ai = data.slice(0, length);
		if (ai in FIXED) return { ai, fixed: FIXED[ai], max: FIXED[ai] };
		if (ai in VARIABLE) return { ai, max: VARIABLE[ai] };
	}
	const four = data.slice(0, 4);
	// Measures (31nn–36nn, n = decimals) are six digits.
	if (/^3[1-6]\d\d$/.test(four)) return { ai: four, fixed: 6, max: 6 };
	// Amounts: 390n–393n vary, 394n and 395n are fixed.
	if (/^39[0-3]\d$/.test(four)) return { ai: four, max: 18 };
	if (/^394\d$/.test(four)) return { ai: four, fixed: 4, max: 4 };
	if (/^395\d$/.test(four)) return { ai: four, fixed: 6, max: 6 };
	if (/^9\d$/.test(data.slice(0, 2))) return { ai: data.slice(0, 2), max: 90 };
	return undefined;
};

const GS = "\u001d";

/** Reads `0103400930000120…` (FNC1 as GS) into AIs; `undefined` if it isn't one. */
const readRaw = (data: string) => {
	const elements: Gs1Element[] = [];
	let rest = data;
	while (rest) {
		const spec = readAi(rest);
		if (!spec) return undefined;
		const start = spec.ai.length;
		let value: string;
		if (spec.fixed !== undefined) {
			value = rest.slice(start, start + spec.fixed);
			if (value.length !== spec.fixed) return undefined;
			rest = rest.slice(start + spec.fixed);
			if (rest.startsWith(GS)) rest = rest.slice(1);
		} else {
			const end = rest.indexOf(GS, start);
			value = end < 0 ? rest.slice(start) : rest.slice(start, end);
			rest = end < 0 ? "" : rest.slice(end + 1);
		}
		if (!value || value.length > spec.max) return undefined;
		elements.push({ ai: spec.ai, value });
	}
	return elements;
};

/** Reads `(01)03400930000120(17)261231`. */
const readBracketed = (data: string) => {
	if (!/^(\(\d{2,4}\)[^()]+)+$/.test(data)) return undefined;
	const elements: Gs1Element[] = [];
	for (const [, ai, value] of data.matchAll(/\((\d{2,4})\)([^()]+)/g)) {
		const spec = readAi(ai);
		if (!spec || spec.ai !== ai || value.length > spec.max) return undefined;
		if (spec.fixed !== undefined && value.length !== spec.fixed) {
			return undefined;
		}
		elements.push({ ai, value });
	}
	return elements;
};

/**
 * Parses a GS1 element string (GS1-128, GS1 DataMatrix, GS1 QR). Unmarked
 * strings only count when they start with a valid GTIN, so plain numbers
 * aren't mistaken for one.
 */
export const parseElementString = (input: string) => {
	let data = input.trim();
	// A symbology identifier (`]C1`, `]d2`, `]Q3`) or a leading FNC1 marks GS1.
	let marked = /^\][A-Za-z]\d/.test(data);
	if (marked) data = data.slice(3);
	if (data.startsWith(GS)) {
		marked = true;
		data = data.slice(1);
	}
	const elements = data.startsWith("(")
		? readBracketed(data)
		: readRaw(data.replace(/\s/g, ""));
	if (!elements?.length) return undefined;
	const gtin = elements.find((element) => element.ai === "01")?.value;
	if (gtin && !isValidGtin(gtin)) return undefined;
	const unmarked = !marked && !data.startsWith("(") && !data.includes(GS);
	if (unmarked && elements[0].ai !== "01") return undefined;
	return elements;
};

/** A GS1 `YYMMDD` date; day `00` means the end of the month. */
export const gs1Date = (value: string) => {
	const match = value.match(/^(\d{2})(\d{2})(\d{2})$/);
	if (!match) return undefined;
	const [year, month, day] = [2000 + +match[1], +match[2], +match[3]];
	if (month < 1 || month > 12 || day > 31) return undefined;
	return day === 0 ? new Date(year, month, 0) : new Date(year, month - 1, day);
};
