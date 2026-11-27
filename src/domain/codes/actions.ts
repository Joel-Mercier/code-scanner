/**
 * What can be done with a code, most useful first. Pure: the screen maps each
 * planned action to a button and runs it.
 */
import i18n from "@/i18n";
import type { BarcodeInfo } from "./barcode";
import type { DescribedCode } from "./describe";
import {
	type LookupLink,
	lookupLinks,
	type SearchEngine,
	searchUrl,
	trackingUrl,
} from "./lookup";
import { isPlaceSearch, type ParsedCode, type WifiSecurity } from "./payload";
import { detectInText } from "./text";
import { digitalLinkGtin, opensInApp } from "./url";

export type ActionKey =
	| "open"
	| "openInApp"
	| "openInBrowser"
	| "website"
	| "email"
	| "call"
	| "sms"
	| "whatsapp"
	| "joinWifi"
	| "copyPassword"
	| "contact"
	| "event"
	| "map"
	| "directions"
	| "copyCoordinates"
	| "authenticator"
	| "copySecret"
	| "copyIban"
	| "copyAmount"
	| "copyReference"
	| "addFlight"
	| "flightStatus"
	| "copyBooking"
	| "lookup"
	| "track"
	| "expiryReminder"
	| "search"
	| "copy"
	| "share";

export type WifiNetwork = {
	ssid: string;
	password?: string;
	encryption: WifiSecurity;
	hidden: boolean;
};

export type ContactDraft = {
	firstName?: string;
	lastName?: string;
	company?: string;
	jobTitle?: string;
	phones: string[];
	emails: string[];
	url?: string;
	address?: string;
};

export type EventDraft = {
	title?: string;
	notes?: string;
	location?: string;
	start?: Date;
	end?: Date;
	allDay: boolean;
};

export type PlannedAction = { key: ActionKey } & (
	| { type: "browser"; url: string }
	| { type: "external"; url: string }
	| { type: "copy"; value: string; copied?: "password" | "secret" }
	| { type: "share" }
	| { type: "wifi"; network: WifiNetwork }
	| { type: "contact"; contact: ContactDraft }
	| { type: "event"; event: EventDraft }
	| { type: "lookup"; links: LookupLink[] }
);

export type Platform = "ios" | "android";

export type PlanOptions = {
	platform: Platform;
	engine: SearchEngine;
};

type MapTarget =
	| { lat: number; lng: number; label?: string }
	| { query: string };

const coordinates = (target: { lat: number; lng: number }) =>
	`${target.lat},${target.lng}`;

/** Shows a point or searches a place in the system maps app. */
export const mapUrl = (platform: Platform, target: MapTarget) => {
	if ("query" in target) {
		const query = encodeURIComponent(target.query);
		return platform === "ios" ? `maps://?q=${query}` : `geo:0,0?q=${query}`;
	}
	const point = coordinates(target);
	if (platform === "ios") {
		return `maps://?ll=${point}&q=${encodeURIComponent(target.label ?? point)}`;
	}
	return `geo:${point}?q=${point}${target.label ? `(${encodeURIComponent(target.label)})` : ""}`;
};

/** Directions to a point or an address. */
export const directionsUrl = (platform: Platform, target: MapTarget) => {
	const destination = encodeURIComponent(
		"query" in target ? target.query : coordinates(target),
	);
	return platform === "ios"
		? `maps://?daddr=${destination}`
		: `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
};

export const mailtoUrl = (to: string, subject?: string, body?: string) => {
	const params = [
		subject && `subject=${encodeURIComponent(subject)}`,
		body && `body=${encodeURIComponent(body)}`,
	].filter(Boolean);
	return `mailto:${to}${params.length ? `?${params.join("&")}` : ""}`;
};

export const smsUrl = (platform: Platform, number: string, message?: string) =>
	`sms:${number}${message ? `${platform === "ios" ? "&" : "?"}body=${encodeURIComponent(message)}` : ""}`;

/** `wa.me` needs the number in international form, digits only. */
export const whatsappUrl = (number: string) => {
	const compact = number.replace(/[\s.()-]/g, "");
	if (!/^(\+|00)[1-9]\d{6,14}$/.test(compact)) return undefined;
	return `https://wa.me/${compact.replace(/^\+|^00/, "")}`;
};

