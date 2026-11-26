export type QRKind =
	| "url"
	| "text"
	| "wifi"
	| "email"
	| "phone"
	| "sms"
	| "vcard"
	| "event"
	| "geoPoint";

export type WifiEncryption = "WPA" | "WEP" | "nopass";

export type ParsedCode =
	| { kind: "url"; url: string }
	| { kind: "text"; text: string }
	| { kind: "email"; to: string; subject?: string; body?: string }
	| { kind: "phone"; number: string }
	| { kind: "sms"; number: string; message?: string }
	| {
			kind: "wifi";
			ssid: string;
			password?: string;
			encryption: WifiEncryption;
			hidden: boolean;
	  }
	| {
			kind: "vcard";
			firstName?: string;
			lastName?: string;
			organization?: string;
			title?: string;
			phone?: string;
			email?: string;
			url?: string;
			address?: string;
	  }
	| {
			kind: "event";
			summary?: string;
			description?: string;
			location?: string;
			start?: Date;
			end?: Date;
	  }
	| { kind: "geoPoint"; lat: number; lng: number; alt?: number };

const decode = (value: string) => {
	try {
		return decodeURIComponent(value.replace(/\+/g, " "));
	} catch {
		return value;
	}
};

const queryParams = (query: string) => {
	const params: Record<string, string> = {};
	for (const pair of query.split("&")) {
		const [key, ...rest] = pair.split("=");
		if (key) params[key.toLowerCase()] = decode(rest.join("="));
	}
	return params;
};

