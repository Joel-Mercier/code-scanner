import type { BarcodeType } from "expo-camera";

/** Every symbology the live scanner looks for. */
export const scannableFormats: BarcodeType[] = [
	"qr",
	"aztec",
	"codabar",
	"code128",
	"code39",
	"code93",
	"datamatrix",
	"ean13",
	"ean8",
	"itf14",
	"pdf417",
	"upc_a",
	"upc_e",
];

export const barcodeLabels: Partial<Record<BarcodeType, string>> = {
	aztec: "Aztec",
	codabar: "Codabar",
	code128: "Code 128",
	code39: "Code 39",
	code93: "Code 93",
	datamatrix: "Data Matrix",
	ean13: "EAN-13",
	ean8: "EAN-8",
	itf14: "ITF-14",
	pdf417: "PDF417",
	upc_a: "UPC-A",
	upc_e: "UPC-E",
	qr: "QR",
};

/** Barcodes bwip-js can draw (QR codes are drawn by `qr`). */
export type GeneratableBarcode = Exclude<BarcodeType, "qr">;

/** bwip-js symbology ids. */
export const bwipIds: Record<GeneratableBarcode, string> = {
	aztec: "azteccode",
	codabar: "rationalizedCodabar",
	code128: "code128",
	code39: "code39",
	code93: "code93",
	datamatrix: "datamatrix",
	ean13: "ean13",
	ean8: "ean8",
	itf14: "itf14",
	pdf417: "pdf417",
	upc_a: "upca",
	upc_e: "upce",
};

export const isGeneratableBarcode = (
	format: BarcodeType,
): format is GeneratableBarcode => format in bwipIds;

/** Whether the app can draw a code of this format. */
export const canRender = (format: BarcodeType) =>
	format === "qr" || isGeneratableBarcode(format);

/** One-dimensional barcodes (bars and human-readable text). */
export const isLinearBarcode = (format: BarcodeType) =>
	isGeneratableBarcode(format) &&
	!["aztec", "datamatrix", "pdf417"].includes(format);

/**
 * ML Kit's numeric barcode formats. On Android, `scanFromURLAsync` returns
 * these numbers as `type` instead of the string the live scanner returns.
 */
const mlKitFormats: Record<number, BarcodeType> = {
	1: "code128",
	2: "code39",
	4: "code93",
	8: "codabar",
	16: "datamatrix",
	32: "ean13",
	64: "ean8",
	128: "itf14",
	256: "qr",
	512: "upc_a",
	1024: "upc_e",
	2048: "pdf417",
	4096: "aztec",
};

/** Always a `BarcodeType` string, whatever the platform handed back. */
export const normalizeBarcodeType = (type: unknown): BarcodeType => {
	if (typeof type === "number") {
		return mlKitFormats[type] ?? (String(type) as BarcodeType);
	}
	if (typeof type === "string" && /^\d+$/.test(type)) {
		return mlKitFormats[Number(type)] ?? (type as BarcodeType);
	}
	return String(type ?? "") as BarcodeType;
};
