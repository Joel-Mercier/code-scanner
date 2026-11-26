import { Share as NativeShare } from "react-native";
import Share from "react-native-share";
import type { LibraryItem } from "@/domain/library/types";

/** Shares text through the system share sheet. */
export const shareText = async (message: string) => {
	await NativeShare.share({ message });
};

/** Shares a file (an image or a PDF) through the system share sheet. */
export const shareFile = async (url: string, type: string) => {
	await Share.open({ url, type, failOnCancel: false });
};

/** Docs share their file; codes share their decoded content as text. */
export const shareItem = async (item: LibraryItem) => {
	if (item.kind === "doc") {
		await shareFile(
			item.pdfUri ?? item.pages[0],
			item.pdfUri ? "application/pdf" : "image/jpeg",
		);
	} else {
		await shareText(item.data);
	}
};
