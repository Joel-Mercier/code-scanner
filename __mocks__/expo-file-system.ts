/**
 * An in-memory `expo-file-system` (the parts the app uses). Jest picks it up
 * automatically; seed and inspect it through `fileSystem`.
 */

const files = new Map<string, Uint8Array>();
const directories = new Set<string>();
/** Copies to these URIs fail (a full or unplugged drive). */
const failingCopies = new Set<string>();

const join = (parent: string, name: string) =>
	`${parent.replace(/\/+$/, "")}/${name}`;
const uriOf = (...parts: (string | { uri: string })[]) =>
	parts
		.map((part) => (typeof part === "string" ? part : part.uri))
		.reduce((uri, name) => join(uri, name));

export class File {
	uri: string;
	constructor(...parts: (string | { uri: string })[]) {
		this.uri = uriOf(...parts);
	}
	get name() {
		return this.uri.split("/").pop() ?? "";
	}
	/** With the dot, like the real thing (".jpg"), or "" without one. */
	get extension() {
		const match = this.name.match(/\.[^.]+$/);
		return match ? match[0] : "";
	}
	get exists() {
		return files.has(this.uri);
	}
	get size() {
		return files.get(this.uri)?.byteLength ?? null;
	}
	/** Into a `File`, or into a `Directory` under the same name. */
	async copy(target: File | Directory, options?: { overwrite?: boolean }) {
		const content = files.get(this.uri);
		if (!content) throw new Error(`No such file: ${this.uri}`);
		const uri =
			target instanceof Directory ? join(target.uri, this.name) : target.uri;
		if (failingCopies.has(uri)) throw new Error(`Copy failed: ${uri}`);
		if (files.has(uri) && !options?.overwrite) {
			throw new Error(`Already exists: ${uri}`);
		}
		files.set(uri, content);
	}
	delete() {
		if (!files.delete(this.uri)) throw new Error(`No such file: ${this.uri}`);
	}
	async bytes() {
		const content = files.get(this.uri);
		if (!content) throw new Error(`No such file: ${this.uri}`);
		return content;
	}
	async write(content: Uint8Array | string) {
		files.set(
			this.uri,
			typeof content === "string" ? new TextEncoder().encode(content) : content,
		);
	}
}

export class Directory {
	uri: string;
	constructor(...parts: (string | { uri: string })[]) {
		this.uri = uriOf(...parts);
	}
	get exists() {
		return directories.has(this.uri);
	}
	create(_options?: { intermediates?: boolean; idempotent?: boolean }) {
		directories.add(this.uri);
	}
	delete() {
		directories.delete(this.uri);
		for (const uri of [...files.keys()]) {
			if (uri.startsWith(`${this.uri}/`)) files.delete(uri);
		}
	}
	/** Creates an empty file in it (throws when the folder is gone). */
	createFile(name: string, _mimeType: string | null) {
		if (!this.exists) throw new Error(`No such directory: ${this.uri}`);
		const file = new File(this, name);
		files.set(file.uri, new Uint8Array());
		return file;
	}
	/** The files right inside it. */
	list() {
		const prefix = `${this.uri}/`;
		return [...files.keys()]
			.filter(
				(uri) =>
					uri.startsWith(prefix) && !uri.slice(prefix.length).includes("/"),
			)
			.sort()
			.map((uri) => new File(uri));
	}
	/** A picked folder exists, like the real one. */
	static pickDirectoryAsync = jest.fn(async () => {
		const picked = new Directory("content://picked");
		directories.add(picked.uri);
		return picked;
	});
}

export const Paths = {
	document: new Directory("file:///document"),
	cache: new Directory("file:///cache"),
};

export const fileSystem = {
	/** Creates a file with `size` bytes of content, or the given bytes. */
	seed(uri: string, content: number | Uint8Array = 1) {
		files.set(
			uri,
			typeof content === "number" ? new Uint8Array(content) : content,
		);
	},
	has: (uri: string) => files.has(uri),
	/** Makes a directory exist (a picked folder, say). */
	mkdir: (uri: string) => directories.add(uri),
	/** Makes copies to `uri` fail. */
	failCopiesTo: (uri: string) => failingCopies.add(uri),
	read: (uri: string) => files.get(uri),
	list: () => [...files.keys()].sort(),
	reset() {
		files.clear();
		directories.clear();
		failingCopies.clear();
		Directory.pickDirectoryAsync.mockClear();
	},
};
