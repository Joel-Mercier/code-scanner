import {
	decodePunycode,
	digitalLinkGtin,
	displayHost,
	inspectUrl,
	opensInApp,
	splitUrl,
} from "./url";

describe("splitUrl", () => {
	it("splits a URL into its parts", () => {
		expect(splitUrl("HTTPS://user:pw@Example.com.:8080/a/b?c=1#d")).toEqual({
			scheme: "https",
			userInfo: "user:pw",
			host: "example.com",
			port: "8080",
			path: "/a/b",
			query: "c=1",
		});
		expect(splitUrl("not a url")).toBeUndefined();
	});
});

describe("punycode", () => {
	it("decodes international labels", () => {
		expect(decodePunycode("mnchen-3ya")).toBe("münchen");
		expect(decodePunycode("caf-dma")).toBe("café");
		expect(displayHost("xn--80ak6aa92e.com")).toBe("аррӏе.com");
		expect(displayHost("example.com")).toBe("example.com");
	});

	it("gives up on invalid input", () => {
		expect(decodePunycode("abc-!!")).toBeUndefined();
	});
});

describe("inspectUrl", () => {
	it("shows the host without www.", () => {
		expect(inspectUrl("https://www.example.com/menu")).toEqual({
			host: "example.com",
			warnings: [],
		});
	});

	it("flags what QR scams rely on", () => {
		expect(inspectUrl("http://example.com")?.warnings).toEqual(["insecure"]);
		expect(inspectUrl("https://xn--80ak6aa92e.com")).toEqual({
			host: "аррӏе.com",
			warnings: ["lookalike"],
		});
		expect(inspectUrl("https://paypal.com@evil.example/login")).toEqual({
			host: "evil.example",
			warnings: ["userInfo"],
		});
		expect(inspectUrl("https://192.168.1.1/pay")?.warnings).toEqual([
			"ipAddress",
		]);
		expect(inspectUrl("https://bit.ly/abc")?.warnings).toEqual(["shortener"]);
	});
});

describe("opensInApp", () => {
	it("knows links that belong to an app", () => {
		expect(opensInApp("https://www.youtube.com/watch?v=1")).toBe(true);
		expect(opensInApp("https://m.youtube.com/watch?v=1")).toBe(true);
		expect(opensInApp("https://apps.apple.com/app/id1")).toBe(true);
		expect(opensInApp("https://www.google.com/maps/place/x")).toBe(true);
		expect(opensInApp("https://www.google.com/search?q=1")).toBe(false);
		expect(opensInApp("https://example.com")).toBe(false);
	});
});

describe("digitalLinkGtin", () => {
	it("reads the GTIN of a GS1 Digital Link", () => {
		expect(digitalLinkGtin("https://id.gs1.org/01/09506000134352/10/ABC")).toBe(
			"9506000134352",
		);
		expect(digitalLinkGtin("https://brand.example/01/3017620422003")).toBe(
			"3017620422003",
		);
		expect(
			digitalLinkGtin("https://id.gs1.org/01/09506000134353"),
		).toBeUndefined();
		expect(digitalLinkGtin("https://example.com/01/abc")).toBeUndefined();
	});
});
