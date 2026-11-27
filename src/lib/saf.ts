/**
 * Android's Storage Access Framework, as strings: what a folder picked with
 * `Directory.pickDirectoryAsync()` looks like, and what can be read from its
 * URI without asking the system.
 */

// Trees Android hands back but won't let us write into on API 30+: the
// Download/ root and the app-data sandboxes.
const RESTRICTED_TREES = [
	/%3A(Android%2F)?(data|obb)(%2F|$)/i,
	/%3ADownload(%2F)?$/i,
];

/** The only provider whose document ids are paths, so whose names can be read. */
const SUPPORTED_AUTHORITY = "com.android.externalstorage.documents";

export const isRestrictedTreeUri = (uri: string) =>
	RESTRICTED_TREES.some((pattern) => pattern.test(uri));

/**
 * Folders on the phone's own storage (or an SD card). Cloud providers hand
 * back opaque ids, so old backups couldn't be told apart to clean them up.
 */
export const isSupportedTreeUri = (uri: string) =>
	uri.startsWith(`content://${SUPPORTED_AUTHORITY}/`);

/** The file name at the end of a document URI (decoded). */
export const entryName = (uri: string) => {
	let decoded = uri;
	try {
		decoded = decodeURIComponent(uri);
	} catch {}
	const trimmed = decoded.replace(/\/+$/, "");
	return trimmed.slice(trimmed.lastIndexOf("/") + 1);
};

/** "Documents/Backups" for a tree URI: what to show for the folder. */
export const folderLabel = (uri: string) => {
	if (!uri.startsWith("content://")) return uri.replace(/^file:\/\//, "");
	try {
		const tree = uri.indexOf("/tree/");
		const decoded = decodeURIComponent(
			tree >= 0 ? uri.slice(tree + "/tree/".length) : uri,
		);
		const colon = decoded.lastIndexOf(":");
		return (colon >= 0 ? decoded.slice(colon + 1) : decoded) || decoded;
	} catch {
		return uri;
	}
};
