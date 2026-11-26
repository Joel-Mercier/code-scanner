import { CameraView } from "expo-camera";
import { fileSystem, pickDirectory } from "@/test/fileSystem";
import { deleteDocumentFiles, exportDocument, scanDocument } from "./documents";

jest.mock("expo-camera", () => ({
	CameraView: { scanDocumentAsync: jest.fn() },
}));
jest.mock("@/lib/id", () => ({ createId: () => "doc-1" }));

const scanner = jest.mocked(CameraView.scanDocumentAsync);

beforeEach(() => {
	fileSystem.reset();
	scanner.mockReset();
});

describe("scanDocument", () => {
	it("copies the pages and the PDF out of the cache", async () => {
		fileSystem.seed("file:///cache/scan/a.jpeg", 10);
		fileSystem.seed("file:///cache/scan/b.png", 20);
		fileSystem.seed("file:///cache/scan/out.pdf", 30);
		scanner.mockResolvedValue({
			pages: ["file:///cache/scan/a.jpeg", "file:///cache/scan/b.png"],
			pdfUri: "file:///cache/scan/out.pdf",
		} as never);

		await expect(scanDocument()).resolves.toEqual({
			id: "doc-1",
			files: {
				pages: [
					"file:///document/documents/doc-1/page-1.jpeg",
					"file:///document/documents/doc-1/page-2.png",
				],
				pdfUri: "file:///document/documents/doc-1/document.pdf",
				size: 60,
			},
		});
		expect(scanner).toHaveBeenCalledWith({ requestPdf: true, quality: 0.9 });
	});

	it("names extension-less pages .jpg and works without a PDF", async () => {
		fileSystem.seed("file:///cache/page", 5);
		scanner.mockResolvedValue({ pages: ["file:///cache/page"] } as never);
		await expect(scanDocument()).resolves.toEqual({
			id: "doc-1",
			files: {
				pages: ["file:///document/documents/doc-1/page-1.jpg"],
				pdfUri: undefined,
				size: 5,
			},
		});
	});

	it("is null when the user cancels", async () => {
		scanner.mockResolvedValue(null as never);
		await expect(scanDocument()).resolves.toBeNull();
		scanner.mockResolvedValue({ pages: [] } as never);
		await expect(scanDocument()).resolves.toBeNull();
		expect(fileSystem.list()).toEqual([]);
	});
});

describe("deleteDocumentFiles", () => {
	it("removes the document's folder", async () => {
		fileSystem.seed("file:///cache/p.jpg");
		scanner.mockResolvedValue({ pages: ["file:///cache/p.jpg"] } as never);
		await scanDocument();
		deleteDocumentFiles("doc-1");
		expect(fileSystem.list()).toEqual(["file:///cache/p.jpg"]);
	});

	it("does nothing for a document without files", () => {
		expect(() => deleteDocumentFiles("missing")).not.toThrow();
	});
});

describe("exportDocument", () => {
	it("writes the PDF into the picked folder", async () => {
		fileSystem.seed("file:///doc.pdf", 7);
		await exportDocument({
			name: "Lease",
			pages: ["file:///p1.jpg"],
			pdfUri: "file:///doc.pdf",
		});
		expect(pickDirectory).toHaveBeenCalled();
		expect(fileSystem.read("content://picked/Lease.pdf")).toHaveLength(7);
	});

	it("writes the first page when there is no PDF", async () => {
		fileSystem.seed("file:///p1.jpg", 3);
		await exportDocument({ name: "Receipt", pages: ["file:///p1.jpg"] });
		expect(fileSystem.has("content://picked/Receipt.jpg")).toBe(true);
	});
});
