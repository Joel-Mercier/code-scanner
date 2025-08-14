import type { BarcodeScanningResult } from "expo-camera";

export const getQRCodeSubType = (scannerResult: BarcodeScanningResult & { extra?: Record<string, string> }) => {
  if (
    scannerResult.extra?.type === "url" &&
    scannerResult.raw?.startsWith("mailto:")
  ) {
    return "email";
  }
  if (
    scannerResult.extra?.type === "url" &&
    scannerResult.raw?.startsWith("sms:")
  ) {
    return "sms";
  }
  if (scannerResult.extra?.ssid) {
    return "wifi";
  }
  return scannerResult.extra?.type;
};
