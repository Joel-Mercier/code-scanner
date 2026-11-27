import { PDFDocument } from "pdf-lib";

/** An A4 sheet, in PDF points. */
const A4 = { long: 841.89, short: 595.28 };

const isPng = (bytes: Uint8Array) =>
	bytes[0] === 0x89 &&
	bytes[1] === 0x50 &&
	bytes[2] === 0x4e &&
	bytes[3] === 0x47;

/**
 * A page's size in points: the image's proportions, fitted into an A4 sheet
 * turned the same way (portrait or landscape).
 */
export const pageSize = (width: number, height: number) => {
	const landscape = width > height;
	const box = landscape
		? { width: A4.long, height: A4.short }
		: { width: A4.short, height: A4.long };
	const scale = Math.min(box.width / width, box.height / height);
	return { width: width * scale, height: height * scale };
};

/**
 * Builds a PDF with one page per image (JPEG or PNG), in order. JPEGs go in
 * as they are, without re-encoding.
 */
export const buildPdf = async (images: Uint8Array[], title?: string) => {
	const pdf = await PDFDocument.create();
	if (title) pdf.setTitle(title);
	pdf.setCreator("Code Scanner");
	pdf.setProducer("Code Scanner");
	for (const bytes of images) {
		const image = isPng(bytes)
			? await pdf.embedPng(bytes)
			: await pdf.embedJpg(bytes);
		const size = pageSize(image.width, image.height);
		const page = pdf.addPage([size.width, size.height]);
		page.drawImage(image, { x: 0, y: 0, ...size });
	}
	return pdf.save();
};
