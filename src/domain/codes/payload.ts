import {
	type BoardingPass,
	type FrenchDoc,
	type OtpCode,
	type PaymentCode,
	parseBoardingPass,
	parseFrenchDoc,
	parseOtp,
	parsePayment,
} from "./extraPayloads";
import { decode, lineFields, queryParams, semicolonFields } from "./fields";
import { compactIban } from "./iban";

/** Payload kinds the workshop can create. */
export type QRKind =
	| "url"
	| "text"
	| "wifi"
	| "email"
	| "phone"
	| "sms"
	| "vcard"
	| "event"
	| "geoPoint"
	| "payment";

/** Payload kinds that are only ever read from scans. */
export type ScanOnlyKind = "otp" | "boardingPass" | "frenchDoc" | "app";

export type PayloadKind = QRKind | ScanOnlyKind;

export type WifiEncryption = "WPA" | "WEP" | "nopass";

/** What a scanned network uses: what the workshop offers, plus WPA3 and enterprise. */
export type WifiSecurity = WifiEncryption | "SAE" | "EAP";

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
			encryption: WifiSecurity;
			hidden: boolean;
			/** WPA2-Enterprise: EAP method and identity. */
			eap?: { method?: string; identity?: string; phase2?: string };
	  }
	| {
			kind: "vcard";
			firstName?: string;
			lastName?: string;
			organization?: string;
			title?: string;
			phones?: string[];
			emails?: string[];
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
			/** Dates without a time (`VALUE=DATE`). */
			allDay?: boolean;
	  }
	| {
			kind: "geoPoint";
			lat: number;
			lng: number;
			alt?: number;
			/** A place name or address (`?q=`); alone when the point is 0,0. */
			query?: string;
	  }
	| OtpCode
	| PaymentCode
	| BoardingPass
	| FrenchDoc
	| { kind: "app"; uri: string; scheme: string };

/** A geo: point that is only a search (`geo:0,0?q=address`). */
export const isPlaceSearch = (
	parsed: Extract<ParsedCode, { kind: "geoPoint" }>,
) => parsed.lat === 0 && parsed.lng === 0 && !!parsed.query;

type DateParts = [number, number, number, number, number, number];

/** How far `timeZone` is ahead of UTC at `utc`, in milliseconds. */
const zoneOffset = (utc: number, timeZone: string) => {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone,
		hour12: false,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	}).formatToParts(new Date(utc));
	const get = (type: string) =>
		Number(parts.find((part) => part.type === type)?.value);
	const asUtc = Date.UTC(
		get("year"),
		get("month") - 1,
		get("day"),
		get("hour") % 24,
		get("minute"),
		get("second"),
	);
	return asUtc - utc;
};

/** A wall-clock time in an IANA time zone; `undefined` for unknown zones. */
const zonedDate = (parts: DateParts, timeZone: string) => {
	try {
		const guess = Date.UTC(...parts);
		const offset = zoneOffset(guess, timeZone);
		let utc = guess - offset;
		// Around a DST change the offset at the real instant can differ.
		const actual = zoneOffset(utc, timeZone);
		if (actual !== offset) utc = guess - actual;
		return new Date(utc);
	} catch {
		return undefined;
	}
};

