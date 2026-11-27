import type { CodeItem } from "@/domain/library/types";
import i18n from "@/i18n";
import { describeItem } from "./describe";

const code = (overrides: Partial<CodeItem>): CodeItem => ({
	kind: "code",
	id: "c1",
	seq: 1,
	folderId: null,
	createdAt: 0,
	source: "scanner",
	format: "qr",
	data: "",
	...overrides,
});

afterEach(() => i18n.changeLanguage("en"));

describe("describeItem", () => {
	it("parses QR codes and names them after their content", () => {
		expect(describeItem(code({ data: "WIFI:T:WPA;S:Home;P:x;;" }))).toEqual({
			kind: "wifi",
			parsed: expect.objectContaining({ kind: "wifi", ssid: "Home" }),
			title: "Home",
			subtitle: "Wi-Fi",
		});
	});

	it("prefers the name the user gave", () => {
		expect(
			describeItem(code({ data: "https://example.com", name: "Menu" })).title,
		).toBe("Menu");
	});

	it("falls back to the raw data when the content has no summary", () => {
		expect(describeItem(code({ data: "BEGIN:VEVENT\nEND:VEVENT" })).title).toBe(
			"BEGIN:VEVENT\nEND:VEVENT",
		);
	});

	it("localises the kind", async () => {
		await i18n.changeLanguage("fr");
		expect(describeItem(code({ data: "https://example.com" })).subtitle).toBe(
			"Lien",
		);
	});

	it("shows barcodes as text, with their format and what the number means", () => {
		expect(
			describeItem(code({ format: "ean13", data: "5901234123457" })),
		).toEqual({
			kind: "barcode",
			parsed: { kind: "text", text: "5901234123457" },
			barcode: { type: "product", gtin: "5901234123457", region: "PL" },
			title: "5901234123457",
			subtitle: "EAN-13",
		});
	});

	it("parses the payloads of 2D barcodes, keeping the format", () => {
		expect(
			describeItem(code({ format: "datamatrix", data: "https://example.com" })),
		).toMatchObject({ kind: "url", subtitle: "Data Matrix · Link" });
		expect(
			describeItem(code({ format: "aztec", data: "WIFI:S:Home;T:SAE;P:x;;" }))
				.kind,
		).toBe("wifi");
	});

	it("reads GS1 data from a Data Matrix that holds no payload", () => {
		expect(
			describeItem(
				code({
					format: "datamatrix",
					data: "]d20103400930000120172612311012AB",
				}),
			),
		).toMatchObject({
			kind: "barcode",
			subtitle: "Data Matrix",
			barcode: { type: "gs1", gtin: "3400930000120", lot: "12AB" },
		});
	});

	it("reads what a plain-text QR code's number means", () => {
		expect(describeItem(code({ data: "RR123456785FR" }))).toMatchObject({
			kind: "text",
			barcode: { type: "parcel", carrier: "laposte" },
		});
	});

	it("does not parse barcodes that happen to hold a URL", () => {
		expect(
			describeItem(code({ format: "code128", data: "https://example.com" }))
				.kind,
		).toBe("barcode");
	});

	it("copes with numeric (ML Kit) and unknown formats", () => {
		expect(
			describeItem(code({ format: 32 as never, data: "1" })).subtitle,
		).toBe("EAN-13");
		expect(
			describeItem(code({ format: 256 as never, data: "tel:+1" })).kind,
		).toBe("phone");
		expect(
			describeItem(code({ format: "mystery" as never, data: "1" })).subtitle,
		).toBe("mystery");
	});
});
