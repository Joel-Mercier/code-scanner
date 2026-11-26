import { format as formatWithLocale, type Locale } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import i18n from "@/i18n";

const locales: Record<string, Locale> = { en: enUS, fr };

/** date-fns `format`, in the app's current language. */
export const format = (date: Date | number, pattern: string) =>
	formatWithLocale(date, pattern, { locale: locales[i18n.language] });