/** Splits on the `separator`s that aren't escaped, keeping the escapes. */
const splitUnescaped = (value: string, separator: string) => {
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

/** Parses `KEY:value;KEY:value` payloads (Wi-Fi, MECARD, MATMSG). */
const semicolonFields = (body: string) => {
	const raw: Record<string, string> = {};
	for (const field of splitUnescaped(body, ";")) {
		const index = field.indexOf(":");
		if (index > 0)
			raw[field.slice(0, index).toUpperCase()] = field.slice(index + 1);
	}
	return {
		/** A value, unescaped. */
		text: (key: string) =>
			raw[key] === undefined ? undefined : unescapeField(raw[key]),
		/**
		 * The comma-separated parts of a value (MECARD's `N:last,first`). Split
		 * before unescaping, so an escaped `\,` stays inside its part.
		 */
		parts: (key: string) =>
			raw[key] === undefined
				? []
				: splitUnescaped(raw[key], ",").map(unescapeField),
	};
};

/** Parses `KEY;PARAMS:value` lines of vCard / iCalendar payloads. */
const lineFields = (payload: string) => {
	const raw: Record<string, string> = {};
	const unfolded = payload.replace(/\r?\n[ \t]/g, "");
	for (const line of unfolded.split(/\r?\n/)) {
		const index = line.indexOf(":");
		if (index <= 0) continue;
		const key = line.slice(0, index).split(";")[0].toUpperCase();
		if (!(key in raw)) raw[key] = line.slice(index + 1);
	}
	return {
		/** A text value, unescaped. */
		text: (key: string) =>
			raw[key] === undefined ? undefined : unescapeText(raw[key]),
		/**
		 * The parts of a structured value (N, ADR, ORG). Split before
		 * unescaping, so an escaped `\;` stays inside its part.
		 */
		parts: (key: string) =>
			raw[key] === undefined
				? []
				: splitUnescaped(raw[key], ";").map(unescapeText),
	};
};

/** Undoes vCard / iCalendar text escapes: `\n`, `\\`, `\;`, `\,`. */
const unescapeText = (value: string) =>
	value.replace(/\\([nN\\;,])/g, (_, char: string) =>
		char === "n" || char === "N" ? "\n" : char,
	);

const parseICalDate = (value?: string) => {
	if (!value) return undefined;
	const match = value.match(
		/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/,
	);
	if (!match) {
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? undefined : date;
	}
	const [, y, mo, d, h = "0", mi = "0", s = "0", utc] = match;
	const args = [+y, +mo - 1, +d, +h, +mi, +s] as const;
	return utc ? new Date(Date.UTC(...args)) : new Date(...args);
};

export const parseCode = (raw: string): ParsedCode => {
	const data = raw.trim();
	const upper = data.toUpperCase();

	if (/^https?:\/\//i.test(data) || /^www\./i.test(data)) {
		return {
			kind: "url",
			url: /^www\./i.test(data) ? `https://${data}` : data,
		};
	}
	if (upper.startsWith("MAILTO:")) {
		const [to, query = ""] = data.slice(7).split("?");
		const params = queryParams(query);
		return {
			kind: "email",
			to: decode(to),
			subject: params.subject,
			body: params.body,
		};
	}
	if (upper.startsWith("MATMSG:")) {
		const fields = semicolonFields(data.slice(7));
		return {
			kind: "email",
			to: fields.text("TO") ?? "",
			subject: fields.text("SUB"),
			body: fields.text("BODY"),
		};
	}
	if (upper.startsWith("TEL:")) {
		return { kind: "phone", number: data.slice(4) };
	}
	if (upper.startsWith("SMSTO:")) {
		const [number, ...message] = data.slice(6).split(":");
		return {
			kind: "sms",
			number,
			message: message.join(":") || undefined,
		};
	}
	if (upper.startsWith("SMS:")) {
		const [number, query = ""] = data.slice(4).split("?");
		return { kind: "sms", number, message: queryParams(query).body };
	}
	if (upper.startsWith("WIFI:")) {
		const fields = semicolonFields(data.slice(5));
		const type = (fields.text("T") ?? "").toUpperCase();
		return {
			kind: "wifi",
			ssid: fields.text("S") ?? "",
			password: fields.text("P") || undefined,
			encryption: type.startsWith("WPA")
				? "WPA"
				: type === "WEP"
					? "WEP"
					: "nopass",
			hidden: (fields.text("H") ?? "").toLowerCase() === "true",
		};
	}
	if (upper.startsWith("BEGIN:VCARD")) {
		const fields = lineFields(data);
		const [lastName, firstName] = fields.parts("N");
		const fullName = fields.text("FN")?.trim();
		/** The non-empty parts of a structured value, as one line. */
		const joined = (key: string) =>
			fields
				.parts(key)
				.map((part) => part.trim())
				.filter(Boolean)
				.join(", ") || undefined;
		return {
			kind: "vcard",
			firstName: firstName || (lastName ? undefined : fullName),
			lastName: lastName || undefined,
			organization: joined("ORG"),
			title: fields.text("TITLE"),
			phone: fields.text("TEL"),
			email: fields.text("EMAIL"),
			url: fields.text("URL"),
			address: joined("ADR"),
		};
	}
	if (upper.startsWith("MECARD:")) {
		const fields = semicolonFields(data.slice(7));
		const [lastName, firstName] = fields.parts("N");
		return {
			kind: "vcard",
			firstName: firstName || undefined,
			lastName: lastName || undefined,
			organization: fields.text("ORG"),
			phone: fields.text("TEL"),
			email: fields.text("EMAIL"),
			url: fields.text("URL"),
			address: fields.text("ADR"),
		};
	}
	if (upper.startsWith("BEGIN:VEVENT") || upper.startsWith("BEGIN:VCALENDAR")) {
		const fields = lineFields(data);
		return {
			kind: "event",
			summary: fields.text("SUMMARY"),
			description: fields.text("DESCRIPTION"),
			location: fields.text("LOCATION"),
			start: parseICalDate(fields.text("DTSTART")),
			end: parseICalDate(fields.text("DTEND")),
		};
	}
	if (upper.startsWith("GEO:")) {
		const [lat, lng, alt] = data.slice(4).split("?")[0].split(",").map(Number);
		if (Number.isFinite(lat) && Number.isFinite(lng)) {
			return {
				kind: "geoPoint",
				lat,
				lng,
				alt: Number.isFinite(alt) ? alt : undefined,
			};
		}
	}
	return { kind: "text", text: data };
};

const escapeWifi = (value: string) => value.replace(/([\\;,:"])/g, "\\$1");
const escapeICal = (value: string) =>
	value.replace(/([\\;,])/g, "\\$1").replace(/\n/g, "\\n");

const query = (params: Record<string, string | undefined>) => {
	const entries = Object.entries(params).filter(
		(entry): entry is [string, string] => !!entry[1],
	);
	return entries.length
		? `?${entries.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&")}`
		: "";
};

const formatICalDate = (date: Date) =>
	date
		.toISOString()
		.replace(/[-:]/g, "")
		.replace(/\.\d{3}/, "");

export type QRFormValues = {
	url: { url: string };
	text: { text: string };
	wifi: {
		ssid: string;
		password?: string;
		encryption: WifiEncryption;
		hidden?: boolean;
	};
	email: { to: string; subject?: string; body?: string };
	phone: { number: string };
	sms: { number: string; message?: string };
	vcard: {
		firstName: string;
		lastName?: string;
		phone?: string;
		email?: string;
		organization?: string;
		title?: string;
		url?: string;
		address?: string;
	};
	event: {
		summary: string;
		description?: string;
		location?: string;
		start?: Date;
	};
	geoPoint: { lat: number; lng: number; alt?: number };
};

export const buildPayload = <K extends QRKind>(
	kind: K,
	values: QRFormValues[K],
): string => {
	const v = values as QRFormValues[QRKind] & Record<string, unknown>;
	switch (kind) {
		case "url":
			return (v as QRFormValues["url"]).url.trim();
		case "text":
			return (v as QRFormValues["text"]).text;
		case "phone":
			return `tel:${(v as QRFormValues["phone"]).number.trim()}`;
		case "sms": {
			const sms = v as QRFormValues["sms"];
			return `sms:${sms.number.trim()}${query({ body: sms.message })}`;
		}
		case "email": {
			const email = v as QRFormValues["email"];
			return `mailto:${email.to.trim()}${query({ subject: email.subject, body: email.body })}`;
		}
		case "wifi": {
			const wifi = v as QRFormValues["wifi"];
			let data = `WIFI:T:${wifi.encryption};S:${escapeWifi(wifi.ssid)};`;
			if (wifi.password && wifi.encryption !== "nopass") {
				data += `P:${escapeWifi(wifi.password)};`;
			}
			if (wifi.hidden) data += "H:true;";
			return `${data};`;
		}
		case "vcard": {
			const card = v as QRFormValues["vcard"];
			const lines = [
				"BEGIN:VCARD",
				"VERSION:3.0",
				`N:${escapeICal(card.lastName ?? "")};${escapeICal(card.firstName)}`,
				`FN:${[card.firstName, card.lastName].filter(Boolean).join(" ")}`,
				card.organization && `ORG:${escapeICal(card.organization)}`,
				card.title && `TITLE:${escapeICal(card.title)}`,
				card.phone && `TEL;TYPE=CELL:${card.phone}`,
				card.email && `EMAIL:${card.email}`,
				card.url && `URL:${card.url}`,
				card.address && `ADR;TYPE=HOME:;;${escapeICal(card.address)}`,
				"END:VCARD",
			];
			return lines.filter(Boolean).join("\n");
		}
		case "event": {
			const event = v as QRFormValues["event"];
			const lines = [
				"BEGIN:VEVENT",
				`SUMMARY:${escapeICal(event.summary)}`,
				event.description && `DESCRIPTION:${escapeICal(event.description)}`,
				event.location && `LOCATION:${escapeICal(event.location)}`,
				event.start && `DTSTART:${formatICalDate(event.start)}`,
				"END:VEVENT",
			];
			return lines.filter(Boolean).join("\n");
		}
		case "geoPoint": {
			const geo = v as QRFormValues["geoPoint"];
			return `geo:${geo.lat},${geo.lng}${geo.alt !== undefined ? `,${geo.alt}` : ""}`;
		}
		default:
			return "";
	}
};

/** One-line, human friendly summary used on cards and list rows. */
export const describeCode = (parsed: ParsedCode) => {
	switch (parsed.kind) {
		case "url":
			return parsed.url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
		case "text":
			return parsed.text;
		case "email":
			return parsed.to;
		case "phone":
		case "sms":
			return parsed.number;
		case "wifi":
			return parsed.ssid;
		case "vcard":
			return (
				[parsed.firstName, parsed.lastName].filter(Boolean).join(" ") ||
				parsed.organization ||
				parsed.email ||
				""
			);
		case "event":
			return parsed.summary ?? "";
		case "geoPoint":
			return `${parsed.lat.toFixed(5)}, ${parsed.lng.toFixed(5)}`;
	}
};
