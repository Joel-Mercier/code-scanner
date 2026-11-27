import { sortShared, toUri } from "./sharedFiles";

const file = (
	path: string,
	mimeType: string | null = null,
	fileName: string | null = null,
) => ({
	path,
	mimeType,
	fileName,
});

describe("sortShared", () => {
	it("tells photos, PDFs and the rest apart", () => {
		const sorted = sortShared([
			file("file:///a.jpg", "image/jpeg"),
			file("file:///b", "application/pdf", "Lease.pdf"),
			file("/var/c.HEIC"),
			file("file:///d.pdf"),
			file("file:///e.docx", "application/msword"),
			file(""),
		]);
		expect(sorted.images.map((f) => f.path)).toEqual([
			"file:///a.jpg",
			"/var/c.HEIC",
		]);
		expect(sorted.pdfs.map((f) => f.path)).toEqual([
			"file:///b",
			"file:///d.pdf",
		]);
		expect(sorted.unsupported.map((f) => f.path)).toEqual(["file:///e.docx"]);
	});
});

describe("toUri", () => {
	it("turns bare paths into file URIs", () => {
		expect(toUri("/private/var/a.jpg")).toBe("file:///private/var/a.jpg");
		expect(toUri("file:///a.jpg")).toBe("file:///a.jpg");
		expect(toUri("content://media/1")).toBe("content://media/1");
	});
});