const HOUR = 60 * 60 * 1000;

const eventDraft = (
	parsed: Extract<ParsedCode, { kind: "event" }>,
): EventDraft => {
	const allDay = !!parsed.allDay;
	const start = parsed.start;
	return {
		title: parsed.summary,
		notes: parsed.description,
		location: parsed.location,
		start,
		end:
			parsed.end ??
			(start && (allDay ? start : new Date(start.getTime() + HOUR))),
		allDay,
	};
};

const lines = (pairs: [string, string | undefined][]) =>
	pairs
		.filter((pair): pair is [string, string] => !!pair[1])
		.map(([label, value]) => `${label}: ${value}`)
		.join("\n") || undefined;

const contentActions = (
	code: DescribedCode,
	{ platform, engine }: PlanOptions,
): PlannedAction[] => {
	const { parsed } = code;
	const actions: PlannedAction[] = [];
	const browser = (key: ActionKey, url: string) =>
		actions.push({ key, type: "browser", url });
	const external = (key: ActionKey, url: string) =>
		actions.push({ key, type: "external", url });
	const copy = (
		key: ActionKey,
		value: string,
		copied?: "password" | "secret",
	) => actions.push({ key, type: "copy", value, copied });
	const contact = (draft: Partial<ContactDraft>) =>
		actions.push({
			key: "contact",
			type: "contact",
			contact: { phones: [], emails: [], ...draft },
		});
	const lookup = (links: LookupLink[]) => {
		if (links.length) actions.push({ key: "lookup", type: "lookup", links });
	};
	switch (parsed.kind) {
		case "url": {
			if (opensInApp(parsed.url)) {
				external("openInApp", parsed.url);
				browser("open", parsed.url);
			} else {
				browser("open", parsed.url);
				external("openInBrowser", parsed.url);
			}
			const gtin = digitalLinkGtin(parsed.url);
			if (gtin) lookup(lookupLinks({ type: "product", gtin }, engine));
			break;
		}
		case "email":
			external("email", mailtoUrl(parsed.to, parsed.subject, parsed.body));
			if (parsed.to) contact({ emails: [parsed.to] });
			break;
		case "phone": {
			external("call", `tel:${parsed.number}`);
			external("sms", smsUrl(platform, parsed.number));
			const whatsapp = whatsappUrl(parsed.number);
			if (whatsapp) external("whatsapp", whatsapp);
			contact({ phones: [parsed.number] });
			break;
		}
		case "sms":
			external("sms", smsUrl(platform, parsed.number, parsed.message));
			external("call", `tel:${parsed.number}`);
			break;
		case "wifi":
			if (parsed.ssid) {
				actions.push({
					key: "joinWifi",
					type: "wifi",
					network: {
						ssid: parsed.ssid,
						password: parsed.password,
						encryption: parsed.encryption,
						hidden: parsed.hidden,
					},
				});
			}
			if (parsed.password) copy("copyPassword", parsed.password, "password");
			break;
		case "vcard": {
			contact({
				firstName: parsed.firstName,
				lastName: parsed.lastName,
				company: parsed.organization,
				jobTitle: parsed.title,
				phones: parsed.phones ?? [],
				emails: parsed.emails ?? [],
				url: parsed.url,
				address: parsed.address,
			});
			const [phone] = parsed.phones ?? [];
			const [email] = parsed.emails ?? [];
			if (phone) external("call", `tel:${phone}`);
			if (email) external("email", mailtoUrl(email));
			if (parsed.url) {
				browser(
					"website",
					/^[a-z][a-z0-9+.-]*:/i.test(parsed.url)
						? parsed.url
						: `https://${parsed.url}`,
				);
			}
			if (parsed.address) {
				external(
					"directions",
					directionsUrl(platform, { query: parsed.address }),
				);
			}
			break;
		}
		case "event":
			actions.push({ key: "event", type: "event", event: eventDraft(parsed) });
			if (parsed.location) {
				external("map", mapUrl(platform, { query: parsed.location }));
			}
			break;
		case "geoPoint":
			if (isPlaceSearch(parsed) && parsed.query) {
				external("map", mapUrl(platform, { query: parsed.query }));
				external(
					"directions",
					directionsUrl(platform, { query: parsed.query }),
				);
			} else {
				const point = { lat: parsed.lat, lng: parsed.lng, label: parsed.query };
				external("map", mapUrl(platform, point));
				external("directions", directionsUrl(platform, point));
				copy("copyCoordinates", coordinates(parsed));
			}
			break;
		case "otp":
			external("authenticator", parsed.uri);
			if (parsed.secret) copy("copySecret", parsed.secret, "secret");
			break;
		case "payment":
			if (parsed.iban) copy("copyIban", parsed.iban);
			if (parsed.amount !== undefined) {
				copy("copyAmount", parsed.amount.toFixed(2));
			}
			if (parsed.reference) copy("copyReference", parsed.reference);
			break;
		case "boardingPass": {
			const flight = `${parsed.carrier} ${parsed.flight}`;
			actions.push({
				key: "addFlight",
				type: "event",
				event: {
					title: `${flight} · ${parsed.from} → ${parsed.to}`,
					notes: lines([
						[i18n.t("app.fields.passenger"), parsed.passenger],
						[i18n.t("app.fields.booking"), parsed.pnr],
						[i18n.t("app.fields.seat"), parsed.seat],
					]),
					start: parsed.date,
					end: parsed.date,
					allDay: true,
				},
			});
			browser(
				"flightStatus",
				searchUrl(engine, `${parsed.carrier}${parsed.flight} flight status`),
			);
			if (parsed.pnr) copy("copyBooking", parsed.pnr);
			break;
		}
		case "app":
			external("openInApp", parsed.uri);
			break;
		case "text": {
			const found = detectInText(parsed.text);
			if (found.url) browser("open", found.url);
			if (found.email) external("email", mailtoUrl(found.email));
			if (found.phone) external("call", `tel:${found.phone}`);
			if (found.iban) copy("copyIban", found.iban);
			break;
		}
		case "frenchDoc":
			break;
	}
	return actions;
};

