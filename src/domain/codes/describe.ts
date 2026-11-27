import type { CodeItem } from "@/domain/library/types";
import i18n from "@/i18n";
import { type BarcodeInfo, classifyBarcode } from "./barcode";
import { barcodeLabels, normalizeBarcodeType } from "./formats";
import {
	describeCode,
	type ParsedCode,
	type PayloadKind,
	parseCode,
	type QRKind,
	type ScanOnlyKind,
} from "./payload";

/** What a code holds, as shown to the user: a payload kind, or "barcode". */
export type DisplayKind = PayloadKind | "barcode";

/** QR payload kinds, in the order the workshop offers them. */
export const qrKinds: QRKind[] = [
	"url",
	"text",
	"wifi",
	"email",
	"phone",
	"sms",
	"vcard",
	"event",
	"geoPoint",
];

/** Kinds that only come from scans, after the ones the workshop offers. */
export const scanOnlyKinds: ScanOnlyKind[] = [
	"otp",
	"payment",
	"boardingPass",
	"frenchDoc",
	"app",
];

export type DescribedCode = {
	kind: DisplayKind;
	parsed: ParsedCode;
	/** What the number means, for barcodes and plain-text codes. */
	barcode?: BarcodeInfo;
	title: string;
	/** The payload kind ("Wi-Fi") or the barcode format ("EAN-13"). */
	subtitle: string;
};

/** 2D symbologies carry payloads like QR codes (links, Wi-Fi, tickets…). */
const PAYLOAD_FORMATS = new Set<string>([
	"qr",
	"aztec",
	"datamatrix",
	"pdf417",
]);

/** Parses a saved code into what the UI shows about it. */
export const describeItem = (item: CodeItem): DescribedCode => {
	const data = String(item.data ?? "");
	const format = normalizeBarcodeType(item.format);
	const createdAt = new Date(item.createdAt);
	const parsed: ParsedCode = PAYLOAD_FORMATS.has(format)
		? parseCode(data, createdAt)
		: { kind: "text", text: data };
	const barcode =
		parsed.kind === "text"
			? classifyBarcode(format, data, createdAt)
			: undefined;
	if (format !== "qr" && parsed.kind === "text") {
		return {
			kind: "barcode",
			parsed,
			barcode,
			title: item.name || data,
			subtitle: barcodeLabels[format] ?? String(format),
		};
	}
	return {
		kind: parsed.kind,
		parsed,
		barcode,
		title: item.name || describeCode(parsed) || data,
		subtitle:
			format === "qr"
				? i18n.t(`app.kinds.${parsed.kind}`)
				: `${barcodeLabels[format] ?? format} · ${i18n.t(`app.kinds.${parsed.kind}`)}`,
	};
};
