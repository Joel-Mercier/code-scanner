import { CameraView } from "expo-camera";
import * as Print from "expo-print";
import PdfThumbnail from "react-native-pdf-thumbnail";
import { fileSystem, pickDirectory } from "@/test/fileSystem";
import {
	addMissingPdf,
	applyPageEdits,
	createDocumentFromPdf,
	createDocumentFromPhotos,
	deleteDocumentFiles,
	exportDocument,
	mergeDocumentFiles,
	namedPdf,
	pageUri,
	pageUris,
	pdfUri,
	printDocument,
	scanDocument,
} from "./documents";
import { buildPdf } from "./pdf";

jest.mock("expo-camera", () => ({
	CameraView: { scanDocumentAsync: jest.fn() },
}));
jest.mock("expo-print", () => ({ printAsync: jest.fn() }));
jest.mock("react-native-pdf-thumbnail", () => ({
	__esModule: true,
	default: { generateAllPages: jest.fn() },
}));
jest.mock("./pdf", () => ({
	buildPdf: jest.fn(
		async (images: Uint8Array[]) => new Uint8Array(images.length),
	),
}));

// Each mockSteps image lands in the cache as a new 4-byte JPEG.
let mockRendered = 0;
const mockSteps: { uri: unknown; rotate?: number; resize?: unknown }[] = [];
jest.mock("expo-image-manipulator", () => {
	const image = (width: number, height: number) => ({
		width,
		height,
		saveAsync: jest.fn(async () => {
			const uri = `file:///cache/mockSteps-${++mockRendered}.jpg`;
			const { fileSystem } = jest.requireActual("@/test/fileSystem");
			fileSystem.seed(uri, 4);
			return { uri, width, height };
		}),
	});
	return {
		SaveFormat: { JPEG: "jpeg", PNG: "png" },
		ImageManipulator: {
			manipulate: jest.fn((uri: unknown) => {
				const step: { uri: unknown; rotate?: number; resize?: unknown } = {
					uri,
				};
				mockSteps.push(step);
				const context = {
					rotate: (degrees: number) => {
						step.rotate = degrees;
						return context;
					},
					resize: (size: unknown) => {
						step.resize = size;
						return context;
					},
					renderAsync: async () =>
						typeof uri === "string" && uri.includes("huge")
							? image(5200, 3000)
							: image(1200, 1600),
				};
				return context;
			}),
		},
	};
});

let mockIds = 0;
jest.mock("@/lib/id", () => ({ createId: () => `id${++mockIds}` }));

const scanner = jest.mocked(CameraView.scanDocumentAsync);
const pdf = jest.mocked(buildPdf);
const DIR = "file:///document/documents";

beforeEach(() => {
	fileSystem.reset();
	jest.clearAllMocks();
	mockIds = 0;
	mockRendered = 0;
	mockSteps.length = 0;
});

describe("paths", () => {
	it("resolves a document's files from their names", () => {
		const doc = { id: "d", pages: ["a.jpg", "b.jpg"], pdf: "document.pdf" };
		expect(pageUri(doc, "a.jpg")).toBe(`${DIR}/d/a.jpg`);
		expect(pageUris(doc)).toEqual([`${DIR}/d/a.jpg`, `${DIR}/d/b.jpg`]);
		expect(pdfUri(doc)).toBe(`${DIR}/d/document.pdf`);
		expect(pdfUri({ id: "d" })).toBeUndefined();
	});
});

