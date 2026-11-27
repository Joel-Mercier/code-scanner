import { lookupLinks, searchUrl, trackingUrl } from "./lookup";

describe("searchUrl", () => {
	it("encodes the query for each engine", () => {
		expect(searchUrl("duckduckgo", "a b&c")).toBe(
			"https://duckduckgo.com/?q=a%20b%26c",
		);
		expect(searchUrl("qwant", "x")).toBe("https://www.qwant.com/?q=x");
	});
});

describe("lookupLinks", () => {
	const providers = (links: { provider: string }[]) =>
		links.map((link) => link.provider);

	it("offers the open product databases for products", () => {
		const links = lookupLinks(
			{ type: "product", gtin: "3017620422003", region: "FR" },
			"google",
		);
		expect(providers(links)).toEqual([
			"openFoodFacts",
			"openBeautyFacts",
			"openPetFoodFacts",
			"openProductsFacts",
			"googleShopping",
			"web",
		]);
		expect(links[0].url).toBe(
			"https://world.openfoodfacts.org/product/3017620422003",
		);
		expect(links.at(-1)?.url).toBe(
			"https://www.google.com/search?q=3017620422003",
		);
	});

	it("offers libraries for books and the ISSN portal for periodicals", () => {
		expect(
			providers(lookupLinks({ type: "book", gtin: "9782070612758" }, "bing")),
		).toEqual(["openLibrary", "googleBooks", "worldcat", "web"]);
		expect(
			lookupLinks(
				{ type: "periodical", gtin: "9770317847001", issn: "0317-8471" },
				"bing",
			)[0].url,
		).toBe("https://portal.issn.org/resource/ISSN/0317-8471");
	});

	it("searches medicines by CIP and offers nothing for store codes", () => {
		expect(
			providers(
				lookupLinks(
					{ type: "medicine", gtin: "3400930000120", cip: "3400930000120" },
					"ecosia",
				),
			),
		).toEqual(["web"]);
		expect(
			lookupLinks({ type: "store", gtin: "2001234567893" }, "ecosia"),
		).toEqual([]);
	});
});

describe("trackingUrl", () => {
	it("opens the carrier's page", () => {
		expect(
			trackingUrl({ type: "parcel", number: "6A1", carrier: "laposte" }),
		).toBe("https://www.laposte.fr/outils/suivre-vos-envois?code=6A1");
		expect(trackingUrl({ type: "parcel", number: "1Z", carrier: "ups" })).toBe(
			"https://www.ups.com/track?tracknum=1Z",
		);
	});
});
