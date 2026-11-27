/** The flag emoji of an ISO 3166 region code (`FR` → 🇫🇷). */
export const flag = (code: string) =>
	/^[A-Z]{2}$/i.test(code)
		? String.fromCodePoint(
				...[...code.toUpperCase()].map((char) => 0x1f1a5 + char.charCodeAt(0)),
			)
		: "";

/**
 * A region's name in `locale` (`FR` → "France"), or its code where the
 * engine has no `Intl.DisplayNames`.
 */
export const regionName = (code: string, locale: string) => {
	try {
		return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
	} catch {
		return code;
	}
};

/** "🇫🇷 France" */
export const regionLabel = (code: string, locale: string) =>
	`${flag(code)} ${regionName(code, locale)}`.trim();

/** An amount in its currency (`12,50 €`), or `12.50 EUR` as a fallback. */
export const formatMoney = (
	amount: number,
	currency: string | undefined,
	locale: string,
) => {
	try {
		return new Intl.NumberFormat(locale, {
			style: "currency",
			currency: currency ?? "EUR",
		}).format(amount);
	} catch {
		return `${amount.toFixed(2)} ${currency ?? ""}`.trim();
	}
};