describe("scanDocument", () => {
	it("copies the pages and the scanner's PDF out of the cache", async () => {
		fileSystem.seed("file:///cache/scan/a.jpeg", 10);
		fileSystem.seed("file:///cache/scan/b.png", 20);
		fileSystem.seed("file:///cache/scan/out.pdf", 30);
		scanner.mockResolvedValue({
			pages: ["file:///cache/scan/a.jpeg", "file:///cache/scan/b.png"],
			pdfUri: "file:///cache/scan/out.pdf",
		} as never);

		await expect(scanDocument()).resolves.toEqual({
			id: "id1",
			files: {
				pages: ["page-id2.jpeg", "page-id3.png"],
				pdf: "document.pdf",
				size: 60,
			},
		});
		expect(scanner).toHaveBeenCalledWith({ requestPdf: true, quality: 0.9 });
		expect(pdf).not.toHaveBeenCalled();
	});

	it("builds the PDF when the scanner gives none", async () => {
		fileSystem.seed("file:///cache/page", 5);
		scanner.mockResolvedValue({ pages: ["file:///cache/page"] } as never);
		const scan = await scanDocument();
		expect(scan?.files).toEqual({
			pages: ["page-id2.jpg"],
			pdf: "document.pdf",
			size: 6,
		});
		expect(pdf).toHaveBeenCalledTimes(1);
		expect(fileSystem.has(`${DIR}/id1/document.pdf`)).toBe(true);
	});

	it("is null when the user cancels", async () => {
		scanner.mockResolvedValue(null as never);
		await expect(scanDocument()).resolves.toBeNull();
		scanner.mockResolvedValue({ pages: [] } as never);
		await expect(scanDocument()).resolves.toBeNull();
		expect(fileSystem.list()).toEqual([]);
	});

	it("leaves nothing behind when copying fails", async () => {
		scanner.mockResolvedValue({
			pages: ["file:///cache/missing.jpg"],
		} as never);
		await expect(scanDocument()).rejects.toThrow("No such file");
		expect(fileSystem.list()).toEqual([]);
	});
});

describe("createDocumentFromPhotos", () => {
	it("re-encodes photos as JPEGs, scaling big ones down", async () => {
		const result = await createDocumentFromPhotos([
			"file:///photos/a.heic",
			"file:///photos/huge.jpg",
		]);
		expect(result.files.pages).toEqual(["page-id2.jpg", "page-id3.jpg"]);
		expect(result.files.pdf).toBe("document.pdf");
		expect(mockSteps.find((step) => step.resize)?.resize).toEqual({
			width: 2600,
		});
		expect(pdf).toHaveBeenCalledWith(
			[expect.any(Uint8Array), expect.any(Uint8Array)],
			undefined,
		);
	});
});

describe("createDocumentFromPdf", () => {
	it("keeps the PDF and draws its pages", async () => {
		fileSystem.seed("file:///cache/picked.pdf", 50);
		fileSystem.seed("file:///cache/thumb-0.jpg", 3);
		fileSystem.seed("file:///cache/thumb-1.jpg", 3);
		jest.mocked(PdfThumbnail.generateAllPages).mockResolvedValue([
			{ uri: "file:///cache/thumb-0.jpg", width: 1, height: 1 },
			{ uri: "file:///cache/thumb-1.jpg", width: 1, height: 1 },
		]);
		const result = await createDocumentFromPdf("file:///cache/picked.pdf");
		expect(result.files).toEqual({
			pages: ["page-id2.jpg", "page-id3.jpg"],
			pdf: "document.pdf",
			size: 56,
		});
		expect(PdfThumbnail.generateAllPages).toHaveBeenCalledWith(
			`${DIR}/id1/document.pdf`,
			{ quality: 90 },
		);
		expect(pdf).not.toHaveBeenCalled();
	});

	it("cleans up when the PDF can't be read", async () => {
		fileSystem.seed("file:///cache/locked.pdf", 5);
		jest
			.mocked(PdfThumbnail.generateAllPages)
			.mockRejectedValue(new Error("PASSWORD_PROTECTED"));
		await expect(
			createDocumentFromPdf("file:///cache/locked.pdf"),
		).rejects.toThrow();
		expect(fileSystem.list()).toEqual(["file:///cache/locked.pdf"]);
	});
});

describe("applyPageEdits", () => {
	const doc = {
		id: "d",
		name: "Lease",
		pages: ["p1.jpg", "p2.jpg", "p3.jpg"],
		pdf: "document.pdf",
	};
	beforeEach(() => {
		for (const page of doc.pages) fileSystem.seed(`${DIR}/d/${page}`, 2);
		fileSystem.seed(`${DIR}/d/document.pdf`, 9);
	});

	it("reorders, rotates, removes and adds, then rebuilds the PDF", async () => {
		fileSystem.seed("file:///cache/new.jpg", 7);
		const files = await applyPageEdits(doc, [
			{ uri: `${DIR}/d/p3.jpg`, page: "p3.jpg", rotation: 0 },
			{ uri: `${DIR}/d/p1.jpg`, page: "p1.jpg", rotation: 90 },
			{ uri: "file:///cache/new.jpg", rotation: 0 },
		]);
		expect(files.pages).toEqual(["p3.jpg", "page-id1.jpg", "page-id2.jpg"]);
		expect(mockSteps).toEqual([{ uri: `${DIR}/d/p1.jpg`, rotate: 90 }]);
		// The removed page and the turned page's old image are gone.
		expect(fileSystem.has(`${DIR}/d/p1.jpg`)).toBe(false);
		expect(fileSystem.has(`${DIR}/d/p2.jpg`)).toBe(false);
		expect(pdf).toHaveBeenCalledWith(expect.any(Array), "Lease");
		expect(fileSystem.read(`${DIR}/d/document.pdf`)).toHaveLength(3);
		expect(files.size).toBe(2 + 4 + 7 + 3);
	});
});

