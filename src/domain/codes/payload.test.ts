import {
	buildPayload,
	describeCode,
	type ParsedCode,
	parseCode,
	type QRFormValues,
	type QRKind,
} from "./payload";

describe("parseCode", () => {
	describe("links", () => {
		it("keeps http(s) URLs as they are", () => {
			expect(parseCode("https://example.com/a?b=1")).toEqual({
				kind: "url",
				url: "https://example.com/a?b=1",
			});
			expect(parseCode("HTTP://EXAMPLE.COM")).toEqual({
				kind: "url",
				url: "HTTP://EXAMPLE.COM",
			});
		});

		it("adds https:// to bare www. addresses", () => {
			expect(parseCode("www.example.com")).toEqual({
				kind: "url",
				url: "https://www.example.com",
			});
		});

		it("trims surrounding whitespace", () => {
			expect(parseCode("  https://example.com \n")).toEqual({
				kind: "url",
				url: "https://example.com",
			});
		});
	});

	describe("e-mail", () => {
		it("reads mailto: with a decoded subject and body", () => {
			expect(
				parseCode("mailto:ada@example.com?subject=Hi%20there&body=Line+1"),
			).toEqual({
				kind: "email",
				to: "ada@example.com",
				subject: "Hi there",
				body: "Line 1",
			});
		});

		it("reads mailto: without a query", () => {
			expect(parseCode("MAILTO:ada@example.com")).toEqual({
				kind: "email",
				to: "ada@example.com",
				subject: undefined,
				body: undefined,
			});
		});

		it("keeps malformed percent escapes as they are", () => {
			expect(parseCode("mailto:a@b.c?subject=100%")).toMatchObject({
				subject: "100%",
			});
		});

		it("reads MATMSG", () => {
			expect(
				parseCode("MATMSG:TO:ada@example.com;SUB:Hello;BODY:A\\;B;;"),
			).toEqual({
				kind: "email",
				to: "ada@example.com",
				subject: "Hello",
				body: "A;B",
			});
		});
	});

	describe("phone and SMS", () => {
		it("reads tel:", () => {
			expect(parseCode("tel:+33 1 23 45")).toEqual({
				kind: "phone",
				number: "+33 1 23 45",
			});
		});

		it("reads SMSTO:, keeping colons in the message", () => {
			expect(parseCode("SMSTO:+331:see you at 8:30")).toEqual({
				kind: "sms",
				number: "+331",
				message: "see you at 8:30",
			});
			expect(parseCode("smsto:+331")).toEqual({
				kind: "sms",
				number: "+331",
				message: undefined,
			});
		});

		it("reads sms: with a body", () => {
			expect(parseCode("sms:+331?body=On%20my%20way%21")).toEqual({
				kind: "sms",
				number: "+331",
				message: "On my way!",
			});
		});
	});

	describe("Wi-Fi", () => {
		it("reads every field and unescapes values", () => {
			expect(
				parseCode("WIFI:T:WPA2;S:My\\;Net;P:pa\\:ss\\\\;H:true;;"),
			).toEqual({
				kind: "wifi",
				ssid: "My;Net",
				password: "pa:ss\\",
				encryption: "WPA",
				hidden: true,
			});
		});

		it("treats a missing or unknown type as an open network", () => {
			expect(parseCode("WIFI:S:Cafe;;")).toEqual({
				kind: "wifi",
				ssid: "Cafe",
				password: undefined,
				encryption: "nopass",
				hidden: false,
			});
		});

		it("recognises WEP", () => {
			expect(parseCode("WIFI:T:WEP;S:Old;P:12345;;")).toMatchObject({
				encryption: "WEP",
				password: "12345",
			});
		});

		it("recognises WPA3 (SAE), as Android shares it", () => {
			expect(
				parseCode("WIFI:S:Home;T:SAE;P:secret123;H:false;;"),
			).toMatchObject({ encryption: "SAE", password: "secret123" });
		});

		it("recognises WPA2-Enterprise and keeps the identity", () => {
			expect(
				parseCode("WIFI:T:WPA2-EAP;S:Corp;E:PEAP;PH2:MSCHAPV2;I:ada;P:pw;;"),
			).toMatchObject({
				encryption: "EAP",
				eap: { method: "PEAP", identity: "ada", phase2: "MSCHAPV2" },
			});
		});
	});

	describe("contacts", () => {
		it("reads a vCard", () => {
			const vcard = [
				"BEGIN:VCARD",
				"VERSION:3.0",
				"N:Lovelace;Ada",
				"FN:Ada Lovelace",
				"ORG:Analytical\\, Engines;;",
				"TITLE:Mathematician",
				"TEL;TYPE=CELL:+44 20",
				"EMAIL:ada@example.com",
				"URL:https://ada.example",
				"ADR;TYPE=HOME:;;12 St James's Square;London;;",
				"END:VCARD",
			].join("\r\n");
			expect(parseCode(vcard)).toEqual({
				kind: "vcard",
				firstName: "Ada",
				lastName: "Lovelace",
				organization: "Analytical, Engines",
				title: "Mathematician",
				phones: ["+44 20"],
				emails: ["ada@example.com"],
				url: "https://ada.example",
				address: "12 St James's Square, London",
			});
		});

		it("falls back to the full name when there is no structured name", () => {
			expect(parseCode("BEGIN:VCARD\nFN:Prince\nEND:VCARD")).toMatchObject({
				firstName: "Prince",
				lastName: undefined,
			});
		});

		it("unfolds folded lines and keeps every phone number", () => {
			expect(
				parseCode(
					"BEGIN:VCARD\nN:Hopper;Grace\nTEL:+1 555\nitem1.TEL:+1 666\nTITLE:Rear\n  Admiral\nEND:VCARD",
				),
			).toMatchObject({ phones: ["+1 555", "+1 666"], title: "Rear Admiral" });
		});

		it("decodes vCard 2.1 quoted-printable values", () => {
			expect(
				parseCode(
					[
						"BEGIN:VCARD",
						"VERSION:2.1",
						"N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:M=C3=BCller;Ren=C3=A9",
						"ADR;QUOTED-PRINTABLE:;;1 rue de la Pai=",
						"x;Paris;;",
						"ORG;ENCODING=QUOTED-PRINTABLE;CHARSET=ISO-8859-1:Caf=E9",
						"END:VCARD",
					].join("\r\n"),
				),
			).toMatchObject({
				firstName: "René",
				lastName: "Müller",
				address: "1 rue de la Paix, Paris",
				organization: "Café",
			});
		});

		it("keeps escaped separators inside names, organisations and addresses", () => {
			expect(
				parseCode(
					[
						"BEGIN:VCARD",
						String.raw`N:Smith\;Jones;Mary\, Ann`,
						String.raw`ORG:Acme\; Co;Sales`,
						String.raw`ADR:;;1 Main St\, Apt 2;Town\;ville;;`,
						"END:VCARD",
					].join("\n"),
				),
			).toMatchObject({
				firstName: "Mary, Ann",
				lastName: "Smith;Jones",
				organization: "Acme; Co, Sales",
				address: "1 Main St, Apt 2, Town;ville",
			});
		});

		it("reads an escaped backslash before an n as a backslash", () => {
			expect(
				parseCode("BEGIN:VCARD\nN:Doe;J\nTITLE:C:\\\\new\\nline\nEND:VCARD"),
			).toMatchObject({ title: "C:\\new\nline" });
		});

		it("reads a MECARD", () => {
			expect(
				parseCode("MECARD:N:Lovelace,Ada;TEL:+44 20;EMAIL:ada@example.com;;"),
			).toEqual({
				kind: "vcard",
				firstName: "Ada",
				lastName: "Lovelace",
				organization: undefined,
				phones: ["+44 20"],
				emails: ["ada@example.com"],
				url: undefined,
				address: undefined,
			});
		});
	});

	it("keeps an escaped comma inside a MECARD name, and unescapes the rest", () => {
		expect(
			parseCode(
				String.raw`MECARD:N:Doe\, Jr,John;ORG:Acme\; Co;ADR:1 Main St\, Apt 2;;`,
			),
		).toMatchObject({
			kind: "vcard",
			firstName: "John",
			lastName: "Doe, Jr",
			organization: "Acme; Co",
			address: "1 Main St, Apt 2",
		});
	});

	describe("events", () => {
		it("reads a VEVENT with UTC dates", () => {
			const event = parseCode(
				"BEGIN:VEVENT\nSUMMARY:Launch\nDESCRIPTION:Line 1\\nLine 2\nLOCATION:Hall\\, B\nDTSTART:20261224T190000Z\nDTEND:20261224T2300Z\nEND:VEVENT",
			);
			expect(event).toEqual({
				kind: "event",
				summary: "Launch",
				description: "Line 1\nLine 2",
				location: "Hall, B",
				start: new Date(Date.UTC(2026, 11, 24, 19, 0, 0)),
				end: new Date(Date.UTC(2026, 11, 24, 23, 0, 0)),
				allDay: false,
			});
		});

		it("reads local and all-day dates in the device's time zone", () => {
			const event = parseCode(
				"BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART:20260105\nDTEND:20260105T093000\nEND:VEVENT\nEND:VCALENDAR",
			);
			expect(event).toMatchObject({
				start: new Date(2026, 0, 5),
				end: new Date(2026, 0, 5, 9, 30, 0),
				allDay: true,
			});
		});

		it("reads times in their TZID time zone", () => {
			expect(
				parseCode(
					"BEGIN:VEVENT\nDTSTART;TZID=America/New_York:20260704T090000\nDTEND;TZID=Europe/Paris:20261225T180000\nEND:VEVENT",
				),
			).toMatchObject({
				start: new Date(Date.UTC(2026, 6, 4, 13, 0, 0)),
				end: new Date(Date.UTC(2026, 11, 25, 17, 0, 0)),
				allDay: false,
			});
		});

		it("falls back to the device's time zone for an unknown TZID", () => {
			expect(
				parseCode(
					"BEGIN:VEVENT\nDTSTART;TZID=Nowhere/Land:20260704T090000\nEND:VEVENT",
				),
			).toMatchObject({ start: new Date(2026, 6, 4, 9, 0, 0) });
		});

		it("reads VALUE=DATE as all-day", () => {
			expect(
				parseCode("BEGIN:VEVENT\nDTSTART;VALUE=DATE:20260105\nEND:VEVENT"),
			).toMatchObject({ allDay: true });
		});

		it("falls back to Date parsing, and drops dates it can't read", () => {
			const event = parseCode(
				"BEGIN:VEVENT\nDTSTART:2026-01-05T10:00:00Z\nDTEND:someday\nEND:VEVENT",
			) as Extract<ParsedCode, { kind: "event" }>;
			expect(event.start?.toISOString()).toBe("2026-01-05T10:00:00.000Z");
			expect(event.end).toBeUndefined();
		});
	});

	describe("locations", () => {
		it("reads geo: with an optional altitude and query", () => {
			expect(parseCode("geo:48.8584,2.2945")).toEqual({
				kind: "geoPoint",
				lat: 48.8584,
				lng: 2.2945,
				alt: undefined,
			});
			expect(parseCode("GEO:48.8584,2.2945,330?q=Eiffel")).toEqual({
				kind: "geoPoint",
				lat: 48.8584,
				lng: 2.2945,
				alt: 330,
				query: "Eiffel",
			});
		});

		it("reads a place search at 0,0", () => {
			expect(parseCode("geo:0,0?q=1+rue+de+Rivoli,+Paris")).toEqual({
				kind: "geoPoint",
				lat: 0,
				lng: 0,
				alt: undefined,
				query: "1 rue de Rivoli, Paris",
			});
		});

		it("reads Android's point-and-label query", () => {
			expect(parseCode("geo:0,0?q=48.8584,2.2945(Eiffel Tower)")).toEqual({
				kind: "geoPoint",
				lat: 48.8584,
				lng: 2.2945,
				alt: undefined,
				query: "Eiffel Tower",
			});
		});

		it("ignores geo: URI parameters", () => {
			expect(parseCode("geo:48.85,2.29;u=35")).toMatchObject({
				lat: 48.85,
				lng: 2.29,
			});
		});

		it("treats an unreadable geo: as text", () => {
			expect(parseCode("geo:north,pole")).toEqual({
				kind: "text",
				text: "geo:north,pole",
			});
		});
	});

	it("treats anything else as text", () => {
		expect(parseCode("Hello, world")).toEqual({
			kind: "text",
			text: "Hello, world",
		});
		expect(parseCode("")).toEqual({ kind: "text", text: "" });
	});
});

