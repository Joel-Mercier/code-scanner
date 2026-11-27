import { decodeQR } from "qr/decode.js";

export type Pixels = {
	width: number;
	height: number;
	/** RGBA, 4 bytes a pixel, row by row. */
	data: Uint8Array | Uint8ClampedArray;
};

/** How long the slow, thorough retries may take on the JS thread. */
const TIME_LIMIT = 2000;

/**
 * Reads a QR code from a photo's pixels, on the JS thread. Slower than the
 * phone's own reader, but it also reads light-on-dark (inverted) codes,
 * which ML Kit and Vision often miss. `undefined` when there's none.
 */
export const readQRPixels = (pixels: Pixels) => {
	try {
		return (
			decodeQR(pixels, {
				format: "RGBA",
				effort: Number.POSITIVE_INFINITY,
				timeLimit: TIME_LIMIT,
			}) || undefined
		);
	} catch {
		return undefined;
	}
};
