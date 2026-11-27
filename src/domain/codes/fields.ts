/** Low-level readers shared by the payload parsers. */

export const decode = (value: string) => {
	try {
		return decodeURIComponent(value.replace(/\+/g, " "));
	} catch {
		return value;
	}
};

export const queryParams = (query: string) => {
	const params: Record<string, string> = {};
	for (const pair of query.split("&")) {
		const [key, ...rest] = pair.split("=");
		if (key) params[key.toLowerCase()] = decode(rest.join("="));
	}
	return params;
};

/** Splits on the `separator`s that aren't escaped, keeping the escapes. */
export const splitUnescaped = (value: string, separator: string) => {
	const parts: string[] = [];
	let current = "";
	for (let i = 0; i < value.length; i++) {
		const char = value[i];
		if (char === "\\" && i + 1 < value.length) {
			current += char + value[i + 1];
			i++;
		} else if (char === separator) {
			parts.push(current);
			current = "";
		} else {
			current += char;
		}
	}
	parts.push(current);
	return parts;
};

/** Undoes the `\;`, `\,`, `\:`, `\"` and `\\` escapes of Wi-Fi / MECARD / MATMSG. */
const unescapeField = (value: string) => value.replace(/\\([\\;,:"])/g, "$1");

/** Parses `KEY:value;KEY:value` payloads (Wi-Fi, MECARD, MATMSG, BIZCARD). */
export const semicolonFields = (body: string) => {
	const raw: Record<string, string[]> = {};
	for (const field of splitUnescaped(body, ";")) {
		const index = field.indexOf(":");
		if (index > 0) {
			const key = field.slice(0, index).toUpperCase();
			raw[key] = [...(raw[key] ?? []), field.slice(index + 1)];
		}
	}
	return {
		/** The first value, unescaped. */
		text: (key: string) =>
			raw[key] === undefined ? undefined : unescapeField(raw[key][0]),
		/** Every non-empty value of a repeated key, unescaped. */
		all: (key: string) =>
			(raw[key] ?? []).map(unescapeField).filter((value) => value.trim()),
		/**
		 * The comma-separated parts of a value (MECARD's `N:last,first`). Split
		 * before unescaping, so an escaped `\,` stays inside its part.
		 */
		parts: (key: string) =>
			raw[key] === undefined
				? []
				: splitUnescaped(raw[key][0], ",").map(unescapeField),
	};
};

/** Reads UTF-8 bytes; `undefined` when they aren't valid UTF-8. */
export const decodeUtf8 = (bytes: number[]) => {
	let out = "";
	for (let i = 0; i < bytes.length; ) {
		const byte = bytes[i++];
		if (byte < 0x80) {
			out += String.fromCharCode(byte);
			continue;
		}
		const extra =
			byte >= 0xf0 && byte < 0xf8
				? 3
				: byte >= 0xe0 && byte < 0xf0
					? 2
					: byte >= 0xc0 && byte < 0xe0
						? 1
						: -1;
		if (extra < 0) return undefined;
		let codePoint = byte & (0x3f >> extra);
		for (let k = 0; k < extra; k++) {
			const next = bytes[i++];
			if (next === undefined || (next & 0xc0) !== 0x80) return undefined;
			codePoint = (codePoint << 6) | (next & 0x3f);
		}
		out += String.fromCodePoint(codePoint);
	}
	return out;
};

/** Decodes a quoted-printable value (vCard 2.1), as UTF-8 unless told otherwise. */
export const decodeQuotedPrintable = (value: string, charset = "UTF-8") => {
	const bytes: number[] = [];
	const text = value.replace(/=\r?\n/g, "");
	for (let i = 0; i < text.length; i++) {
		const hex = text.slice(i + 1, i + 3);
		if (text[i] === "=" && /^[0-9A-Fa-f]{2}$/.test(hex)) {
			bytes.push(Number.parseInt(hex, 16));
			i += 2;
		} else {
			bytes.push(text.charCodeAt(i) & 0xff);
		}
	}
	const latin1 = () => String.fromCharCode(...bytes);
	return /^utf-?8$/i.test(charset) ? (decodeUtf8(bytes) ?? latin1()) : latin1();
};

/** Undoes vCard / iCalendar text escapes: `\n`, `\\`, `\;`, `\,`. */
export const unescapeText = (value: string) =>
	value.replace(/\\([nN\\;,])/g, (_, char: string) =>
		char === "n" || char === "N" ? "\n" : char,
	);

type Line = { value: string; params: Record<string, string> };

/**
 * Parses `KEY;PARAMS:value` lines of vCard / iCalendar payloads, keeping
 * every value of a repeated key and decoding vCard 2.1 quoted-printable.
 */
export const lineFields = (payload: string) => {
	const raw: Record<string, Line[]> = {};
	const lines = payload.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
	for (let n = 0; n < lines.length; n++) {
		const line = lines[n];
		const index = line.indexOf(":");
		if (index <= 0) continue;
		const [name, ...rawParams] = line.slice(0, index).split(";");
		const params: Record<string, string> = {};
		for (const param of rawParams) {
			const eq = param.indexOf("=");
			if (eq < 0) params[param.toUpperCase()] = "";
			else
				params[param.slice(0, eq).toUpperCase()] = param
					.slice(eq + 1)
					.replace(/^"|"$/g, "");
		}
		let value = line.slice(index + 1);
		const quotedPrintable =
			params.ENCODING?.toUpperCase() === "QUOTED-PRINTABLE" ||
			"QUOTED-PRINTABLE" in params;
		if (quotedPrintable) {
			// Soft line breaks: a trailing `=` continues on the next line.
			while (value.endsWith("=") && n + 1 < lines.length) {
				value = value.slice(0, -1) + lines[++n];
			}
			value = decodeQuotedPrintable(value, params.CHARSET);
		}
		// vCard groups (`item1.TEL`) don't change what a line is.
		const key = name.replace(/^[^.]*\./, "").toUpperCase();
		raw[key] = [...(raw[key] ?? []), { value, params }];
	}
	return {
		/** The first value, unescaped. */
		text: (key: string) =>
			raw[key] === undefined ? undefined : unescapeText(raw[key][0].value),
		/** Every non-empty value of a repeated key, unescaped. */
		all: (key: string) =>
			(raw[key] ?? [])
				.map((line) => unescapeText(line.value).trim())
				.filter(Boolean),
		/**
		 * The parts of a structured value (N, ADR, ORG). Split before
		 * unescaping, so an escaped `\;` stays inside its part.
		 */
		parts: (key: string) =>
			raw[key] === undefined
				? []
				: splitUnescaped(raw[key][0].value, ";").map(unescapeText),
		/** A parameter of the first line (`TZID`, `VALUE`), as written. */
		param: (key: string, param: string) => raw[key]?.[0].params[param],
	};
};