describe("addMissingPdf", () => {
	it("builds the PDF of an older document", async () => {
		fileSystem.seed(`${DIR}/d/p1.jpg`, 2);
		const files = await addMissingPdf({
			id: "d",
			name: "Old",
			pages: ["p1.jpg"],
		});
		expect(files).toEqual({ pages: ["p1.jpg"], pdf: "document.pdf", size: 3 });
	});
});

describe("mergeDocumentFiles", () => {
	it("copies every page into a new document, readings along", async () => {
		fileSystem.seed(`${DIR}/a/a1.jpg`, 1);
		fileSystem.seed(`${DIR}/b/b1.jpg`, 1);
		fileSystem.seed(`${DIR}/b/b2.jpg`, 1);
		const reading = { text: "hello", codes: [] };
		const merged = await mergeDocumentFiles([
			{
				id: "a",
				name: "A",
				pages: ["a1.jpg"],
				readings: { "a1.jpg": reading },
			},
			{ id: "b", name: "B", pages: ["b1.jpg", "b2.jpg"] },
		]);
		expect(merged.id).toBe("id1");
		expect(merged.files.pages).toEqual([
			"page-id2.jpg",
			"page-id3.jpg",
			"page-id4.jpg",
		]);
		expect(merged.readings).toEqual({ "page-id2.jpg": reading });
		expect(fileSystem.has(`${DIR}/a/a1.jpg`)).toBe(true);
	});
});

describe("deleteDocumentFiles", () => {
	it("removes the document's folder", async () => {
		fileSystem.seed("file:///cache/p.jpg");
		scanner.mockResolvedValue({ pages: ["file:///cache/p.jpg"] } as never);
		await scanDocument();
		deleteDocumentFiles("id1");
		expect(fileSystem.list()).toEqual(["file:///cache/p.jpg"]);
	});

	it("does nothing for a document without files", () => {
		expect(() => deleteDocumentFiles("missing")).not.toThrow();
	});
});

describe("namedPdf", () => {
	it("copies the PDF under the document's name, over an older copy", async () => {
		fileSystem.seed(`${DIR}/d/document.pdf`, 7);
		const doc = {
			id: "d",
			name: "Lease: 2026",
			pages: [],
			pdf: "document.pdf",
		};
		await namedPdf(doc);
		await expect(namedPdf(doc)).resolves.toBe(
			"file:///cache/share/d/Lease- 2026.pdf",
		);
		expect(
			fileSystem.read("file:///cache/share/d/Lease- 2026.pdf"),
		).toHaveLength(7);
	});

	it("builds one for a document without a PDF", async () => {
		fileSystem.seed(`${DIR}/d/p1.jpg`, 2);
		await namedPdf({ id: "d", name: "Receipt", pages: ["p1.jpg"] });
		expect(pdf).toHaveBeenCalledWith([expect.any(Uint8Array)], "Receipt");
		expect(fileSystem.has("file:///cache/share/d/Receipt.pdf")).toBe(true);
	});
});

describe("exportDocument", () => {
	it("writes the PDF into the picked folder", async () => {
		fileSystem.seed(`${DIR}/d/document.pdf`, 7);
		await exportDocument({
			id: "d",
			name: "Lease",
			pages: ["p1.jpg"],
			pdf: "document.pdf",
		});
		expect(pickDirectory).toHaveBeenCalled();
		expect(fileSystem.read("content://picked/Lease.pdf")).toHaveLength(7);
	});
});

describe("printDocument", () => {
	it("prints the named PDF", async () => {
		fileSystem.seed(`${DIR}/d/document.pdf`, 7);
		await printDocument({
			id: "d",
			name: "Lease",
			pages: [],
			pdf: "document.pdf",
		});
		expect(Print.printAsync).toHaveBeenCalledWith({
			uri: "file:///cache/share/d/Lease.pdf",
		});
	});
});
