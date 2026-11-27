import { toast } from "@/components/ui/Toast";
import {
	addMissingPdf,
	applyPageEdits,
	createDocumentFromPhotos,
	exportDocument,
	mergeDocumentFiles,
} from "@/services/documents";
import { readPage } from "@/services/recognition";
import useLibrary from "@/stores/library";
import { makeDoc } from "@/test/fixtures";
import {
	importPhotos,
	mergeDocuments,
	prepareDocument,
	saveDocumentToFiles,
	savePageEdits,
} from "./actions";

jest.mock("@/services/documents", () => ({
	addMissingPdf: jest.fn(),
	applyPageEdits: jest.fn(),
	createDocumentFromPdf: jest.fn(),
	createDocumentFromPhotos: jest.fn(),
	deleteDocumentFiles: jest.fn(),
	exportDocument: jest.fn(),
	mergeDocumentFiles: jest.fn(),
	pageUri: (doc: { id: string }, page: string) => `file:///${doc.id}/${page}`,
	pageUris: jest.fn(() => []),
	printDocument: jest.fn(),
}));
jest.mock("@/services/recognition", () => ({ readPage: jest.fn() }));
jest.mock("@/services/share", () => ({ shareItem: jest.fn() }));
jest.mock("@/services/gallery", () => ({ saveImagesToGallery: jest.fn() }));
jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn() }));
jest.mock("@/components/ui/Toast", () => ({ toast: jest.fn() }));

const library = () => useLibrary.getState();
const reading = (text: string) => ({ text, codes: [] });
const files = { pages: ["p1.jpg"], pdf: "document.pdf", size: 3 };

beforeEach(() => {
	useLibrary.setState({ items: {}, folders: {}, nextSeq: 1 });
	jest.clearAllMocks();
	jest.spyOn(console, "error").mockImplementation(() => {});
});

describe("saveDocumentToFiles", () => {
	it("exports the document and confirms", async () => {
		const doc = makeDoc();
		await saveDocumentToFiles(doc);
		expect(exportDocument).toHaveBeenCalledWith(doc);
		expect(toast).toHaveBeenCalledTimes(1);
	});

	it("stays quiet when the user cancels the folder picker", async () => {
		jest.mocked(exportDocument).mockRejectedValue(new Error("cancelled"));
		await saveDocumentToFiles(makeDoc());
		expect(toast).not.toHaveBeenCalled();
	});
});

describe("prepareDocument", () => {
	it("adds a missing PDF and reads the unread pages", async () => {
		library().addDocument({
			id: "d",
			name: "Old",
			pages: ["a.jpg", "b.jpg"],
			size: 2,
			readings: { "a.jpg": reading("known") },
		});
		jest.mocked(addMissingPdf).mockResolvedValue({
			pages: ["a.jpg", "b.jpg"],
			pdf: "document.pdf",
			size: 5,
		});
		jest.mocked(readPage).mockResolvedValue(reading("new"));

		await prepareDocument("d");

		expect(readPage).toHaveBeenCalledTimes(1);
		expect(readPage).toHaveBeenCalledWith("file:///d/b.jpg");
		expect(library().items.d).toMatchObject({
			pdf: "document.pdf",
			size: 5,
			readings: { "a.jpg": reading("known"), "b.jpg": reading("new") },
		});
	});

	it("stops at a page that can't be read, to try again later", async () => {
		library().addDocument({
			id: "d",
			name: "D",
			pages: ["a", "b"],
			size: 1,
			pdf: "x.pdf",
		});
		jest.mocked(readPage).mockRejectedValue(new Error("model not ready"));
		await prepareDocument("d");
		expect(readPage).toHaveBeenCalledTimes(1);
		expect(addMissingPdf).not.toHaveBeenCalled();
		expect(library().items.d).not.toHaveProperty("readings");
	});

	it("doesn't read the same document twice at once", async () => {
		library().addDocument({
			id: "d",
			name: "D",
			pages: ["a"],
			size: 1,
			pdf: "x.pdf",
		});
		jest.mocked(readPage).mockResolvedValue(reading("text"));
		await Promise.all([prepareDocument("d"), prepareDocument("d")]);
		expect(readPage).toHaveBeenCalledTimes(1);
	});

	it("ignores unknown documents", async () => {
		await expect(prepareDocument("missing")).resolves.toBeUndefined();
	});
});

describe("importPhotos", () => {
	it("saves the photos as a document and starts reading it", async () => {
		jest
			.mocked(createDocumentFromPhotos)
			.mockResolvedValue({ id: "new", files });
		jest.mocked(readPage).mockResolvedValue(reading("photo"));
		await expect(importPhotos(["file:///a.jpg"], "Receipts")).resolves.toBe(
			"new",
		);
		expect(library().items.new).toMatchObject({
			kind: "doc",
			name: "Receipts",
			...files,
		});
	});

	it("says so when it fails", async () => {
		jest
			.mocked(createDocumentFromPhotos)
			.mockRejectedValue(new Error("disk full"));
		await expect(importPhotos(["file:///a.jpg"])).resolves.toBeNull();
		expect(toast).toHaveBeenCalledWith(expect.any(String), "warning");
		expect(library().items).toEqual({});
	});

	it("does nothing without photos", async () => {
		await expect(importPhotos([])).resolves.toBeNull();
		expect(createDocumentFromPhotos).not.toHaveBeenCalled();
	});
});

describe("savePageEdits", () => {
	it("applies the edits to the document", async () => {
		const doc = library().addDocument({
			id: "d",
			name: "D",
			pages: ["old"],
			size: 1,
		});
		jest.mocked(applyPageEdits).mockResolvedValue(files);
		const edits = [{ uri: "file:///x", rotation: 0 }];
		await expect(savePageEdits(doc, edits)).resolves.toBe(true);
		expect(applyPageEdits).toHaveBeenCalledWith(doc, edits);
		expect(library().items.d).toMatchObject(files);
	});

	it("keeps the document as it was when saving fails", async () => {
		const doc = library().addDocument({
			id: "d",
			name: "D",
			pages: ["old"],
			size: 1,
		});
		jest.mocked(applyPageEdits).mockRejectedValue(new Error("no"));
		await expect(savePageEdits(doc, [])).resolves.toBe(false);
		expect(library().items.d).toMatchObject({ pages: ["old"] });
	});
});

describe("mergeDocuments", () => {
	it("merges oldest first into the first one's folder", async () => {
		const newer = makeDoc({
			id: "b",
			name: "Page 2",
			createdAt: 20,
			folderId: "x",
		});
		const older = makeDoc({
			id: "a",
			name: "Lease",
			createdAt: 10,
			folderId: "f",
		});
		jest
			.mocked(mergeDocumentFiles)
			.mockResolvedValue({ id: "m", files, readings: {} });
		await expect(mergeDocuments([newer, older])).resolves.toBe("m");
		expect(mergeDocumentFiles).toHaveBeenCalledWith([older, newer]);
		expect(library().items.m).toMatchObject({
			name: "Lease (merged)",
			folderId: "f",
			...files,
		});
	});
});
