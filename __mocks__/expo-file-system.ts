/**
 * An in-memory `expo-file-system` (the parts the app uses). Jest picks it up
 * automatically; seed and inspect it through `fileSystem`.
 */

const files = new Map<string, Uint8Array>();
const directories = new Set<string>();

const join = (parent: string, name: string) =>
	`${parent.replace(/\/+$/, "")}/${name}`;
const uriOf = (base: string | { uri: string }, name?: string) => {
	const uri = typeof base === "string" ? base : base.uri;
	return name ? join(uri, name) : uri;
};

export class File {
	uri: string;
	constructor(base: string | { uri: string }, name?: string) {
		this.uri = uriOf(base, name);
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
	async copy(target: File) {
		const content = files.get(this.uri);
		if (!content) throw new Error(`No such file: ${this.uri}`);
		files.set(target.uri, content);
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
	constructor(base: string | { uri: string }, name?: string) {
		this.uri = uriOf(base, name);
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
	/** Creates a file with `size` bytes of content. */
	seed(uri: string, size = 1) {
		files.set(uri, new Uint8Array(size));
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
