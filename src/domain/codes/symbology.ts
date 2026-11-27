/**
 * Which bwip-js symbology draws a code, read from what it holds: GS1 data
 * keeps its FNC1 (GS1-128, GS1 DataMatrix), books, scores and periodicals get
 * their ISBN / ISMN / ISSN line, ITF codes that aren't 14 digits are plain
 * Interleaved 2 of 5. The saved format stays the scanner's, so nothing in the
 * library changes shape.
 */
import { barcodeLabels, bwipIds, type GeneratableBarcode } from "./formats";
import { gtinCheckDigit, isValidGtin, parseElementString } from "./gs1";
import type { CodeShape } from "./style";

export type Symbology = {
	/** bwip-js symbology id. */
	bcid: string;
	/** The text to hand bwip-js. */
	text: string;
	/** Its name, as shown to the user. */
	label: string;
};

/** GS1 data in brackets (`(01)…(17)…`), however it was written; else `undefined`. */
export const gs1Bracketed = (data: string) =>
	parseElementString(data)
		?.map(({ ai, value }) => `(${ai})${value}`)
		.join("");

/** ISBN-13 or ISMN with the hyphens printed on the item (`978-2-07-036822-8`). */
const HYPHENATED = /^97[89](-\d+){3}-\d$/;

/** Whether `data` is an ISBN / ISMN written with its hyphens. */
export const isHyphenatedIsbn = (data: string) =>
	HYPHENATED.test(data) && data.replace(/-/g, "").length === 13;

const isbn10Check = (body: string) => {
	let sum = 0;
	for (let i = 0; i < 9; i++) sum += Number(body[i]) * (10 - i);
	const check = (11 - (sum % 11)) % 11;
	return check === 10 ? "X" : String(check);
};

/**
 * An ISBN as typed (ISBN-13 or ISBN-10, with or without hyphens or spaces)
 * as the code's content: the ISBN-13 with its hyphens when it was typed with
 * all of them (they can't be worked out, they depend on the publisher), else
 * its 13 digits. ISMNs (`979-0-…`) work the same. `undefined` when it isn't a
 * valid one.
 */
export const normalizeIsbn = (input: string) => {
	const text = input
		.trim()
		.toUpperCase()
		.replace(/^IS[BM]N(-1[03])?:?\s*/, "")
		.replace(/\s+/g, "-");
	if (!/^[\dX-]+$/.test(text) || /--|^-|-$/.test(text)) return undefined;
	const digits = text.replace(/-/g, "");
	const hyphenated = text.includes("-");
	if (/^\d{9}[\dX]$/.test(digits)) {
		if (isbn10Check(digits) !== digits[9]) return undefined;
		const body = `978${digits.slice(0, 9)}`;
		const check = gtinCheckDigit(body);
		// The ISBN-10's own groups, with the 978 prefix and the new check digit.
		const groups = text.split("-");
		return hyphenated && groups.length === 4
			? `978-${groups.slice(0, 3).join("-")}-${check}`
			: body + check;
	}
	if (!/^97[89]\d{10}$/.test(digits) || !isValidGtin(digits)) return undefined;
	return hyphenated && isHyphenatedIsbn(text) ? text : digits;
};

/** The ISSN line of a periodical's EAN-13 (`977…`): `0317-8471 00`. */
export const issnOf = (ean: string) => {
	if (!/^977\d{10}$/.test(ean) || !isValidGtin(ean)) return undefined;
	const body = ean.slice(3, 10);
	let sum = 0;
	for (let i = 0; i < 7; i++) sum += Number(body[i]) * (8 - i);
	const check = (11 - (sum % 11)) % 11;
	const issn = `${body.slice(0, 4)}-${body.slice(4)}${check === 10 ? "X" : check}`;
	// The two digits after the ISSN tell the issue variant apart.
	return `${issn} ${ean.slice(10, 12)}`;
};

const plain = (format: GeneratableBarcode, text: string): Symbology => ({
	bcid: bwipIds[format],
	text,
	label: barcodeLabels[format] ?? format,
});

/**
 * The ways to draw `data` as `format`, best first: the specialised symbology
 * the content calls for, then the plain one in case it refuses the data.
 */
export const symbologiesOf = (
	format: GeneratableBarcode,
	data: string,
	{ shape }: { shape?: CodeShape } = {},
): Symbology[] => {
	switch (format) {
		case "ean13": {
			if (isHyphenatedIsbn(data)) {
				const ismn = data.startsWith("979-0-");
				return [
					{
						bcid: ismn ? "ismn" : "isbn",
						text: data,
						label: ismn ? "ISMN" : "ISBN",
					},
					plain(format, data.replace(/-/g, "")),
				];
			}
			const issn = issnOf(data);
			return issn
				? [{ bcid: "issn", text: issn, label: "ISSN" }, plain(format, data)]
				: [plain(format, data)];
		}
		case "itf14":
			// Android reads any Interleaved 2 of 5 as "ITF-14", whatever its length.
			return /^\d{13,14}$/.test(data)
				? [plain(format, data)]
				: [{ bcid: "interleaved2of5", text: data, label: "ITF" }];
		case "code128": {
			const gs1 = gs1Bracketed(data);
			return gs1
				? [
						{ bcid: "gs1-128", text: gs1, label: "GS1-128" },
						plain(format, data),
					]
				: [plain(format, data)];
		}
		case "datamatrix": {
			const rectangle = shape === "rectangle";
			const gs1 = gs1Bracketed(data);
			const square = plain(format, data);
			const own = rectangle
				? { ...square, bcid: "datamatrixrectangular" }
				: square;
			return gs1
				? [
						{
							bcid: rectangle ? "gs1datamatrixrectangular" : "gs1datamatrix",
							text: gs1,
							label: "GS1 DataMatrix",
						},
						own,
					]
				: [own];
		}
		default:
			return [plain(format, data)];
	}
};

/** The name of a code's symbology, from its content ("GS1-128", "ISBN"…). */
export const symbologyLabel = (format: GeneratableBarcode, data: string) =>
	symbologiesOf(format, data)[0].label;
