import { Share as NativeShare } from "react-native";
import Share from "react-native-share";
import type { DocItem, LibraryItem } from "@/domain/library/types";
import { namedPdf } from "./documents";

/** Shares text through the system share sheet. */
export const shareText = async (message: string) => {
	await NativeShare.share({ message });
};

/** Shares a file (an image or a PDF) through the system share sheet. */
export const shareFile = async (url: string, type: string) => {
	await Share.open({ url, type, failOnCancel: false });
};

/** Docs share their PDF (named after them); codes share their content as text. */
export const shareItem = async (item: LibraryItem) => {
	if (item.kind === "doc") {
		await shareFile(await namedPdf(item), "application/pdf");
	} else {
		await shareText(item.data);
	}
};

/**
 * Shares several items at once: the documents' PDFs, with the codes'
 * contents as the message (one per paragraph).
 */
export const shareItems = async (items: LibraryItem[]) => {
	if (items.length === 1) return shareItem(items[0]);
	const docs = items.filter((item): item is DocItem => item.kind === "doc");
	const text = items
		.flatMap((item) => (item.kind === "code" ? [item.data] : []))
		.join("\n\n");
	if (docs.length === 0) return shareText(text);
	const urls: string[] = [];
	for (const doc of docs) urls.push(await namedPdf(doc));
	await Share.open({
		urls,
		type: "application/pdf",
		...(text ? { message: text } : {}),
		failOnCancel: false,
	});
};