describe("buildPayload", () => {
	it("builds links, text and phone numbers", () => {
		expect(buildPayload("url", { url: " https://example.com " })).toBe(
			"https://example.com",
		);
		expect(buildPayload("text", { text: " as typed " })).toBe(" as typed ");
		expect(buildPayload("phone", { number: " +33 1 " })).toBe("tel:+33 1");
	});

	it("builds sms: with an encoded body only when there is one", () => {
		expect(buildPayload("sms", { number: "+331", message: "Hi there" })).toBe(
			"sms:+331?body=Hi%20there",
		);
		expect(buildPayload("sms", { number: "+331" })).toBe("sms:+331");
	});

	it("builds mailto: with only the fields that are set", () => {
		expect(
			buildPayload("email", { to: "a@b.c", subject: "Hi & bye", body: "" }),
		).toBe("mailto:a@b.c?subject=Hi%20%26%20bye");
		expect(buildPayload("email", { to: " a@b.c " })).toBe("mailto:a@b.c");
	});

	it("builds Wi-Fi with escaped values", () => {
		expect(
			buildPayload("wifi", {
				ssid: 'My;"Net"',
				password: "a:b,c",
				encryption: "WPA",
				hidden: true,
			}),
		).toBe('WIFI:T:WPA;S:My\\;\\"Net\\";P:a\\:b\\,c;H:true;;');
	});

	it("leaves the password out of open networks", () => {
		expect(
			buildPayload("wifi", {
				ssid: "Cafe",
				password: "ignored",
				encryption: "nopass",
			}),
		).toBe("WIFI:T:nopass;S:Cafe;;");
	});

	it("builds a vCard with only the fields that are set", () => {
		expect(
			buildPayload("vcard", {
				firstName: "Ada",
				lastName: "Lovelace",
				organization: "Engines; Ltd",
				phone: "+44 20",
			}),
		).toBe(
			[
				"BEGIN:VCARD",
				"VERSION:3.0",
				"N:Lovelace;Ada",
				"FN:Ada Lovelace",
				"ORG:Engines\\; Ltd",
				"TEL;TYPE=CELL:+44 20",
				"END:VCARD",
			].join("\n"),
		);
	});

	it("builds a VEVENT with a UTC start date", () => {
		expect(
			buildPayload("event", {
				summary: "Launch, party",
				start: new Date(Date.UTC(2026, 11, 24, 19, 0, 0)),
			}),
		).toBe(
			"BEGIN:VEVENT\nSUMMARY:Launch\\, party\nDTSTART:20261224T190000Z\nEND:VEVENT",
		);
	});

	it("builds geo: with an optional altitude", () => {
		expect(buildPayload("geoPoint", { lat: 48.85, lng: 2.29 })).toBe(
			"geo:48.85,2.29",
		);
		expect(buildPayload("geoPoint", { lat: 48.85, lng: 2.29, alt: 0 })).toBe(
			"geo:48.85,2.29,0",
		);
	});
});

