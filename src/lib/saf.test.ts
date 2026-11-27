import {
	entryName,
	folderLabel,
	isRestrictedTreeUri,
	isSupportedTreeUri,
} from "./saf";

const tree = (path: string) =>
	`content://com.android.externalstorage.documents/tree/${encodeURIComponent(`primary:${path}`)}`;

describe("SAF folders", () => {
	it("refuses the trees Android won't let apps write into", () => {
		expect(isRestrictedTreeUri(tree("Download"))).toBe(true);
		expect(isRestrictedTreeUri(tree("Android/data"))).toBe(true);
		expect(isRestrictedTreeUri(tree("Android/obb/x"))).toBe(true);
		expect(isRestrictedTreeUri(tree("Download/Backups"))).toBe(false);
		expect(isRestrictedTreeUri(tree("Documents"))).toBe(false);
	});

	it("only takes the phone's own storage", () => {
		expect(isSupportedTreeUri(tree("Documents"))).toBe(true);
		expect(
			isSupportedTreeUri(
				"content://com.google.android.apps.docs.storage/tree/abc",
			),
		).toBe(false);
	});

	it("names folders and files from their URIs", () => {
		expect(folderLabel(tree("Documents/Backups"))).toBe("Documents/Backups");
		expect(folderLabel("file:///data/backups")).toBe("/data/backups");
		const file = `${tree("Backups")}/document/${encodeURIComponent("primary:Backups/a.zip")}`;
		expect(entryName(file)).toBe("a.zip");
	});
});
