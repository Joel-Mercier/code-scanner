import type { KeyboardTypeOptions } from "react-native";
import { validateBarcode } from "@/components/codes/geometry/barcode";
import {
	barcodeLabels,
	bwipIds,
	type GeneratableBarcode,
} from "@/domain/codes/formats";
import type { CodeShape } from "@/domain/codes/style";
import { gs1Bracketed, normalizeIsbn } from "@/domain/codes/symbology";

/**
 * What the workshop offers: every format bwip-js draws, plus GS1 and ISBN
 * flavours of them. Those are saved as their plain format (GS1-128 as Code
 * 128, an ISBN as EAN-13) and recognised by their content, like scans.
 */
export type BarcodeChoice =
	| GeneratableBarcode
	| "isbn"
	| "gs1_128"
	| "gs1_datamatrix";

/** The formats the workshop offers, most common first. */
export const barcodeTypes: BarcodeChoice[] = [
	"ean13",
	"isbn",
	"ean8",
	"upc_a",
	"upc_e",
	"code128",
	"gs1_128",
	"code39",
	"code93",
	"itf14",
	"codabar",
	"datamatrix",
	"gs1_datamatrix",
	"pdf417",
	"aztec",
];

/** The format a choice is saved as. */
export const choiceFormat = (choice: BarcodeChoice): GeneratableBarcode => {
	if (choice === "isbn") return "ean13";
	if (choice === "gs1_128") return "code128";
	if (choice === "gs1_datamatrix") return "datamatrix";
	return choice;
};

const choiceLabels: Record<BarcodeChoice, string> = {
	...(Object.fromEntries(
		Object.keys(bwipIds).map((format) => [
			format,
			barcodeLabels[format as GeneratableBarcode] ?? format,
		]),
	) as Record<GeneratableBarcode, string>),
	isbn: "ISBN",
	gs1_128: "GS1-128",
	gs1_datamatrix: "GS1 DataMatrix",
};

export const choiceLabel = (choice: BarcodeChoice) => choiceLabels[choice];

/** Formats that only hold digits (number pad keyboard). */
export const numericBarcodes: BarcodeChoice[] = [
	"ean13",
	"ean8",
	"itf14",
	"upc_a",
	"upc_e",
];

/** The keyboard and capitalisation that suit a choice's content. */
export const contentKeyboard = (
	choice: BarcodeChoice,
): {
	keyboardType: KeyboardTypeOptions;
	autoCapitalize: "characters" | "none";
} => ({
	keyboardType: numericBarcodes.includes(choice)
		? "number-pad"
		: choice === "isbn"
			? "numbers-and-punctuation"
			: "default",
	autoCapitalize:
		choice === "code39" || choice === "code93" ? "characters" : "none",
});

/** Valid content to start from, for formats with a check digit or a syntax. */
export const sampleBarcodes: Partial<Record<BarcodeChoice, string>> = {
	ean13: "5901234123457",
	isbn: "978-2-07-036822-8",
	ean8: "96385074",
	upc_a: "036000291452",
	upc_e: "01234565",
	itf14: "00012345600012",
	gs1_128: "(01)09506000134352(17)271231(10)A1B2C3",
	gs1_datamatrix: "(01)09506000134352(17)271231(10)A1B2C3(21)1234",
};

export type BarcodeContent =
	| { ok: true; data: string }
	| {
			ok: false;
			/** An `app.create.*` key, or bwip-js' own (English) message. */
			error: { key: "isbn_invalid" | "gs1_invalid" } | { message: string };
	  };

/**
 * What the workshop saves for `input`: ISBNs become EAN-13 content (keeping
 * their hyphens for the ISBN line), GS1 data is written in brackets. Then it
 * must draw, in the symbology its choice promises.
 */
export const prepareBarcode = (
	choice: BarcodeChoice,
	input: string,
	{ shape }: { shape?: CodeShape } = {},
): BarcodeContent => {
	const text = input.trim();
	let data = text;
	if (choice === "isbn") {
		const isbn = normalizeIsbn(text);
		if (!isbn) return { ok: false, error: { key: "isbn_invalid" } };
		data = isbn;
	} else if (choice === "gs1_128" || choice === "gs1_datamatrix") {
		const gs1 = gs1Bracketed(text);
		if (!gs1) return { ok: false, error: { key: "gs1_invalid" } };
		data = gs1;
	}
	const strict = choice !== choiceFormat(choice);
	const message = validateBarcode(choiceFormat(choice), data, {
		shape,
		strict,
	});
	return message ? { ok: false, error: { message } } : { ok: true, data };
};
