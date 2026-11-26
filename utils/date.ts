import { format as _format, type Locale } from "date-fns";
import { enUS as en, fr } from "date-fns/locale";
import i18n from "@/config/i18n";

const locales: Record<string, Locale> = {
	en,
	fr,
};
export const format = (date: Date | number, formatString: string) => {
	return _format(date, formatString, {
		locale: locales[i18n.language],
	});
};
