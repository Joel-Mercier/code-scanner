import i18n from "@/config/i18n";
import type { CodeType } from "@/types";
import type { BarcodeType } from "expo-camera";

export const QRCodeTypes: { value: CodeType; label: string }[] = [
  { value: "url", label: i18n.t("app.new_code.qr_code_form.type.options.url") },
  {
    value: "text",
    label: i18n.t("app.new_code.qr_code_form.type.options.text"),
  },
  {
    value: "wifi",
    label: i18n.t("app.new_code.qr_code_form.type.options.wifi"),
  },
  {
    value: "email",
    label: i18n.t("app.new_code.qr_code_form.type.options.email"),
  },
  {
    value: "phone",
    label: i18n.t("app.new_code.qr_code_form.type.options.phone"),
  },
  { value: "sms", label: i18n.t("app.new_code.qr_code_form.type.options.sms") },
  {
    value: "vcard",
    label: i18n.t("app.new_code.qr_code_form.type.options.vcard"),
  },
  {
    value: "geoPoint",
    label: i18n.t("app.new_code.qr_code_form.type.options.geo_point"),
  },
  {
    value: "crypto",
    label: i18n.t("app.new_code.qr_code_form.type.options.crypto"),
  },
];

export const barcodeTypes: { value: BarcodeType; label: string }[] = [
  { value: "aztec", label: "Aztec" },
  { value: "codabar", label: "Codabar" },
  { value: "code128", label: "Code 128" },
  { value: "code39", label: "Code 39" },
  { value: "datamatrix", label: "Datamatrix" },
  { value: "ean13", label: "EAN 13" },
  { value: "ean8", label: "EAN 8" },
  { value: "itf14", label: "ITF-14" },
  { value: "pdf417", label: "PDF417" },
  { value: "upc_a", label: "UPC A" },
  { value: "upc_e", label: "UPC E" },
];
