/** @jest-environment @shopify/react-native-skia/jestEnv.js */
import "@shopify/react-native-skia/jestSetup.js";
import { validateBarcode } from "@/components/codes/geometry/barcode";
import { bwipIds } from "@/domain/codes/formats";
import i18n from "@/i18n";
import {
	barcodeTypes,
	numericBarcodes,
	sampleBarcodes,
} from "./barcodeOptions";

describe("barcode options", () => {
	it("offers every format bwip-js can draw, once", () => {
		expect([...barcodeTypes].sort()).toEqual(Object.keys(bwipIds).sort());
	});

	it("pre-fills valid samples", () => {
		for (const [type, sample] of Object.entries(sampleBarcodes)) {
			expect([type, validateBarcode(type as never, sample)]).toEqual([
				type,
				null,
			]);
		}
	});

	it("only uses the number pad for digit-only formats", () => {
		for (const type of numericBarcodes) {
			expect(sampleBarcodes[type]).toMatch(/^\d+$/);
		}
	});

	it("has a description and help text for every format", () => {
		for (const type of barcodeTypes) {
			expect(i18n.exists(`app.barcode_formats.${type}`)).toBe(true);
			expect(i18n.exists(`app.barcode_help.${type}`)).toBe(true);
		}
	});
});
