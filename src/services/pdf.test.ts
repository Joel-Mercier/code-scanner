import { PDFDocument } from "pdf-lib";
import { buildPdf, pageSize } from "./pdf";

const fromBase64 = (base64: string) =>
	Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));

// 1×1 images, the smallest valid ones.
const PNG = fromBase64(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
);
const JPEG = fromBase64(
	"/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
);

describe("pageSize", () => {
	it("fits portrait images into an A4 sheet", () => {
		const size = pageSize(1240, 1754);
		expect(size.width).toBeCloseTo(595.2, 0);
		expect(size.height).toBeCloseTo(841.89, 1);
	});

	it("turns the sheet for landscape images", () => {
		const size = pageSize(2000, 1000);
		expect(size.width).toBeCloseTo(841.89, 1);
		expect(size.height).toBeCloseTo(420.9, 0);
	});

	it("keeps narrow receipts narrow", () => {
		const size = pageSize(400, 2000);
		expect(size.height).toBeCloseTo(841.89, 1);
		expect(size.width).toBeCloseTo(168.4, 0);
	});
});

describe("buildPdf", () => {
	it("makes one page per image, JPEG or PNG, with a title", async () => {
		const bytes = await buildPdf([JPEG, PNG, JPEG], "Lease");
		const pdf = await PDFDocument.load(bytes);
		expect(pdf.getPageCount()).toBe(3);
		expect(pdf.getTitle()).toBe("Lease");
		const [width, height] = [
			pdf.getPage(0).getWidth(),
			pdf.getPage(0).getHeight(),
		];
		expect(width).toBeCloseTo(595.28, 1);
		expect(height).toBeCloseTo(595.28, 1);
	});
});
