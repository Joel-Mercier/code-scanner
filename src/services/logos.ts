import { Directory, File, Paths } from "expo-file-system";

const logosDirectory = () => new Directory(Paths.document, "logos");

/** Where a logo of this name lives. */
export const logoFile = (name: string) => new File(logosDirectory(), name);

/** Restores a logo from a backup. */
export const writeLogo = async (name: string, bytes: Uint8Array) => {
	logosDirectory().create({ intermediates: true, idempotent: true });
	await logoFile(name).write(bytes);
};

/** A logo's bytes, or `null` when the file is gone. */
export const readLogo = async (uri: string) => {
	const file = new File(uri);
	return file.exists ? file.bytes() : null;
};

/** Copies a picked logo image out of the cache so created codes keep their logo. */
export const persistLogo = async (uri: string) => {
	const directory = logosDirectory();
	directory.create({ intermediates: true, idempotent: true });
	const source = new File(uri);
	const extension = source.extension.replace(".", "") || "jpg";
	const target = new File(directory, `${Date.now().toString(36)}.${extension}`);
	await source.copy(target);
	return target.uri;
};
