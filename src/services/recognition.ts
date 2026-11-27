import { scanFromURLAsync } from "expo-camera";
import { extractTextFromImage, isSupported } from "expo-text-extractor";
import { normalizeBarcodeType, scannableFormats } from "@/domain/codes/formats";
import { readQRPixels } from "@/domain/codes/readQR";
import type { FoundCode, PageReading } from "@/domain/library/types";
import { loadPixels } from "./pixels";

/** A QR code the phone's reader missed (an inverted one, say), read in JS. */
const readQRSlowly = async (uri: string): Promise<FoundCode[]> => {
	const pixels = await loadPixels(uri);
	const data = pixels && readQRPixels(pixels);
	return data ? [{ format: "qr", data }] : [];
};

/**
 * The codes printed on an image; none when it can't be read. `thorough`
 * looks again for a QR code in JS when the phone finds nothing: it takes a
 * second or two, so only when the user is waiting for a code.
 */
export const findCodes = async (
	uri: string,
	{ thorough = false }: { thorough?: boolean } = {},
): Promise<FoundCode[]> => {
	try {
		const found = (await scanFromURLAsync(uri, scannableFormats))
			.filter((code) => !!code.data)
			.map((code) => ({
				format: normalizeBarcodeType(code.type),
				data: code.data,
			}));
		return found.length > 0 || !thorough ? found : await readQRSlowly(uri);
	} catch (error) {
		console.warn("Could not look for codes", error);
		return [];
	}
};

/**
 * Reads a page on the device: its text (Vision on iOS, ML Kit on Android)
 * and the codes on it. Rejects when the text can't be read yet (Android
 * fetches its text model on first use), so the page is tried again later.
 */
export const readPage = async (uri: string): Promise<PageReading> => {
	const [lines, codes] = await Promise.all([
		isSupported ? extractTextFromImage(uri) : Promise.resolve([]),
		findCodes(uri),
	]);
	return { text: lines.join("\n").trim(), codes };
};