const barcodeActions = (
	code: DescribedCode,
	info: BarcodeInfo | undefined,
	data: string,
	{ engine }: PlanOptions,
): PlannedAction[] => {
	const actions: PlannedAction[] = [];
	const search = (query: string) =>
		actions.push({
			key: "search",
			type: "browser",
			url: searchUrl(engine, query),
		});
	if (!info) {
		// Plain text gets a search only when it's short enough to be a query.
		if (code.kind === "barcode" || data.trim().length <= 120)
			search(data.trim());
		return actions;
	}
	const links = lookupLinks(info, engine);
	if (links.length) actions.push({ key: "lookup", type: "lookup", links });
	switch (info.type) {
		case "gs1":
			if (info.expiry) {
				actions.push({
					key: "expiryReminder",
					type: "event",
					event: {
						title: i18n.t("app.actions.expiry_title", { name: code.title }),
						notes: lines([
							[i18n.t("app.fields.gtin"), info.gtin],
							[i18n.t("app.fields.lot"), info.lot],
						]),
						start: info.expiry,
						end: info.expiry,
						allDay: true,
					},
				});
			}
			if (!links.length) search(data.trim());
			break;
		case "parcel":
			actions.push({ key: "track", type: "browser", url: trackingUrl(info) });
			search(info.number);
			break;
		case "vin":
			search(`VIN ${info.vin}`);
			break;
		// Codes a shop or a coupon issuer assigns mean nothing elsewhere.
		case "store":
		case "coupon":
		case "refund":
			break;
		default:
			if (!links.length) search(data.trim());
	}
	return actions;
};

/** Every action for a code: its content's, then copy and share. */
export const planActions = (
	code: DescribedCode,
	data: string,
	options: PlanOptions,
): PlannedAction[] => {
	const { parsed } = code;
	const content = contentActions(code, options);
	const numbers =
		parsed.kind === "text"
			? barcodeActions(code, code.barcode, data, options)
			: [];
	const copyValue =
		parsed.kind === "url"
			? parsed.url
			: parsed.kind === "text"
				? parsed.text
				: data;
	return [
		...content,
		...numbers,
		{ key: "copy", type: "copy", value: copyValue },
		{ key: "share", type: "share" },
	];
};
