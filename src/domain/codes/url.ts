/**
 * Reads a link before it's opened: the real host, and the tricks QR scams
 * use to hide it.
 */
import { isValidGtin } from "./gs1";

export type UrlWarning =
	/** Plain `http`: anyone on the network can read or change the page. */
	| "insecure"
	/** International characters that can imitate another site's name. */
	| "lookalike"
	/** A bare IP address instead of a name. */
	| "ipAddress"
	/** `https://bank.com@evil.example`: everything before `@` is ignored. */
	| "userInfo"
	/** A link shortener hides where it really goes. */
	| "shortener";

export type UrlParts = {
	scheme: string;
	userInfo?: string;
	/** Lower case, as typed (punycode stays punycode). */
	host: string;
	port?: string;
	path: string;
	query: string;
};

/** Splits a URL by hand (React Native's `URL` is incomplete). */
export const splitUrl = (url: string): UrlParts | undefined => {
	const match = url
		.trim()
		.match(
			/^([a-z][a-z0-9+.-]*):\/\/(?:([^@/?#]*)@)?(\[[^\]]*\]|[^:/?#]*)(?::(\d*))?([^?#]*)(?:\?([^#]*))?/i,
		);
	if (!match) return undefined;
	return {
		scheme: match[1].toLowerCase(),
		userInfo: match[2] || undefined,
		host: match[3].toLowerCase().replace(/\.$/, ""),
		port: match[4] || undefined,
		path: match[5],
		query: match[6] ?? "",
	};
};

const BASE = 36;
const T_MIN = 1;
const T_MAX = 26;

const adapt = (delta: number, points: number, first: boolean) => {
	let d = first ? Math.floor(delta / 700) : delta >> 1;
	d += Math.floor(d / points);
	let k = 0;
	while (d > ((BASE - T_MIN) * T_MAX) >> 1) {
		d = Math.floor(d / (BASE - T_MIN));
		k += BASE;
	}
	return Math.floor(k + ((BASE - T_MIN + 1) * d) / (d + 38));
};

const punycodeDigit = (code: number) =>
	code >= 48 && code <= 57
		? code - 22
		: code >= 65 && code <= 90
			? code - 65
			: code >= 97 && code <= 122
				? code - 97
				: BASE;

/** RFC 3492: `mnchen-3ya` → `münchen`. `undefined` if it isn't valid. */
export const decodePunycode = (input: string) => {
	const output: number[] = [];
	const basic = input.lastIndexOf("-");
	for (let j = 0; j < Math.max(basic, 0); j++) {
		output.push(input.charCodeAt(j));
	}
	let n = 128;
	let bias = 72;
	let i = 0;
	for (let index = basic > 0 ? basic + 1 : 0; index < input.length; ) {
		const oldI = i;
		let w = 1;
		for (let k = BASE; ; k += BASE) {
			if (index >= input.length) return undefined;
			const digit = punycodeDigit(input.charCodeAt(index++));
			if (digit >= BASE) return undefined;
			i += digit * w;
			const t = k <= bias ? T_MIN : k >= bias + T_MAX ? T_MAX : k - bias;
			if (digit < t) break;
			w *= BASE - t;
		}
		const length = output.length + 1;
		bias = adapt(i - oldI, length, oldI === 0);
		n += Math.floor(i / length);
		i %= length;
		output.splice(i++, 0, n);
	}
	try {
		return String.fromCodePoint(...output);
	} catch {
		return undefined;
	}
};

/** A host as people read it: `xn--` labels decoded. */
export const displayHost = (host: string) =>
	host
		.split(".")
		.map((label) =>
			label.startsWith("xn--")
				? (decodePunycode(label.slice(4)) ?? label)
				: label,
		)
		.join(".");

const SHORTENERS = new Set([
	"bit.ly",
	"bitly.com",
	"tinyurl.com",
	"t.co",
	"goo.gl",
	"ow.ly",
	"is.gd",
	"v.gd",
	"buff.ly",
	"rebrand.ly",
	"cutt.ly",
	"shorturl.at",
	"tiny.cc",
	"rb.gy",
	"t.ly",
	"s.id",
	"bl.ink",
	"lnkd.in",
	"qrco.de",
	"qrcodes.pro",
	"me-qr.com",
	"tiny.one",
	"shorturl.ly",
	"short.io",
	"urlz.fr",
	"bit.do",
]);

export type UrlCheck = {
	/** The host to show, decoded, without `www.`. */
	host: string;
	warnings: UrlWarning[];
};

/** The host to show and what looks off about a link. */
export const inspectUrl = (url: string): UrlCheck | undefined => {
	const parts = splitUrl(url);
	if (!parts?.host) return undefined;
	const shown = displayHost(parts.host);
	const warnings: UrlWarning[] = [];
	if (parts.scheme === "http") warnings.push("insecure");
	if (parts.userInfo) warnings.push("userInfo");
	if (
		/^\d{1,3}(\.\d{1,3}){3}$/.test(parts.host) ||
		parts.host.startsWith("[")
	) {
		warnings.push("ipAddress");
	}
	if (/[^ -~]/.test(shown)) warnings.push("lookalike");
	if (SHORTENERS.has(parts.host.replace(/^www\./, ""))) {
		warnings.push("shortener");
	}
	return { host: shown.replace(/^www\./, ""), warnings };
};

/**
 * Hosts whose links are meant to open in their app (universal / app links),
 * which an in-app browser never hands over.
 */
const APP_HOSTS = [
	"youtube.com",
	"youtu.be",
	"instagram.com",
	"facebook.com",
	"fb.me",
	"x.com",
	"twitter.com",
	"tiktok.com",
	"linkedin.com",
	"threads.net",
	"pinterest.com",
	"snapchat.com",
	"wa.me",
	"whatsapp.com",
	"t.me",
	"telegram.me",
	"open.spotify.com",
	"music.apple.com",
	"podcasts.apple.com",
	"apps.apple.com",
	"itunes.apple.com",
	"play.google.com",
	"maps.apple.com",
	"maps.google.com",
	"maps.app.goo.gl",
	"waze.com",
	"zoom.us",
	"meet.google.com",
	"teams.microsoft.com",
	"discord.gg",
	"discord.com",
	"reddit.com",
	"uber.com",
];

/** Whether a link is better opened in the app it belongs to. */
export const opensInApp = (url: string) => {
	const parts = splitUrl(url);
	if (!parts) return false;
	const host = parts.host.replace(/^(www|m)\./, "");
	if (host.endsWith("google.com") && parts.path.startsWith("/maps")) {
		return true;
	}
	return APP_HOSTS.some((app) => host === app || host.endsWith(`.${app}`));
};

/**
 * The GTIN of a GS1 Digital Link (`https://id.gs1.org/01/09506000134352`),
 * as 13 digits when it's a consumer unit.
 */
export const digitalLinkGtin = (url: string) => {
	const parts = splitUrl(url);
	const match = parts?.path.match(/\/01\/(\d{8}|\d{12,14})(?:\/|$)/);
	if (!match) return undefined;
	const gtin = match[1].padStart(14, "0");
	if (!isValidGtin(gtin)) return undefined;
	return gtin.startsWith("0") ? gtin.slice(1) : gtin;
};