describe("buildPayload: EPC payments", () => {
	it("writes an EPC v002 transfer, leaving out empty trailing fields", () => {
		expect(
			buildPayload("payment", {
				name: "Ada Lovelace",
				iban: "FR76 3000 6000 0112 3456 7890 189",
			}),
		).toBe("BCD\n002\n1\nSCT\n\nAda Lovelace\nFR7630006000011234567890189");
	});

	it("writes the amount in euros with two decimals, and the message last", () => {
		expect(
			buildPayload("payment", {
				name: "Ada",
				iban: "FR7630006000011234567890189",
				amount: 5,
				message: "Line one\nline two",
			}).split("\n"),
		).toEqual([
			"BCD",
			"002",
			"1",
			"SCT",
			"",
			"Ada",
			"FR7630006000011234567890189",
			"EUR5.00",
			"",
			"",
			"Line one line two",
		]);
	});
});

describe("buildPayload → parseCode round trip", () => {
	const cases: { [K in QRKind]: [QRFormValues[K], Partial<ParsedCode>] } = {
		url: [{ url: "https://example.com/x" }, { url: "https://example.com/x" }],
		text: [{ text: "Plain; text: here" }, { text: "Plain; text: here" }],
		phone: [{ number: "+33123456789" }, { number: "+33123456789" }],
		sms: [
			{ number: "+331", message: "Café à 8h?" },
			{ number: "+331", message: "Café à 8h?" },
		],
		email: [
			{ to: "ada@example.com", subject: "Q&A", body: "Line 1\nLine 2" },
			{ to: "ada@example.com", subject: "Q&A", body: "Line 1\nLine 2" },
		],
		wifi: [
			{ ssid: "Net;work", password: 'p:a"ss', encryption: "WEP", hidden: true },
			{ ssid: "Net;work", password: 'p:a"ss', encryption: "WEP", hidden: true },
		],
		vcard: [
			{
				firstName: "Ada; Augusta",
				lastName: "King, Lovelace",
				organization: "Engines; Ltd",
				title: "Countess",
				phone: "+44 20",
				email: "ada@example.com",
				url: "https://ada.example",
				address: "12 Square; London",
			},
			{
				firstName: "Ada; Augusta",
				lastName: "King, Lovelace",
				organization: "Engines; Ltd",
				title: "Countess",
				phones: ["+44 20"],
				emails: ["ada@example.com"],
				url: "https://ada.example",
				address: "12 Square; London",
			},
		],
		event: [
			{
				summary: "Launch; party",
				description: "Bring\nfriends",
				location: "Hall, B",
				start: new Date(Date.UTC(2026, 0, 2, 3, 4, 5)),
			},
			{
				summary: "Launch; party",
				description: "Bring\nfriends",
				location: "Hall, B",
				start: new Date(Date.UTC(2026, 0, 2, 3, 4, 5)),
			},
		],
		geoPoint: [
			{ lat: -33.8568, lng: 151.2153, alt: 12 },
			{ lat: -33.8568, lng: 151.2153, alt: 12 },
		],
		payment: [
			{
				name: "Ada Lovelace",
				iban: "FR76 3000 6000 0112 3456 7890 189",
				bic: "bnpafrpp",
				amount: 12.5,
				message: "Invoice 42",
			},
			{
				standard: "epc",
				name: "Ada Lovelace",
				iban: "FR7630006000011234567890189",
				bic: "BNPAFRPP",
				amount: 12.5,
				currency: "EUR",
				message: "Invoice 42",
			},
		],
	};

	it.each(Object.keys(cases) as QRKind[])("%s", (kind) => {
		const [values, expected] = cases[kind];
		const parsed = parseCode(
			buildPayload(kind, values as QRFormValues[typeof kind]),
		);
		expect(parsed.kind).toBe(kind);
		expect(parsed).toMatchObject(expected);
	});
});

