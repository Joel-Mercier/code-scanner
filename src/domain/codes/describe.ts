import type { CodeItem } from "@/domain/library/types";
import i18n from "@/i18n";
import { barcodeLabels, normalizeBarcodeType } from "./formats";
import {
	describeCode,
	type ParsedCode,
	parseCode,
	type QRKind,
} from "./payload";

/** What a code holds, as shown to the user: a QR payload kind, or "barcode". */
export type DisplayKind = QRKind | "barcode";

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

export type DescribedCode = {
	kind: DisplayKind;
	parsed: ParsedCode;
	title: string;
	/** The payload kind ("Wi-Fi") or the barcode format ("EAN-13"). */
	subtitle: string;
};

/** Parses a saved code into what the UI shows about it. */
export const describeItem = (item: CodeItem): DescribedCode => {
	const data = String(item.data ?? "");
	const format = normalizeBarcodeType(item.format);
	if (format !== "qr") {
		return {
			kind: "barcode",
			parsed: { kind: "text", text: data },
			title: item.name || data,
			subtitle: barcodeLabels[format] ?? String(format),
		};
	}
	const parsed = parseCode(data);
	return {
		kind: parsed.kind,
		parsed,
		title: item.name || describeCode(parsed) || data,
		subtitle: i18n.t(`app.kinds.${parsed.kind}`),
	};
};
