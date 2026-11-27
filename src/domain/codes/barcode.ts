/**
 * What a barcode's number means, read offline: products and where their
 * brand registered, books, periodicals, store-only codes, GS1 data (expiry,
 * lot), parcels and vehicles.
 */
import type { BarcodeType } from "expo-camera";
import {
	expandUpcE,
	type Gs1Element,
	gs1Date,
	gs1Prefix,
	gtinCheckDigit,
	parseElementString,
} from "./gs1";

export type Gs1Data = {
	type: "gs1";
	elements: Gs1Element[];
	/** The 13-digit GTIN when the item is a consumer unit (`01` starting `0`). */
	gtin?: string;
	expiry?: Date;
	bestBefore?: Date;
	producedOn?: Date;
	lot?: string;
	serial?: string;
	/** Net weight in kilograms (`310n`). */
	weightKg?: number;
	count?: number;
	/** A French medicine (CIP code). */
	medicine: boolean;
};

export type BarcodeInfo =
	| { type: "product"; gtin: string; region?: string }
	| { type: "medicine"; gtin: string; cip: string }
	| { type: "book"; gtin: string; isbn10?: string }
	| { type: "music"; gtin: string; ismn: string }
	| { type: "periodical"; gtin: string; issn: string }
	| { type: "store"; gtin: string }
	| { type: "coupon"; gtin: string }
	| { type: "refund"; gtin: string }
	| Gs1Data
	| {
			type: "parcel";
			number: string;
			carrier: "laposte" | "ups" | "post";
			/** The posting country of a UPU S10 number. */
			country?: string;
	  }
	| {
			type: "vin";
			vin: string;
			region?: VinRegion;
			country?: string;
			year?: number;
	  };

export type VinRegion =
	| "africa"
	| "asia"
	| "europe"
	| "northAmerica"
	| "oceania"
	| "southAmerica";

/** ISBN-10 check character (mod 11, `X` for 10). */
const isbn10Check = (body: string) => {
	let sum = 0;
	for (let i = 0; i < 9; i++) sum += Number(body[i]) * (10 - i);
	const check = (11 - (sum % 11)) % 11;
	return check === 10 ? "X" : String(check);
};

/** ISSN check character (weights 8…2, mod 11, `X` for 10). */
const issnCheck = (body: string) => {
	let sum = 0;
	for (let i = 0; i < 7; i++) sum += Number(body[i]) * (8 - i);
	const check = (11 - (sum % 11)) % 11;
	return check === 10 ? "X" : String(check);
};

/** Classifies a 13-digit GTIN by its prefix. */
const classifyGtin13 = (gtin: string): BarcodeInfo => {
	if (gtin.startsWith("34009")) return { type: "medicine", gtin, cip: gtin };
	const prefix = gs1Prefix(gtin);
	switch (prefix.type) {
		case "book": {
			if (gtin.startsWith("9790")) return { type: "music", gtin, ismn: gtin };
			const body = gtin.slice(3, 12);
			return {
				type: "book",
				gtin,
				isbn10: gtin.startsWith("978") ? body + isbn10Check(body) : undefined,
			};
		}
		case "periodical": {
			const body = gtin.slice(3, 10);
			const issn = body + issnCheck(body);
			return {
				type: "periodical",
				gtin,
				issn: `${issn.slice(0, 4)}-${issn.slice(4)}`,
			};
		}
		case "store":
		case "coupon":
		case "refund":
			return { type: prefix.type, gtin };
		case "company":
			return { type: "product", gtin, region: prefix.region };
	}
};

/** The GTIN-13 of a GTIN-14 consumer unit (indicator 0), for lookups. */
const fromGtin14 = (gtin14: string) =>
	gtin14.startsWith("0") ? gtin14.slice(1) : undefined;

/** The trade item inside an ITF-14 carton (indicator digit dropped). */
const innerGtin = (gtin14: string) => {
	const body = gtin14.slice(1, 13);
	return body + gtinCheckDigit(body);
};

