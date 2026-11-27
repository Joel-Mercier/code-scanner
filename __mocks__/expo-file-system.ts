/**
 * An in-memory `expo-file-system` (the parts the app uses). Jest picks it up
 * automatically; seed and inspect it through `fileSystem`.
 */

const files = new Map<string, Uint8Array>();
const directories = new Set<string>();

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
	async copy(target: File, options?: { overwrite?: boolean }) {
		const content = files.get(this.uri);
		if (!content) throw new Error(`No such file: ${this.uri}`);
		if (files.has(target.uri) && !options?.overwrite) {
			throw new Error(`Already exists: ${target.uri}`);
		}
		files.set(target.uri, content);
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
	createFile(name: string, _mimeType: string | null) {
		return new File(this, name);
	}
	static pickDirectoryAsync = jest.fn(
		async () => new Directory("content://picked"),
	);
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
	read: (uri: string) => files.get(uri),
	list: () => [...files.keys()].sort(),
	reset() {
		files.clear();
		directories.clear();
		Directory.pickDirectoryAsync.mockClear();
	},
};
