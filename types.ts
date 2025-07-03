import type { BarcodeScanningResult } from "expo-camera";
import type { AndroidBarcode } from "expo-camera/build/AndroidBarcode.types";

export type ScannerResult = BarcodeScanningResult & {
  extra?: AndroidBarcode & BarcodeApiOptions & { phoneNumber?: string, message?: string };
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
