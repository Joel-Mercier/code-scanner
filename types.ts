import type { BarcodeScanningResult } from "expo-camera";

export type ScannerResult = Omit<BarcodeScanningResult, "extra"> & {
	extra?: Record<string, string>;
	createdAt: Date;
	source: "scanner" | "form";
};

export type CodeType =
	| "url"
	| "text"
	| "wifi"
	| "email"
	| "phone"
	| "sms"
	| "vcard"
	| "geoPoint"
	| "crypto"
	| "event";
export type EncryptionType = "WPA" | "WEP" | undefined;
export type CryptoType = "bitcoin" | "ethereum" | "litecoin";

export type BarcodeApiOptions = {
	fg?: string;
	bg?: string;
	module?: number;
	qz?: number;
	pattern?: string;
	dpi?: number;
	height?: number;
	text?: "bottom" | "top";
	font?: number;
};
