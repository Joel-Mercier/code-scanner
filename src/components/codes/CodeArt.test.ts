/** @jest-environment @shopify/react-native-skia/jestEnv.js */
import "@shopify/react-native-skia/jestSetup.js";
import { buildGeometry, layoutGeometry } from "./CodeArt";

describe("buildGeometry", () => {
	it("draws QR codes, with more error correction under a logo", () => {
		const plain = buildGeometry("qr", "https://example.com/a-long-path");
		const withLogo = buildGeometry("qr", "https://example.com/a-long-path", {
			color: "ink",
			logo: "file:///logo.png",
		});
		expect(plain.type).toBe("qr");
		expect(withLogo.type).toBe("qr");
		if (plain.type === "qr" && withLogo.type === "qr") {
			expect(withLogo.qr.modules).toBeGreaterThan(plain.qr.modules);
		}
	});

	it("draws barcodes, flagging linear ones", () => {
		expect(buildGeometry("ean13", "5901234123457")).toMatchObject({
			type: "barcode",
			linear: true,
		});
		expect(buildGeometry("datamatrix", "hello")).toMatchObject({
			type: "barcode",
			linear: false,
		});
	});

	it("reports formats it can't draw and invalid content", () => {
		expect(buildGeometry("code93", "ABC")).toEqual({
			type: "error",
			message: "code93",
		});
		expect(buildGeometry("ean13", "letters")).toMatchObject({
			type: "error",
			message: expect.any(String),
		});
	});
});

describe("layoutGeometry", () => {
	it("scales QR codes to a square", () => {
		const geometry = buildGeometry("qr", "hello");
		expect(layoutGeometry(geometry, 210)).toEqual({
			width: 210,
			height: 210,
			scaleX: 10,
			scaleY: 10,
		});
	});

	it("keeps a barcode's proportions within the box", () => {
		const geometry = buildGeometry("ean13", "5901234123457");
		if (geometry.type !== "barcode") throw new Error("expected a barcode");
		const layout = layoutGeometry(geometry, 300);
		expect(layout.scaleX).toBe(layout.scaleY);
		expect(layout.width).toBeLessThanOrEqual(300);
		expect(layout.height).toBeLessThanOrEqual(300 * 0.9);
		expect(layout.width / layout.height).toBeCloseTo(
			geometry.barcode.width / geometry.barcode.height,
		);
	});

	it("stretches linear barcodes to a set bar height (thumbnails)", () => {
		const geometry = buildGeometry("code128", "abc", undefined, {
			includeText: false,
		});
		expect(layoutGeometry(geometry, 100, 0.44)).toMatchObject({
			width: 100,
			height: 44,
		});
	});

	it("doesn't stretch 2D barcodes", () => {
		const geometry = buildGeometry("pdf417", "hello");
		const layout = layoutGeometry(geometry, 100, 0.44);
		expect(layout.scaleX).toBe(layout.scaleY);
	});

	it("leaves room for the raw text when a code can't be drawn", () => {
		expect(layoutGeometry(buildGeometry("code93", "x"), 100)).toEqual({
			width: 100,
			height: 50,
			scaleX: 1,
			scaleY: 1,
		});
	});
});
