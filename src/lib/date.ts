import {
	formatDistanceToNow,
	format as formatWithLocale,
	type Locale,
} from "date-fns";
import { enUS, fr } from "date-fns/locale";
import i18n from "@/i18n";

const locales: Record<string, Locale> = { en: enUS, fr };

/** date-fns `format`, in the app's current language. */
export const format = (date: Date | number, pattern: string) =>
	formatWithLocale(date, pattern, { locale: locales[i18n.language] });

/** "3 hours ago" / "il y a 3 heures", in the app's current language. */
export const timeAgo = (date: Date | number) =>
	formatDistanceToNow(date, {
		addSuffix: true,
		locale: locales[i18n.language],
	});
