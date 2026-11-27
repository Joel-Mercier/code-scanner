import type { CodeItem } from "@/domain/library/types";
import i18n from "@/i18n";
import {
	directionsUrl,
	mapUrl,
	type PlannedAction,
	planActions,
	smsUrl,
	whatsappUrl,
} from "./actions";
import { describeItem } from "./describe";

const item = (data: string, format = "qr"): CodeItem => ({
	kind: "code",
	id: "c1",
	seq: 1,
	folderId: null,
	createdAt: new Date(2026, 10, 20).getTime(),
	source: "scanner",
	format: format as CodeItem["format"],
	data,
});

const plan = (
	data: string,
	format?: string,
	platform: "ios" | "android" = "ios",
) =>
	planActions(describeItem(item(data, format)), data, {
		platform,
		engine: "duckduckgo",
	});

const keys = (actions: PlannedAction[]) => actions.map((action) => action.key);
const find = (actions: PlannedAction[], key: string) =>
	actions.find((action) => action.key === key);

afterEach(() => i18n.changeLanguage("en"));

describe("planActions", () => {
	it("opens links in the in-app browser, or in their app", () => {
		expect(keys(plan("https://example.com"))).toEqual([
			"open",
			"openInBrowser",
			"copy",
			"share",
		]);
		expect(keys(plan("https://youtu.be/abc"))).toEqual([
			"openInApp",
			"open",
			"copy",
			"share",
		]);
	});

	it("looks up the product of a GS1 Digital Link", () => {
		const actions = plan("https://id.gs1.org/01/09506000134352");
		expect(keys(actions)).toContain("lookup");
	});

	it("joins Wi-Fi networks, open ones too", () => {
		expect(plan("WIFI:T:SAE;S:Home;P:secret123;;")).toEqual([
			{
				key: "joinWifi",
				type: "wifi",
				network: {
					ssid: "Home",
					password: "secret123",
					encryption: "SAE",
					hidden: false,
				},
			},
			{
				key: "copyPassword",
				type: "copy",
				value: "secret123",
				copied: "password",
			},
			{ key: "copy", type: "copy", value: "WIFI:T:SAE;S:Home;P:secret123;;" },
			{ key: "share", type: "share" },
		]);
		expect(keys(plan("WIFI:S:Cafe;;"))).toEqual(["joinWifi", "copy", "share"]);
	});

	it("offers calls, messages, WhatsApp and a contact for phone numbers", () => {
		const actions = plan("tel:+33 6 12 34 56 78");
		expect(keys(actions)).toEqual([
			"call",
			"sms",
			"whatsapp",
			"contact",
			"copy",
			"share",
		]);
		expect(find(actions, "whatsapp")).toMatchObject({
			url: "https://wa.me/33612345678",
		});
		expect(keys(plan("tel:0612345678"))).not.toContain("whatsapp");
	});

	it("gives contacts every way to reach them", () => {
		const actions = plan(
			"MECARD:N:Lovelace,Ada;TEL:+44 20;EMAIL:ada@example.com;URL:ada.example;ADR:1 Main St;;",
		);
		expect(keys(actions)).toEqual([
			"contact",
			"call",
			"email",
			"website",
			"directions",
			"copy",
			"share",
		]);
		expect(find(actions, "website")).toMatchObject({
			url: "https://ada.example",
		});
		expect(find(actions, "contact")).toMatchObject({
			contact: { phones: ["+44 20"], emails: ["ada@example.com"] },
		});
	});

	it("adds events with an end, all-day or an hour later", () => {
		const timed = find(
			plan(
				"BEGIN:VEVENT\nSUMMARY:Talk\nLOCATION:Hall B\nDTSTART:20261224T190000Z\nEND:VEVENT",
			),
			"event",
		);
		expect(timed).toMatchObject({
			event: {
				title: "Talk",
				start: new Date(Date.UTC(2026, 11, 24, 19)),
				end: new Date(Date.UTC(2026, 11, 24, 20)),
				allDay: false,
			},
		});
		const allDay = find(
			plan("BEGIN:VEVENT\nDTSTART:20261224\nEND:VEVENT"),
			"event",
		);
		expect(allDay).toMatchObject({
			event: {
				start: new Date(2026, 11, 24),
				end: new Date(2026, 11, 24),
				allDay: true,
			},
		});
		expect(keys(plan("BEGIN:VEVENT\nLOCATION:Hall B\nEND:VEVENT"))).toContain(
			"map",
		);
	});

	it("searches place-only geo: codes, and shows points otherwise", () => {
		expect(find(plan("geo:0,0?q=Rivoli"), "map")).toMatchObject({
			url: "maps://?q=Rivoli",
		});
		expect(keys(plan("geo:48.85,2.29"))).toEqual([
			"map",
			"directions",
			"copyCoordinates",
			"copy",
			"share",
		]);
	});

	it("hands 2FA links to an authenticator and copies the secret", () => {
		expect(keys(plan("otpauth://totp/ada?secret=JBSWY3DP"))).toEqual([
			"authenticator",
			"copySecret",
			"copy",
			"share",
		]);
	});

	it("copies a payment's IBAN, amount and reference", () => {
		const actions = plan(
			"BCD\n002\n1\nSCT\n\nAda\nFR7630006000011234567890189\nEUR12.5\n\nRF18",
		);
		expect(actions.slice(0, 3)).toEqual([
			{ key: "copyIban", type: "copy", value: "FR7630006000011234567890189" },
			{ key: "copyAmount", type: "copy", value: "12.50" },
			{ key: "copyReference", type: "copy", value: "RF18" },
		]);
	});

	it("adds a flight to the calendar on its day", () => {
		const actions = plan(
			"M1DESMARAIS/LUC       EABC123 YULFRAAC 0834 326J001A0025 100",
			"pdf417",
		);
		expect(keys(actions)).toEqual([
			"addFlight",
			"flightStatus",
			"copyBooking",
			"copy",
			"share",
		]);
		expect(find(actions, "addFlight")).toMatchObject({
			event: {
				title: "AC 834 · YUL → FRA",
				start: new Date(2026, 10, 22),
				allDay: true,
				notes: "Passenger: DESMARAIS/LUC\nBooking: ABC123\nSeat: 1A",
			},
		});
	});

	it("looks products up instead of searching the web", () => {
		const actions = plan("3017620422003", "ean13");
		expect(keys(actions)).toEqual(["lookup", "copy", "share"]);
	});

	it("offers nothing to look up for store-only codes", () => {
		expect(keys(plan("2001234567893", "ean13"))).toEqual(["copy", "share"]);
	});

	it("reminds of a GS1 expiry date", () => {
		const actions = plan("]d20103400930000120172612311012AB", "datamatrix");
		expect(keys(actions)).toEqual([
			"lookup",
			"expiryReminder",
			"copy",
			"share",
		]);
		expect(find(actions, "expiryReminder")).toMatchObject({
			event: { start: new Date(2026, 11, 31), allDay: true },
		});
	});

	it("tracks parcels", () => {
		expect(find(plan("RR123456785FR", "code128"), "track")).toMatchObject({
			url: "https://www.laposte.fr/outils/suivre-vos-envois?code=RR123456785FR",
		});
	});

	it("searches other barcodes, and acts on what plain text holds", () => {
		expect(keys(plan("ABC-123", "code128"))).toEqual([
			"search",
			"copy",
			"share",
		]);
		expect(keys(plan("Call 06 12 34 56 78 or see pizza.fr"))).toEqual([
			"open",
			"call",
			"search",
			"copy",
			"share",
		]);
		expect(keys(plan("x".repeat(200)))).toEqual(["copy", "share"]);
	});
});

describe("platform links", () => {
	it("builds maps, directions and SMS links per platform", () => {
		expect(mapUrl("ios", { lat: 1, lng: 2, label: "A B" })).toBe(
			"maps://?ll=1,2&q=A%20B",
		);
		expect(mapUrl("android", { lat: 1, lng: 2, label: "A B" })).toBe(
			"geo:1,2?q=1,2(A%20B)",
		);
		expect(mapUrl("android", { query: "Rivoli" })).toBe("geo:0,0?q=Rivoli");
		expect(directionsUrl("ios", { lat: 1, lng: 2 })).toBe(
			"maps://?daddr=1%2C2",
		);
		expect(directionsUrl("android", { query: "1 Main St" })).toBe(
			"https://www.google.com/maps/dir/?api=1&destination=1%20Main%20St",
		);
		expect(smsUrl("ios", "+1", "hi there")).toBe("sms:+1&body=hi%20there");
		expect(smsUrl("android", "+1", "hi")).toBe("sms:+1?body=hi");
		expect(whatsappUrl("0033 6 12 34 56 78")).toBe("https://wa.me/33612345678");
	});
});
