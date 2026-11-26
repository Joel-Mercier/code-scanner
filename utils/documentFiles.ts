import { Directory, File, Paths } from "expo-file-system";

const documentsRoot = () => new Directory(Paths.document, "documents");

const documentDirectory = (id: string) => new Directory(documentsRoot(), id);

/**
 * Scanner output lives in the cache directory, which the OS may purge at any
 * time. Copy the pages (and PDF) into the app's document directory.
 */
export const persistScan = async (
	id: string,
	scan: { pages: string[]; pdfUri?: string },
) => {
	const directory = documentDirectory(id);
	directory.create({ intermediates: true, idempotent: true });

	const pages: string[] = [];
	for (const [index, uri] of scan.pages.entries()) {
		const source = new File(uri);
		const extension = source.extension.replace(".", "") || "jpg";
		const target = new File(directory, `page-${index + 1}.${extension}`);
		await source.copy(target);
		pages.push(target.uri);
	}

	let pdfUri: string | undefined;
	if (scan.pdfUri) {
		const target = new File(directory, "document.pdf");
		await new File(scan.pdfUri).copy(target);
		pdfUri = target.uri;
	}

	const size = [...pages, ...(pdfUri ? [pdfUri] : [])].reduce(
		(total, uri) => total + (new File(uri).size ?? 0),
		0,
	);
	return { pages, pdfUri, size };
};

export const deleteDocumentFiles = (id: string) => {
	try {
		const directory = documentDirectory(id);
		if (directory.exists) directory.delete();
	} catch (error) {
		console.warn("Could not delete document files", error);
	}
};

/** Copies a picked logo image out of the cache so created codes keep their logo. */
export const persistLogo = async (uri: string) => {
	const directory = new Directory(Paths.document, "logos");
	directory.create({ intermediates: true, idempotent: true });
	const source = new File(uri);
	const extension = source.extension.replace(".", "") || "jpg";
	const target = new File(directory, `${Date.now().toString(36)}.${extension}`);
	await source.copy(target);
	return target.uri;
};

/** Lets the user pick a folder and writes the PDF (or first page) into it. */
export const exportDocument = async (doc: {
	name: string;
	pages: string[];
	pdfUri?: string;
}) => {
	const directory = await Directory.pickDirectoryAsync();
	const isPdf = !!doc.pdfUri;
	const source = new File(doc.pdfUri ?? doc.pages[0]);
	const target = directory.createFile(
		`${doc.name}.${isPdf ? "pdf" : "jpg"}`,
		isPdf ? "application/pdf" : "image/jpeg",
	);
	await target.write(await source.bytes());
};
