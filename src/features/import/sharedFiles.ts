/** A file another app shared with this one. */
export type SharedFile = {
	path: string;
	mimeType: string | null;
	fileName: string | null;
};

/** Paths arrive bare on some platforms ("/private/var/…"): make them URIs. */
export const toUri = (path: string) =>
	path.startsWith("/") ? `file://${path}` : path;

const isPdf = (file: SharedFile) =>
	file.mimeType === "application/pdf" ||
	/\.pdf$/i.test(file.fileName ?? file.path);

const isImage = (file: SharedFile) =>
	!isPdf(file) &&
	(file.mimeType?.startsWith("image/") ||
		/\.(jpe?g|png|heic|heif|webp|gif|bmp)$/i.test(file.fileName ?? file.path));

/**
 * Sorts shared files into what the app can take: images (scanned for codes
 * or saved as one document) and PDFs (one document each). The rest is left.
 */
export const sortShared = (files: SharedFile[]) => {
	const usable = files.filter((file) => !!file.path);
	return {
		images: usable.filter(isImage),
		pdfs: usable.filter(isPdf),
		unsupported: usable.filter((file) => !isImage(file) && !isPdf(file)),
	};
};
