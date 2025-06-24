import type { BarcodeType } from "expo-camera";

export type BarcodeApiOptions = {
  fg?: string;
  bg?: string;
  width?: string;
  height?: string;
  text?: "bottom" | "top";
  font?: string;
};

export const generateBarcode = async (
  value: string,
  type: BarcodeType,
  options?: BarcodeApiOptions,
): Promise<string | undefined> => {
  try {
    const codeType = mapTypeToPath(type);
    const query = new URLSearchParams(options).toString();
    console.log("DEBUG : Fetching barcode ", `https://barcodeapi.org/api/${codeType}/${encodeURI(value)}${query ? `?${query}` : ''}`);
    const response = await fetch(`https://barcodeapi.org/api/${codeType}/${encodeURI(value)}${query ? `?${query}` : ''}`, {
      method: "GET",
    });
    const blob = await response.blob();
    const pngBlob = new Blob([blob], { type: "image/png" });
    const dataUrl = await blobToDataURL(pngBlob);
    return dataUrl;
  } catch (error) {
    console.error("Error generating barcode", error);
  }
};

const mapTypeToPath = (type: BarcodeType) => {
  switch (type) {
    case "aztec":
      return "aztec";
    case "codabar":
      return "codabar";
    case "code128":
      return "128";
    case "code39":
      return "39";
    case "datamatrix":
      return "dm";
    case "ean13":
      return "13";
    case "ean8":
      return "8";
    case "itf14":
      return "14";
    case "pdf417":
      return "417";
    case "qr":
      return "qr";
    case "upc_a":
      return "a";
    case "upc_e":
      return "e";
    default:
      return "qr";
  }
};

const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