describe("describeCode", () => {
	it("shortens links", () => {
		expect(describeCode({ kind: "url", url: "https://example.com/" })).toBe(
			"example.com",
		);
		expect(describeCode({ kind: "url", url: "http://example.com/a/" })).toBe(
			"example.com/a",
		);
	});

	it("names contacts by name, then organisation, then e-mail", () => {
		expect(
			describeCode({ kind: "vcard", firstName: "Ada", lastName: "Lovelace" }),
		).toBe("Ada Lovelace");
		expect(describeCode({ kind: "vcard", organization: "Acme" })).toBe("Acme");
		expect(describeCode({ kind: "vcard", emails: ["a@b.c"] })).toBe("a@b.c");
		expect(describeCode({ kind: "vcard" })).toBe("");
	});

	it("summarises every other kind by its main field", () => {
		expect(describeCode({ kind: "text", text: "hi" })).toBe("hi");
		expect(describeCode({ kind: "email", to: "a@b.c" })).toBe("a@b.c");
		expect(describeCode({ kind: "phone", number: "+1" })).toBe("+1");
		expect(describeCode({ kind: "sms", number: "+2" })).toBe("+2");
		expect(
			describeCode({
				kind: "wifi",
				ssid: "Home",
				encryption: "WPA",
				hidden: false,
			}),
		).toBe("Home");
		expect(describeCode({ kind: "event", summary: "Launch" })).toBe("Launch");
		expect(describeCode({ kind: "event" })).toBe("");
		expect(
			describeCode({ kind: "geoPoint", lat: 48.858_37, lng: 2.294_481 }),
		).toBe("48.85837, 2.29448");
	});
});

