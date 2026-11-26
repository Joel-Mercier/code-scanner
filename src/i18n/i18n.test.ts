import { getLocales } from "expo-localization";
import * as z from "zod";
import i18n, { applyLocale, detectLocale } from "./index";
import en from "./locales/en";
import fr from "./locales/fr";

jest.mock("expo-localization", () => ({ getLocales: jest.fn(() => []) }));

type Tree = { [key: string]: unknown };

/** Every leaf of a translation tree, as `a.b.c` → value. */
const leaves = (tree: unknown, path = ""): [string, unknown][] =>
	tree && typeof tree === "object" && !Array.isArray(tree)
		? Object.entries(tree as Tree).flatMap(([key, value]) =>
				leaves(value, path ? `${path}.${key}` : key),
			)
		: [[path, tree]];

const PLURAL = /_(zero|one|two|few|many|other)$/;
/** Keys without plural suffixes: languages have different plural forms. */
const keysOf = (tree: unknown) =>
	new Set(leaves(tree).map(([key]) => key.replace(PLURAL, "")));
const placeholders = (value: unknown) =>
	(JSON.stringify(value).match(/{{\s*\w+\s*}}/g) ?? []).sort();

afterEach(() => applyLocale("en"));

describe("translations", () => {
	const enLeaves = new Map(leaves(en.translation));
	const frLeaves = new Map(leaves(fr.translation));

	it("have the same keys in English and French", () => {
		const enKeys = keysOf(en.translation);
		const frKeys = keysOf(fr.translation);
		expect([...enKeys].filter((key) => !frKeys.has(key))).toEqual([]);
		expect([...frKeys].filter((key) => !enKeys.has(key))).toEqual([]);
	});

	it("use the same placeholders in both languages", () => {
		const mismatches = [...enLeaves]
			.filter(([key]) => frLeaves.has(key))
			.filter(
				([key, value]) =>
					placeholders(value).join() !== placeholders(frLeaves.get(key)).join(),
			)
			.map(([key]) => key);
		expect(mismatches).toEqual([]);
	});

	it("have no empty strings", () => {
		const empty = [...enLeaves, ...frLeaves]
			.filter(([, value]) => value === "")
			.map(([key]) => key);
		expect(empty).toEqual([]);
	});

	it("list as many help questions and privacy sections in both languages", () => {
		for (const key of ["app.help.items", "app.privacy.sections"]) {
			const enList = enLeaves.get(key) as unknown[];
			const frList = frLeaves.get(key) as unknown[];
			expect(Array.isArray(enList)).toBe(true);
			expect(frList).toHaveLength(enList.length);
		}
	});
});

describe("detectLocale", () => {
	const mockLocales = (...codes: (string | null)[]) =>
		jest
			.mocked(getLocales)
			.mockReturnValue(
				codes.map((languageCode) => ({ languageCode })) as never,
			);

	it("picks the first device language the app speaks", () => {
		mockLocales("de", "fr", "en");
		expect(detectLocale()).toBe("fr");
	});

	it("falls back to English", () => {
		mockLocales("de", null);
		expect(detectLocale()).toBe("en");
		mockLocales();
		expect(detectLocale()).toBe("en");
	});
});

describe("applyLocale", () => {
	it("switches the UI and the validation messages", () => {
		const message = () =>
			z.string().min(1).safeParse("").error?.issues[0].message;
		const english = message();

		applyLocale("fr");
		expect(i18n.language).toBe("fr");
		expect(i18n.t("app.common.cancel")).toBe(fr.translation.app.common.cancel);
		expect(message()).not.toBe(english);

		applyLocale("en");
		expect(i18n.language).toBe("en");
		expect(message()).toBe(english);
	});
});