/** Reads the useful AIs of a GS1 element string. */
const readGs1 = (elements: Gs1Element[]): Gs1Data => {
	const value = (ai: string) => elements.find((e) => e.ai === ai)?.value;
	const date = (ai: string) => {
		const raw = value(ai);
		return raw ? gs1Date(raw) : undefined;
	};
	const weight = elements.find((e) => /^310\d$/.test(e.ai));
	const gtin14 = value("01");
	const gtin = gtin14 ? fromGtin14(gtin14) : undefined;
	const count = value("30") ?? value("37");
	return {
		type: "gs1",
		elements,
		gtin,
		expiry: date("17"),
		bestBefore: date("15"),
		producedOn: date("11"),
		lot: value("10"),
		serial: value("21"),
		weightKg: weight
			? Number(weight.value) / 10 ** Number(weight.ai[3])
			: undefined,
		count: count ? Number(count) : undefined,
		medicine: !!gtin?.startsWith("34009"),
	};
};

/** UPU S10 check digit (weights 8 6 4 2 3 5 9 7, mod 11). */
const s10Check = (digits: string) => {
	const weights = [8, 6, 4, 2, 3, 5, 9, 7];
	const sum = weights.reduce((total, w, i) => total + w * Number(digits[i]), 0);
	const check = 11 - (sum % 11);
	return check === 10 ? 0 : check === 11 ? 5 : check;
};

const readParcel = (data: string): BarcodeInfo | undefined => {
	const number = data.replace(/\s/g, "").toUpperCase();
	const s10 = number.match(/^[A-Z]{2}(\d{8})(\d)([A-Z]{2})$/);
	if (s10 && s10Check(s10[1]) === Number(s10[2])) {
		return {
			type: "parcel",
			number,
			carrier: s10[3] === "FR" ? "laposte" : "post",
			country: s10[3],
		};
	}
	if (/^1Z[0-9A-Z]{16}$/.test(number)) {
		return { type: "parcel", number, carrier: "ups" };
	}
	// Colissimo: a digit, a letter, eleven digits (6A12345678901).
	if (/^\d[A-Z]\d{11}$/.test(number)) {
		return { type: "parcel", number, carrier: "laposte" };
	}
	return undefined;
};

const VIN_VALUES: Record<string, number> = {
	A: 1,
	B: 2,
	C: 3,
	D: 4,
	E: 5,
	F: 6,
	G: 7,
	H: 8,
	J: 1,
	K: 2,
	L: 3,
	M: 4,
	N: 5,
	P: 7,
	R: 9,
	S: 2,
	T: 3,
	U: 4,
	V: 5,
	W: 6,
	X: 7,
	Y: 8,
	Z: 9,
};
const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

/** Whether the 9th character is the North American check digit. */
const vinCheckValid = (vin: string) => {
	const sum = [...vin].reduce(
		(total, char, i) =>
			total + (VIN_VALUES[char] ?? Number(char)) * VIN_WEIGHTS[i],
		0,
	);
	const check = sum % 11;
	return vin[8] === (check === 10 ? "X" : String(check));
};

const vinRegion = (first: string): VinRegion | undefined => {
	if (/[A-H]/.test(first)) return "africa";
	if (/[J-R]/.test(first)) return "asia";
	if (/[S-Z]/.test(first)) return "europe";
	if (/[1-5]/.test(first)) return "northAmerica";
	if (/[67]/.test(first)) return "oceania";
	if (/[89]/.test(first)) return "southAmerica";
	return undefined;
};