describe("parseCode, legacy and app formats", () => {
	it("reads MEBKM bookmarks and URLTO links", () => {
		expect(parseCode("MEBKM:TITLE:Menu;URL:example.com/menu;;")).toEqual({
			kind: "url",
			url: "https://example.com/menu",
		});
		expect(parseCode("URLTO:http://example.com")).toEqual({
			kind: "url",
			url: "http://example.com",
		});
	});

	it("reads BIZCARD contacts", () => {
		expect(
			parseCode(
				"BIZCARD:N:Sean;X:Owen;T:Engineer;C:Acme;A:1 Main St;B:+1 212;M:+1 646;E:s@example.com;;",
			),
		).toEqual({
			kind: "vcard",
			firstName: "Sean",
			lastName: "Owen",
			title: "Engineer",
			organization: "Acme",
			address: "1 Main St",
			phones: ["+1 212", "+1 646"],
			emails: ["s@example.com"],
		});
	});

	it("reads 2FA setup links", () => {
		expect(
			parseCode(
				"otpauth://totp/ACME%20Co:ada@example.com?secret=jbsw y3dp&issuer=ACME%20Co&digits=6&period=30&algorithm=sha1",
			),
		).toEqual({
			kind: "otp",
			type: "totp",
			issuer: "ACME Co",
			account: "ada@example.com",
			secret: "JBSWY3DP",
			algorithm: "SHA1",
			digits: 6,
			period: 30,
			uri: "otpauth://totp/ACME%20Co:ada@example.com?secret=jbsw y3dp&issuer=ACME%20Co&digits=6&period=30&algorithm=sha1",
		});
	});

	it("reads other app links, but never dangerous schemes or plain text", () => {
		expect(
			parseCode("bitcoin:1BoatSLRHtKNngkdXEeobR76b53LETtpyT?amount=1"),
		).toEqual({
			kind: "app",
			uri: "bitcoin:1BoatSLRHtKNngkdXEeobR76b53LETtpyT?amount=1",
			scheme: "bitcoin",
		});
		expect(parseCode("spotify://track/123")).toMatchObject({ kind: "app" });
		expect(parseCode("javascript://alert(1)")).toMatchObject({ kind: "text" });
		expect(parseCode("Note:buy-milk")).toMatchObject({ kind: "text" });
		expect(parseCode("Note: buy milk")).toMatchObject({ kind: "text" });
	});

	it("summarises the scan-only kinds", () => {
		expect(
			describeCode({
				kind: "otp",
				type: "totp",
				issuer: "ACME",
				account: "ada",
				uri: "otpauth://totp/ada",
			}),
		).toBe("ACME · ada");
		expect(
			describeCode({ kind: "geoPoint", lat: 0, lng: 0, query: "Paris" }),
		).toBe("Paris");
		expect(describeCode({ kind: "app", uri: "tg://x", scheme: "tg" })).toBe(
			"tg://x",
		);
	});
});
