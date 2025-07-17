import i18n from "@/config/i18n";
import type { CodeType, EncryptionType } from "@/types";
import type { BarcodeType } from "expo-camera";
import type { QRCodeErrorCorrectionLevel } from "qrcode";

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
    value: "event",
    label: i18n.t("app.new_code.qr_code_form.type.options.event"),
  },
  {
    value: "geoPoint",
    label: i18n.t("app.new_code.qr_code_form.type.options.geo_point"),
  },
  // {
  // 	value: "crypto",
  // 	label: i18n.t("app.new_code.qr_code_form.type.options.crypto"),
  // },
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

export const encryptions: { value: EncryptionType; label: string }[] = [
  {
    value: undefined,
    label: i18n.t("app.new_code.qr_code_form.encryption.options.none"),
  },
  {
    value: "WPA",
    label: i18n.t("app.new_code.qr_code_form.encryption.options.wpa"),
  },
  {
    value: "WEP",
    label: i18n.t("app.new_code.qr_code_form.encryption.options.wep"),
  },
];

export const errorCorrectionLevels: {
  value: QRCodeErrorCorrectionLevel;
  label: string;
}[] = [
    {
      value: "L",
      label: i18n.t("app.new_code.qr_code_form.error_correction_level.options.l"),
    },
    {
      value: "M",
      label: i18n.t("app.new_code.qr_code_form.error_correction_level.options.m"),
    },
    {
      value: "Q",
      label: i18n.t("app.new_code.qr_code_form.error_correction_level.options.q"),
    },
    {
      value: "H",
      label: i18n.t("app.new_code.qr_code_form.error_correction_level.options.h"),
    },
  ];

export const scannerResultTypeToEncryption: { value: string; label: string }[] =
  [
    {
      value: "1",
      label: i18n.t("app.new_code.qr_code_form.encryption.options.none"),
    },
    {
      value: "2",
      label: i18n.t("app.new_code.qr_code_form.encryption.options.wpa"),
    },
    {
      value: "3",
      label: i18n.t("app.new_code.qr_code_form.encryption.options.wep"),
    },
  ];

export const textOptions: { value: string; label: string }[] = [
  {
    value: "bottom",
    label: i18n.t("app.new_code.barcode_form.text.options.bottom"),
  },
  { value: "top", label: i18n.t("app.new_code.barcode_form.text.options.top") },
];
