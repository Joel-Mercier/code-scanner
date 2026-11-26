import { bwipIds, type GeneratableBarcode } from "@/domain/codes/formats";

/** The formats the workshop offers, most common first. */
export const barcodeTypes: GeneratableBarcode[] = [
	"ean13",
	"ean8",
	"upc_a",
	"upc_e",
	"code128",
	"code39",
	"itf14",
	"codabar",
	"datamatrix",
	"pdf417",
	"aztec",
].filter((type): type is GeneratableBarcode => type in bwipIds);

/** Formats that only hold digits (number pad keyboard). */
export const numericBarcodes: GeneratableBarcode[] = [
	"ean13",
	"ean8",
	"itf14",
	"upc_a",
	"upc_e",
];

/** Valid content to start from, for formats with a check digit. */
export const sampleBarcodes: Partial<Record<GeneratableBarcode, string>> = {
	ean13: "5901234123457",
	ean8: "96385074",
	upc_a: "036000291452",
	upc_e: "01234565",
	itf14: "00012345600012",
};
