import encodeQR from "qr";
import { type Pixels, readQRPixels } from "./readQR";

const MODULE = 4;

/** Draws a QR code as RGBA pixels: dark on light, or light on dark. */
const rasterize = (text: string, inverted = false): Pixels => {
	const matrix = encodeQR(text, "raw", { border: 4 });
	const size = matrix.length * MODULE;
	const data = new Uint8Array(size * size * 4);
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const dark =
				matrix[Math.floor(y / MODULE)][Math.floor(x / MODULE)] !== inverted;
			const i = (y * size + x) * 4;
			data.fill(dark ? 20 : 240, i, i + 3);
			data[i + 3] = 255;
		}
	}
	return { width: size, height: size, data };
};

describe("readQRPixels", () => {
	it("reads a dark-on-light code", () => {
		expect(readQRPixels(rasterize("https://example.com/a"))).toBe(
			"https://example.com/a",
		);
	});

	it("reads a light-on-dark (inverted) code", () => {
		expect(readQRPixels(rasterize("Inverted code", true))).toBe(
			"Inverted code",
		);
	});

	it("finds nothing in a blank image", () => {
		const data = new Uint8Array(200 * 200 * 4).fill(255);
		expect(readQRPixels({ width: 200, height: 200, data })).toBeUndefined();
	});
});
