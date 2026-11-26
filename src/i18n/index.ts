import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as z from "zod";
import zodEn from "zod/v4/locales/en.js";
import zodFr from "zod/v4/locales/fr.js";
import en from "./locales/en";
import fr from "./locales/fr";

const resources = { en, fr };

export type Locale = keyof typeof resources;
export const supportedLocales = Object.keys(resources) as Locale[];

/** Zod's own messages (form validation), in the same language. */
const zodLocales = {
	en: zodEn,
	fr: zodFr,
} satisfies Record<Locale, () => { localeError: unknown }>;

/** Switches the UI and the validation messages to `locale`. */
export function applyLocale(locale: Locale) {
	i18n.changeLanguage(locale);
	z.config(zodLocales[locale]());
}

/** The first of the device's languages the app speaks, else English. */
export function detectLocale(): Locale {
	const match = getLocales().find(
		(locale) =>
			locale.languageCode &&
			(supportedLocales as string[]).includes(locale.languageCode),
	);
	return (match?.languageCode as Locale | undefined) ?? "en";
}

i18n.use(initReactI18next).init({
	fallbackLng: "en",
	resources,
	// Logs every lookup: noisy, and useless in tests.
	debug: __DEV__ && process.env.NODE_ENV !== "test",
	// The stored (or detected) language is applied by the root layout.
	lng: "en",
	supportedLngs: supportedLocales,
	interpolation: {
		// React already escapes rendered strings.
		escapeValue: false,
	},
});

export default i18n;
