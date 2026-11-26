import { Directory, File, Paths } from "expo-file-system";

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
