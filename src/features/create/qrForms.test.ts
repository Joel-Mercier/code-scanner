import { qrKinds } from "@/domain/codes/describe";
import i18n from "@/i18n";
import { type FormState, qrForms, validateQR } from "./qrForms";

afterEach(() => i18n.changeLanguage("en"));

const errorsOf = (kind: keyof typeof qrForms, state: FormState) => {
	const result = validateQR(kind, state);
	return result.ok ? {} : result.errors;
};

const payloadOf = (kind: keyof typeof qrForms, state: FormState) => {
	const result = validateQR(kind, state);
	if (!result.ok) throw new Error(JSON.stringify(result.errors));
	return result.payload;
};

describe("form definitions", () => {
	it.each(qrKinds)("%s: every field starts with a value", (kind) => {
		const { fields, initial } = qrForms[kind];
		for (const field of fields) {
			expect(initial).toHaveProperty(field.name);
		}
	});

	it.each(qrKinds)("%s: every field has a label and a placeholder", (kind) => {
		for (const field of qrForms[kind].fields) {
			expect(i18n.exists(`app.fields.${field.label}`)).toBe(true);
			if (field.type === "text" && !field.placeholder) {
				expect(i18n.exists(`app.placeholders.${field.label}`)).toBe(true);
			}
		}
	});

	it.each(qrKinds)("%s: the empty form isn't valid yet", (kind) => {
		expect(validateQR(kind, qrForms[kind].initial).ok).toBe(false);
	});
});

describe("validateQR", () => {
	it("reports the first error of each field", () => {
		const errors = errorsOf("email", { to: "not an e-mail", subject: "" });
		expect(Object.keys(errors)).toEqual(["to"]);
		expect(errors.to).toEqual(expect.any(String));
	});

	it("builds links", () => {
		expect(errorsOf("url", { url: "https://" })).toHaveProperty("url");
		expect(payloadOf("url", { url: " https://example.com " })).toBe(
			"https://example.com",
		);
	});

	it("limits text to 2000 characters", () => {
		expect(payloadOf("text", { text: "a".repeat(2000) })).toHaveLength(2000);
		expect(errorsOf("text", { text: "a".repeat(2001) })).toHaveProperty("text");
	});

	it("builds Wi-Fi, with WPA by default", () => {
		expect(
			payloadOf("wifi", {
				...qrForms.wifi.initial,
				ssid: "Home",
				password: "secret",
			}),
		).toBe("WIFI:T:WPA;S:Home;P:secret;;");
		expect(payloadOf("wifi", { ssid: "Home", password: "secret" })).toBe(
			"WIFI:T:WPA;S:Home;P:secret;;",
		);
		expect(
			errorsOf("wifi", { ssid: "Home", encryption: "WPA3" }),
		).toHaveProperty("encryption");
		expect(
			payloadOf("wifi", { ssid: "Cafe", password: "", encryption: "nopass" }),
		).toBe("WIFI:T:nopass;S:Cafe;;");
		expect(errorsOf("wifi", { ssid: "x".repeat(65) })).toHaveProperty("ssid");
	});

	it("leaves empty optional fields out", () => {
		expect(payloadOf("email", { to: "a@b.co", subject: "  ", body: "" })).toBe(
			"mailto:a@b.co",
		);
		expect(payloadOf("sms", { number: "+33 6 12", message: "" })).toBe(
			"sms:+33 6 12",
		);
	});

	it("checks phone numbers", () => {
		expect(payloadOf("phone", { number: "+33 (0)1 23-45.67" })).toBe(
			"tel:+33 (0)1 23-45.67",
		);
		expect(errorsOf("phone", { number: "call me" })).toHaveProperty("number");
		expect(errorsOf("phone", { number: "12" })).toHaveProperty("number");
	});

	it("needs a first name for contacts, and checks their e-mail and site", () => {
		const contact = { ...qrForms.vcard.initial, firstName: "Ada" };
		expect(payloadOf("vcard", contact)).toContain("N:;Ada");
		expect(errorsOf("vcard", { ...contact, email: "nope" })).toHaveProperty(
			"email",
		);
		expect(errorsOf("vcard", { ...contact, url: "nope" })).toHaveProperty(
			"url",
		);
		expect(errorsOf("vcard", { ...contact, firstName: "  " })).toHaveProperty(
			"firstName",
		);
	});

	it("builds events with an optional start", () => {
		expect(payloadOf("event", { summary: "Launch", location: "" })).toBe(
			"BEGIN:VEVENT\nSUMMARY:Launch\nEND:VEVENT",
		);
		expect(
			payloadOf("event", {
				summary: "Launch",
				start: new Date(Date.UTC(2026, 5, 1, 8, 0, 0)),
			}),
		).toContain("DTSTART:20260601T080000Z");
	});

	it("checks coordinates and reads the optional altitude", () => {
		expect(
			payloadOf("geoPoint", { lat: "48.8584", lng: "2.2945", alt: "" }),
		).toBe("geo:48.8584,2.2945");
		expect(
			payloadOf("geoPoint", { lat: "-33.9", lng: "151.2", alt: "12.5" }),
		).toBe("geo:-33.9,151.2,12.5");
		expect(errorsOf("geoPoint", { lat: "91", lng: "0" })).toHaveProperty("lat");
		expect(errorsOf("geoPoint", { lat: "0", lng: "-181" })).toHaveProperty(
			"lng",
		);
		expect(errorsOf("geoPoint", { lat: "north", lng: "0" })).toHaveProperty(
			"lat",
		);
		expect(
			errorsOf("geoPoint", { lat: "0", lng: "0", alt: "high" }),
		).toHaveProperty("alt");
	});

	it("builds an EPC payment from a checked IBAN, BIC and amount", () => {
		const base = {
			name: "Ada Lovelace",
			iban: "fr76 3000 6000 0112 3456 7890 189",
			bic: "",
			amount: "",
			message: "",
		};
		expect(payloadOf("payment", base)).toBe(
			"BCD\n002\n1\nSCT\n\nAda Lovelace\nFR7630006000011234567890189",
		);
		expect(
			payloadOf("payment", { ...base, bic: "bnpafrpp", amount: "12,5" }),
		).toBe(
			"BCD\n002\n1\nSCT\nBNPAFRPP\nAda Lovelace\nFR7630006000011234567890189\nEUR12.50",
		);
	});

	it("explains a wrong IBAN, BIC or amount, in the current language", () => {
		const base = {
			name: "Ada",
			iban: "FR7630006000011234567890189",
			bic: "",
			amount: "",
			message: "",
		};
		const ibanError = errorsOf("payment", {
			...base,
			iban: "FR7630006000011234567890188",
		}).iban;
		expect(ibanError).toBe(i18n.t("app.fields.iban_invalid"));
		expect(errorsOf("payment", { ...base, bic: "BNP" }).bic).toBe(
			i18n.t("app.create.bic_invalid"),
		);
		expect(errorsOf("payment", { ...base, amount: "12.345" }).amount).toBe(
			i18n.t("app.create.amount_invalid"),
		);
		expect(errorsOf("payment", { ...base, amount: "0" })).toHaveProperty(
			"amount",
		);
		expect(errorsOf("payment", { ...base, name: "" })).toHaveProperty("name");
		i18n.changeLanguage("fr");
		expect(errorsOf("payment", { ...base, bic: "BNP" }).bic).toBe(
			"8 ou 11 lettres et chiffres",
		);
	});
});
