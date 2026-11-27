import {
	barcodeLabels,
	bwipIds,
	canRender,
	isGeneratableBarcode,
	isLinearBarcode,
	normalizeBarcodeType,
	scannableFormats,
} from "./formats";

describe("normalizeBarcodeType", () => {
	it("keeps string formats", () => {
		expect(normalizeBarcodeType("qr")).toBe("qr");
		expect(normalizeBarcodeType("upc_e")).toBe("upc_e");
	});

	it("maps ML Kit's numeric formats, as numbers or digit strings", () => {
		expect(normalizeBarcodeType(256)).toBe("qr");
		expect(normalizeBarcodeType(32)).toBe("ean13");
		expect(normalizeBarcodeType("4096")).toBe("aztec");
		expect(normalizeBarcodeType("2048")).toBe("pdf417");
	});

	it("passes unknown values through as strings", () => {
		expect(normalizeBarcodeType(3)).toBe("3");
		expect(normalizeBarcodeType("99")).toBe("99");
		expect(normalizeBarcodeType(undefined)).toBe("");
		expect(normalizeBarcodeType(null)).toBe("");
	});
});

describe("format capabilities", () => {
	it("draws QR codes and every format the scanner reads", () => {
		expect(canRender("qr")).toBe(true);
		for (const format of scannableFormats) {
			expect(canRender(format)).toBe(true);
		}
		for (const format of Object.keys(bwipIds)) {
			expect(isGeneratableBarcode(format as never)).toBe(true);
		}
		expect(isGeneratableBarcode("qr")).toBe(false);
		expect(canRender("maxicode" as never)).toBe(false);
	});

	it("tells linear barcodes from 2D ones", () => {
		expect(isLinearBarcode("ean13")).toBe(true);
		expect(isLinearBarcode("code128")).toBe(true);
		expect(isLinearBarcode("itf14")).toBe(true);
		expect(isLinearBarcode("qr")).toBe(false);
		expect(isLinearBarcode("aztec")).toBe(false);
		expect(isLinearBarcode("datamatrix")).toBe(false);
		expect(isLinearBarcode("pdf417")).toBe(false);
		expect(isLinearBarcode("code93")).toBe(true);
	});

	it("has a label for every scannable format", () => {
		for (const format of scannableFormats) {
			expect(barcodeLabels[format]).toEqual(expect.any(String));
		}
	});
});
