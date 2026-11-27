/**
 * Where to look a code up. These are web pages opened in the browser: the
 * app itself never fetches anything.
 */
import type { BarcodeInfo } from "./barcode";

export type SearchEngine =
	| "duckduckgo"
	| "google"
	| "bing"
	| "qwant"
	| "ecosia";

export const searchEngines: SearchEngine[] = [
	"duckduckgo",
	"google",
	"bing",
	"qwant",
	"ecosia",
];

export const searchEngineNames: Record<SearchEngine, string> = {
	duckduckgo: "DuckDuckGo",
	google: "Google",
	bing: "Bing",
	qwant: "Qwant",
	ecosia: "Ecosia",
};

const SEARCH_URLS: Record<SearchEngine, string> = {
	duckduckgo: "https://duckduckgo.com/?q=",
	google: "https://www.google.com/search?q=",
	bing: "https://www.bing.com/search?q=",
	qwant: "https://www.qwant.com/?q=",
	ecosia: "https://www.ecosia.org/search?q=",
};

export const searchUrl = (engine: SearchEngine, query: string) =>
	SEARCH_URLS[engine] + encodeURIComponent(query);

export type LookupProvider =
	| "openFoodFacts"
	| "openBeautyFacts"
	| "openPetFoodFacts"
	| "openProductsFacts"
	| "googleShopping"
	| "openLibrary"
	| "googleBooks"
	| "worldcat"
	| "issnPortal"
	| "web";

export type LookupLink = { provider: LookupProvider; url: string };

export const lookupProviderNames: Record<LookupProvider, string> = {
	openFoodFacts: "Open Food Facts",
	openBeautyFacts: "Open Beauty Facts",
	openPetFoodFacts: "Open Pet Food Facts",
	openProductsFacts: "Open Products Facts",
	googleShopping: "Google Shopping",
	openLibrary: "Open Library",
	googleBooks: "Google Books",
	worldcat: "WorldCat",
	issnPortal: "ISSN Portal",
	web: "",
};

const products = (gtin: string): LookupLink[] => [
	{
		provider: "openFoodFacts",
		url: `https://world.openfoodfacts.org/product/${gtin}`,
	},
	{
		provider: "openBeautyFacts",
		url: `https://world.openbeautyfacts.org/product/${gtin}`,
	},
	{
		provider: "openPetFoodFacts",
		url: `https://world.openpetfoodfacts.org/product/${gtin}`,
	},
	{
		provider: "openProductsFacts",
		url: `https://world.openproductsfacts.org/product/${gtin}`,
	},
	{
		provider: "googleShopping",
		url: `https://www.google.com/search?tbm=shop&q=${gtin}`,
	},
];

/** Product, book or periodical pages for a barcode, then a web search. */
export const lookupLinks = (
	info: BarcodeInfo,
	engine: SearchEngine,
): LookupLink[] => {
	const web = (query: string): LookupLink => ({
		provider: "web",
		url: searchUrl(engine, query),
	});
	switch (info.type) {
		case "product":
			return [...products(info.gtin), web(info.gtin)];
		case "gs1":
			return info.gtin
				? info.medicine
					? [web(`CIP ${info.gtin}`)]
					: [...products(info.gtin), web(info.gtin)]
				: [];
		case "medicine":
			return [web(`CIP ${info.cip}`)];
		case "book":
			return [
				{
					provider: "openLibrary",
					url: `https://openlibrary.org/isbn/${info.gtin}`,
				},
				{
					provider: "googleBooks",
					url: `https://books.google.com/books?vid=ISBN${info.gtin}`,
				},
				{
					provider: "worldcat",
					url: `https://search.worldcat.org/search?q=bn:${info.gtin}`,
				},
				web(`ISBN ${info.gtin}`),
			];
		case "music":
			return [web(`ISMN ${info.ismn}`)];
		case "periodical":
			return [
				{
					provider: "issnPortal",
					url: `https://portal.issn.org/resource/ISSN/${info.issn}`,
				},
				web(`ISSN ${info.issn}`),
			];
		default:
			return [];
	}
};

/** The carrier's tracking page for a parcel number. */
export const trackingUrl = (info: Extract<BarcodeInfo, { type: "parcel" }>) => {
	switch (info.carrier) {
		case "laposte":
			return `https://www.laposte.fr/outils/suivre-vos-envois?code=${info.number}`;
		case "ups":
			return `https://www.ups.com/track?tracknum=${info.number}`;
		case "post":
			return `https://t.17track.net/en#nums=${info.number}`;
	}
};
