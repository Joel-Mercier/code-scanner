import type { BarcodeType } from "expo-camera";
import type { IconName } from "@/components/ui/Icon";
import i18n from "@/config/i18n";
import type { CodeItem } from "@/stores/library";
import { normalizeBarcodeType } from "@/utils/barcodeType";
import {
	describeCode,
	type ParsedCode,
	parseCode,
	type QRKind,
} from "@/utils/codePayload";

export type DisplayKind = QRKind | "barcode";

export const kindIcons: Record<DisplayKind | "doc", IconName> = {
	url: "link",
	text: "text",
	wifi: "wifi",
	email: "email",
	phone: "phone",
	sms: "sms",
	vcard: "contact",
	event: "calendar",
	geoPoint: "location",
	barcode: "barcode",
	doc: "document",
};

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

export const barcodeLabels: Partial<Record<BarcodeType, string>> = {
	aztec: "Aztec",
	codabar: "Codabar",
	code128: "Code 128",
	code39: "Code 39",
	code93: "Code 93",
	datamatrix: "Data Matrix",
	ean13: "EAN-13",
	ean8: "EAN-8",
	itf14: "ITF-14",
	pdf417: "PDF417",
	upc_a: "UPC-A",
	upc_e: "UPC-E",
	qr: "QR",
};

export type DescribedCode = {
	kind: DisplayKind;
	parsed: ParsedCode;
	title: string;
	subtitle: string;
};

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