const parseICalDate = (value?: string, timeZone?: string) => {
	if (!value) return undefined;
	const match = value.match(
		/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/,
	);
	if (!match) {
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? undefined : date;
	}
	const [, y, mo, d, h, mi = "0", s = "0", utc] = match;
	const parts: DateParts = [+y, +mo - 1, +d, +(h ?? 0), +mi, +s];
	if (utc) return new Date(Date.UTC(...parts));
	// Date-only values (all-day) stay on the device's calendar day.
	if (h !== undefined && timeZone) {
		const zoned = zonedDate(parts, timeZone.replace(/^\/[^/]+\/[^/]+\//, ""));
		if (zoned) return zoned;
	}
	return new Date(...parts);
};

const parseWifi = (body: string): ParsedCode => {
	const fields = semicolonFields(body);
	const type = (fields.text("T") ?? "").toUpperCase();
	const encryption: WifiSecurity =
		type.includes("EAP") || (fields.text("E") && type.startsWith("WPA"))
			? "EAP"
			: type === "SAE" || type.startsWith("WPA3")
				? "SAE"
				: type.startsWith("WPA")
					? "WPA"
					: type === "WEP"
						? "WEP"
						: "nopass";
	return {
		kind: "wifi",
		ssid: fields.text("S") ?? "",
		password: fields.text("P") || undefined,
		encryption,
		hidden: (fields.text("H") ?? "").toLowerCase() === "true",
		...(encryption === "EAP" && {
			eap: {
				method: fields.text("E") || undefined,
				identity: fields.text("I") || fields.text("A") || undefined,
				phase2: fields.text("PH2") || undefined,
			},
		}),
	};
};

const parseGeo = (body: string): ParsedCode | undefined => {
	const [path, search = ""] = body.split("?");
	// Drop `;crs=` / `;u=` parameters before reading the numbers.
	const [lat, lng, alt] = path.split(";")[0].split(",").map(Number);
	if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
	const query = queryParams(search).q?.trim() || undefined;
	// Android's `geo:0,0?q=lat,lng(Label)` puts the point in the query.
	const point = query?.match(
		/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*(?:\((.*)\))?$/,
	);
	if (point && lat === 0 && lng === 0) {
		return {
			kind: "geoPoint",
			lat: Number(point[1]),
			lng: Number(point[2]),
			alt: undefined,
			query: point[3]?.trim() || undefined,
		};
	}
	return {
		kind: "geoPoint",
		lat,
		lng,
		alt: Number.isFinite(alt) ? alt : undefined,
		query,
	};
};

const list = (values: string[]) => (values.length ? values : undefined);

/** URI schemes that open an app without `//` (`bitcoin:…`, `spotify:…`). */
const APP_SCHEMES = new Set([
	"bitcoin",
	"bitcoincash",
	"ethereum",
	"litecoin",
	"lightning",
	"monero",
	"spotify",
	"facetime",
	"facetime-audio",
	"skype",
	"sip",
	"sips",
	"xmpp",
	"magnet",
	"matrix",
	"maps",
	"fido",
	"callto",
	"webcal",
]);

/** Schemes that are never handed to another app. */
const BLOCKED_SCHEMES = new Set([
	"javascript",
	"vbscript",
	"data",
	"file",
	"content",
	"intent",
	"blob",
	"about",
]);

const appLink = (data: string): ParsedCode | undefined => {
	if (/\s/.test(data)) return undefined;
	const scheme = data.match(/^([a-z][a-z0-9+.-]{1,31}):/i)?.[1].toLowerCase();
	if (!scheme || BLOCKED_SCHEMES.has(scheme)) return undefined;
	const rest = data.slice(scheme.length + 1);
	if (!rest || (!rest.startsWith("//") && !APP_SCHEMES.has(scheme))) {
		return undefined;
	}
	return { kind: "app", uri: data, scheme };
};

export const parseCode = (raw: string, now = new Date()): ParsedCode => {
	const data = raw.trim();
	const upper = data.toUpperCase();

	if (/^https?:\/\//i.test(data) || /^www\./i.test(data)) {
		return {
			kind: "url",
			url: /^www\./i.test(data) ? `https://${data}` : data,
		};
	}
	if (upper.startsWith("URLTO:")) {
		const url = data.slice(6).trim();
		if (url) {
			return {
				kind: "url",
				url: /^https?:\/\//i.test(url) ? url : `https://${url}`,
			};
		}
	}
	if (upper.startsWith("MEBKM:")) {
		const url = semicolonFields(data.slice(6)).text("URL")?.trim();
		if (url) {
			return {
				kind: "url",
				url: /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`,
			};
		}
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
		return parseWifi(data.slice(5));
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
			phones: list(fields.all("TEL")),
			emails: list(fields.all("EMAIL")),
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
			phones: list(fields.all("TEL")),
			emails: list(fields.all("EMAIL")),
			url: fields.text("URL"),
			address: fields.text("ADR"),
		};
	}
	if (upper.startsWith("BIZCARD:")) {
		const fields = semicolonFields(data.slice(8));
		return {
			kind: "vcard",
			firstName: fields.text("N") || undefined,
			lastName: fields.text("X") || undefined,
			organization: fields.text("C") || undefined,
			title: fields.text("T") || undefined,
			phones: list([...fields.all("B"), ...fields.all("M")]),
			emails: list(fields.all("E")),
			address: fields.text("A") || undefined,
		};
	}
	if (upper.startsWith("BEGIN:VEVENT") || upper.startsWith("BEGIN:VCALENDAR")) {
		const fields = lineFields(data);
		const dateOnly = (key: string) =>
			fields.param(key, "VALUE")?.toUpperCase() === "DATE" ||
			/^\d{8}$/.test(fields.text(key) ?? "");
		return {
			kind: "event",
			summary: fields.text("SUMMARY"),
			description: fields.text("DESCRIPTION"),
			location: fields.text("LOCATION"),
			start: parseICalDate(
				fields.text("DTSTART"),
				fields.param("DTSTART", "TZID"),
			),
			end: parseICalDate(fields.text("DTEND"), fields.param("DTEND", "TZID")),
			allDay: dateOnly("DTSTART"),
		};
	}
	if (upper.startsWith("GEO:")) {
		const geo = parseGeo(data.slice(4));
		if (geo) return geo;
	}
	if (upper.startsWith("OTPAUTH://")) {
		const otp = parseOtp(data);
		if (otp) return otp;
	}
	const payment = parsePayment(data);
	if (payment) return payment;
	const boardingPass = parseBoardingPass(data, now);
	if (boardingPass) return boardingPass;
	const frenchDoc = parseFrenchDoc(data);
	if (frenchDoc) return frenchDoc;
	return appLink(data) ?? { kind: "text", text: data };
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
	payment: {
		name: string;
		iban: string;
		bic?: string;
		/** In euros. */
		amount?: number;
		message?: string;
	};
};

/** EPC fields are single lines. */
const epcLine = (value?: string) =>
	value?.replace(/\s*\n\s*/g, " ").trim() ?? "";

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
		case "payment": {
			// EPC069-12 v002: a SEPA credit transfer, in UTF-8 (character set 1).
			const pay = v as QRFormValues["payment"];
			const lines = [
				"BCD",
				"002",
				"1",
				"SCT",
				epcLine(pay.bic).toUpperCase(),
				epcLine(pay.name),
				compactIban(pay.iban),
				pay.amount !== undefined ? `EUR${pay.amount.toFixed(2)}` : "",
				"", // purpose code
				"", // structured creditor reference
				epcLine(pay.message),
			];
			// Empty trailing fields are left out.
			while (lines.at(-1) === "") lines.pop();
			return lines.join("\n");
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
				parsed.emails?.[0] ||
				""
			);
		case "event":
			return parsed.summary ?? "";
		case "geoPoint":
			return (
				parsed.query ?? `${parsed.lat.toFixed(5)}, ${parsed.lng.toFixed(5)}`
			);
		case "otp":
			return (
				[parsed.issuer, parsed.account].filter(Boolean).join(" · ") ||
				parsed.uri
			);
		case "payment":
			return parsed.name ?? parsed.iban ?? "";
		case "boardingPass":
			return `${parsed.carrier} ${parsed.flight} · ${parsed.from} → ${parsed.to}`;
		case "frenchDoc":
			return "2D-Doc";
		case "app":
			return parsed.uri;
	}
};