/** Countries of the most common world manufacturer identifiers. */
const vinCountry = (wmi: string) => {
	const [a, b] = wmi;
	if (/[145]/.test(a)) return "US";
	if (a === "2") return "CA";
	if (a === "3" && /[A-W]/.test(b)) return "MX";
	if (a === "J") return "JP";
	if (a === "K" && /[L-R]/.test(b)) return "KR";
	if (a === "L") return "CN";
	if (a === "S" && /[A-M]/.test(b)) return "GB";
	if (a === "V" && /[F-R]/.test(b)) return "FR";
	if (a === "V" && /[S-W]/.test(b)) return "ES";
	if (a === "W") return "DE";
	if (a === "Y" && /[S-W]/.test(b)) return "SE";
	if (a === "Z" && /[A-R]/.test(b)) return "IT";
	if (a === "9" && /[3-9]/.test(b)) return "BR";
	if (a === "6" && /[A-W]/.test(b)) return "AU";
	return undefined;
};

const YEAR_CODES = "ABCDEFGHJKLMNPRSTVWXY123456789";

/** The latest model year the 10th character can mean, up to next year. */
const vinYear = (code: string, now: Date) => {
	const index = YEAR_CODES.indexOf(code);
	if (index < 0) return undefined;
	let year = 1980 + index;
	while (year + 30 <= now.getFullYear() + 1) year += 30;
	return year;
};

const readVin = (
	data: string,
	format: BarcodeType,
	now: Date,
): BarcodeInfo | undefined => {
	// Code 39 VIN labels often carry a leading `I` (imported).
	const vin = data
		.trim()
		.toUpperCase()
		.replace(/^I(?=[A-HJ-NPR-Z0-9]{17}$)/, "");
	if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return undefined;
	if (!/\d/.test(vin) || !/[A-Z]/.test(vin)) return undefined;
	const checked = vinCheckValid(vin);
	if (format !== "code39" && !checked) return undefined;
	const region = vinRegion(vin[0]);
	return {
		type: "vin",
		vin,
		region,
		country: vinCountry(vin.slice(0, 3)),
		// Only North American VINs must encode the model year.
		year:
			checked || region === "northAmerica" ? vinYear(vin[9], now) : undefined,
	};
};

const PRODUCT_FORMATS = new Set<string>(["ean13", "ean8", "upc_a", "upc_e"]);

/**
 * What a code's text means as a barcode number, if anything. Product
 * formats are read as GTINs; anything else as GS1 data, a parcel or a VIN.
 */
export const classifyBarcode = (
	format: BarcodeType,
	raw: string,
	now = new Date(),
): BarcodeInfo | undefined => {
	const data = raw.trim();
	if (PRODUCT_FORMATS.has(format) && /^\d+$/.test(data)) {
		if (format === "upc_e") {
			const upcA = expandUpcE(data);
			return upcA ? classifyGtin13(`0${upcA}`) : undefined;
		}
		if (data.length === 12) return classifyGtin13(`0${data}`);
		if (data.length === 13) return classifyGtin13(data);
		if (data.length === 8) {
			// GS1-8 prefixes 0 and 2 are for codes a shop assigns itself.
			if (data[0] === "0" || data[0] === "2") {
				return { type: "store", gtin: data };
			}
			const prefix = gs1Prefix(`${data.slice(0, 3)}0000000000`);
			return {
				type: "product",
				gtin: data,
				region: prefix.type === "company" ? prefix.region : undefined,
			};
		}
		return undefined;
	}
	if (format === "itf14" && /^\d{14}$/.test(data)) {
		return classifyGtin13(
			data.startsWith("0") ? data.slice(1) : innerGtin(data),
		);
	}
	const elements = parseElementString(data);
	if (elements) return readGs1(elements);
	return readParcel(data) ?? readVin(data, format, now);
};

/** The GTIN that product sites can look up, when there is one. */
export const lookupGtin = (info: BarcodeInfo) =>
	info.type === "product" ||
	info.type === "medicine" ||
	info.type === "book" ||
	info.type === "music" ||
	info.type === "periodical" ||
	info.type === "gs1"
		? info.gtin
		: undefined;
