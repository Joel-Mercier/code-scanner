/** @jest-environment @shopify/react-native-skia/jestEnv.js */
import "@shopify/react-native-skia/jestSetup.js";
import { bwipIds } from "@/domain/codes/formats";
import i18n from "@/i18n";
import {
	barcodeTypes,
	choiceFormat,
	choiceLabel,
	contentKeyboard,
	numericBarcodes,
	prepareBarcode,
	sampleBarcodes,
} from "./barcodeOptions";

describe("barcode options", () => {
	it("offers every format bwip-js can draw, and the GS1 and ISBN flavours, once", () => {
		expect(new Set(barcodeTypes).size).toBe(barcodeTypes.length);
		for (const format of Object.keys(bwipIds)) {
			expect(barcodeTypes).toContain(format);
		}
		expect(barcodeTypes).toEqual(
			expect.arrayContaining(["isbn", "gs1_128", "gs1_datamatrix"]),
		);
	});

	it("saves the flavours as their plain format", () => {
		expect(choiceFormat("isbn")).toBe("ean13");
		expect(choiceFormat("gs1_128")).toBe("code128");
		expect(choiceFormat("gs1_datamatrix")).toBe("datamatrix");
		expect(choiceFormat("code93")).toBe("code93");
		expect(choiceLabel("gs1_128")).toBe("GS1-128");
		expect(choiceLabel("code93")).toBe("Code 93");
	});

	it("pre-fills valid samples", () => {
		for (const [type, sample] of Object.entries(sampleBarcodes)) {
			expect([type, prepareBarcode(type as never, sample).ok]).toEqual([
				type,
				true,
			]);
		}
	});

	it("only uses the number pad for digit-only formats", () => {
		for (const type of numericBarcodes) {
			expect(sampleBarcodes[type]).toMatch(/^\d+$/);
			expect(contentKeyboard(type).keyboardType).toBe("number-pad");
		}
		expect(contentKeyboard("isbn").keyboardType).toBe(
			"numbers-and-punctuation",
		);
	});

	it("has a description and help text for every format", () => {
		for (const type of barcodeTypes) {
			expect(i18n.exists(`app.barcode_formats.${type}`)).toBe(true);
			expect(i18n.exists(`app.barcode_help.${type}`)).toBe(true);
		}
	});
});

describe("prepareBarcode", () => {
	it("keeps plain content as typed, trimmed", () => {
		expect(prepareBarcode("code128", " Hello ")).toEqual({
			ok: true,
			data: "Hello",
		});
	});

	it("saves ISBNs as EAN-13 content, with their hyphens", () => {
		expect(prepareBarcode("isbn", "2-07-036822-X")).toEqual({
			ok: true,
			data: "978-2-07-036822-8",
		});
		expect(prepareBarcode("isbn", "978-2-07-036822-9")).toEqual({
			ok: false,
			error: { key: "isbn_invalid" },
		});
	});

	it("writes GS1 data in brackets, and checks it as GS1", () => {
		expect(prepareBarcode("gs1_128", "\u001d010950600013435210A1")).toEqual({
			ok: true,
			data: "(01)09506000134352(10)A1",
		});
		expect(prepareBarcode("gs1_datamatrix", "hello")).toEqual({
			ok: false,
			error: { key: "gs1_invalid" },
		});
		// Parses, but GS1-128 itself rejects month 13.
		expect(
			prepareBarcode("gs1_128", "(01)09506000134352(17)991340"),
		).toMatchObject({ ok: false, error: { message: expect.any(String) } });
	});

	it("checks Data Matrix content against the chosen shape", () => {
		const long = "x".repeat(200);
		expect(prepareBarcode("datamatrix", long).ok).toBe(true);
		expect(prepareBarcode("datamatrix", long, { shape: "rectangle" }).ok).toBe(
			false,
		);
	});

	it("has messages for its own errors", () => {
		expect(i18n.exists("app.create.isbn_invalid")).toBe(true);
		expect(i18n.exists("app.create.gs1_invalid")).toBe(true);
	});
});
