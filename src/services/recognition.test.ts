import { scanFromURLAsync } from "expo-camera";
import { extractTextFromImage } from "expo-text-extractor";
import { readQRPixels } from "@/domain/codes/readQR";
import { loadPixels } from "./pixels";
import { findCodes, readPage } from "./recognition";

jest.mock("expo-camera", () => ({ scanFromURLAsync: jest.fn() }));
jest.mock("expo-text-extractor", () => ({
	isSupported: true,
	extractTextFromImage: jest.fn(),
}));
jest.mock("./pixels", () => ({ loadPixels: jest.fn() }));
jest.mock("@/domain/codes/readQR", () => ({ readQRPixels: jest.fn() }));

const scan = jest.mocked(scanFromURLAsync);
const extract = jest.mocked(extractTextFromImage);
const pixels = jest.mocked(loadPixels);
const readQR = jest.mocked(readQRPixels);
const image = { width: 1, height: 1, data: new Uint8Array(4) };

beforeEach(() => jest.clearAllMocks());

describe("findCodes", () => {
	it("keeps codes with content, with normalised formats", async () => {
		scan.mockResolvedValue([
			{ type: "qr", data: "https://example.com" },
			{ type: "256", data: "numeric format" },
			{ type: "ean13", data: "" },
		] as never);
		await expect(findCodes("file:///p.jpg")).resolves.toEqual([
			{ format: "qr", data: "https://example.com" },
			{ format: "qr", data: "numeric format" },
		]);
	});

	it("only reads the pixels itself when asked to be thorough", async () => {
		scan.mockResolvedValue([] as never);
		pixels.mockResolvedValue(image);
		readQR.mockReturnValue("inverted");
		await expect(findCodes("file:///p.jpg")).resolves.toEqual([]);
		expect(pixels).not.toHaveBeenCalled();
		await expect(
			findCodes("file:///p.jpg", { thorough: true }),
		).resolves.toEqual([{ format: "qr", data: "inverted" }]);
		expect(readQR).toHaveBeenCalledWith(image);
	});

	it("skips the slow reader when the phone found a code", async () => {
		scan.mockResolvedValue([{ type: "qr", data: "fast" }] as never);
		await expect(
			findCodes("file:///p.jpg", { thorough: true }),
		).resolves.toEqual([{ format: "qr", data: "fast" }]);
		expect(pixels).not.toHaveBeenCalled();
	});

	it("finds nothing when neither reader does", async () => {
		scan.mockResolvedValue([] as never);
		pixels.mockResolvedValue(undefined);
		await expect(
			findCodes("file:///p.jpg", { thorough: true }),
		).resolves.toEqual([]);
	});

	it("finds nothing when the image can't be scanned", async () => {
		jest.spyOn(console, "warn").mockImplementation(() => {});
		scan.mockRejectedValue(new Error("bad image"));
		await expect(findCodes("file:///p.jpg")).resolves.toEqual([]);
	});
});

describe("readPage", () => {
	it("joins the recognised lines and lists the codes", async () => {
		extract.mockResolvedValue(["Invoice 42", "Total 12,00 €", ""]);
		scan.mockResolvedValue([{ type: "qr", data: "pay" }] as never);
		await expect(readPage("file:///p.jpg")).resolves.toEqual({
			text: "Invoice 42\nTotal 12,00 €",
			codes: [{ format: "qr", data: "pay" }],
		});
	});

	it("fails when the text can't be read yet, to be tried again", async () => {
		extract.mockRejectedValue(new Error("model not downloaded"));
		scan.mockResolvedValue([] as never);
		await expect(readPage("file:///p.jpg")).rejects.toThrow("model");
	});
});
