import { scanFromURLAsync } from "expo-camera";
import { extractTextFromImage, isSupported } from "expo-text-extractor";
import { normalizeBarcodeType, scannableFormats } from "@/domain/codes/formats";
import type { FoundCode, PageReading } from "@/domain/library/types";

/** The codes printed on an image; none when it can't be read. */
export const findCodes = async (uri: string): Promise<FoundCode[]> => {
	try {
		const found = await scanFromURLAsync(uri, scannableFormats);
		return found
			.filter((code) => !!code.data)
			.map((code) => ({
				format: normalizeBarcodeType(code.type),
				data: code.data,
			}));
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
