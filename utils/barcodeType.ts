import type { BarcodeType } from "expo-camera";

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
