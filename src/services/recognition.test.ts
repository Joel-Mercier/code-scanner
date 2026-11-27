import { scanFromURLAsync } from "expo-camera";
import { extractTextFromImage } from "expo-text-extractor";
import { findCodes, readPage } from "./recognition";

jest.mock("expo-camera", () => ({ scanFromURLAsync: jest.fn() }));
jest.mock("expo-text-extractor", () => ({
	isSupported: true,
	extractTextFromImage: jest.fn(),
}));

const scan = jest.mocked(scanFromURLAsync);
const extract = jest.mocked(extractTextFromImage);

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
