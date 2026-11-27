/** IBANs: compacting, checking (ISO 13616 mod 97) and grouping by four. */

export const compactIban = (iban: string) =>
	iban.replace(/[\s-]/g, "").toUpperCase();

/** Whether an IBAN's check digits are right. */
export const isValidIban = (iban: string) => {
	const compact = compactIban(iban);
	if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(compact)) return false;
	const rearranged = compact.slice(4) + compact.slice(0, 4);
	let remainder = 0;
	for (const char of rearranged) {
		const value = /\d/.test(char) ? char : String(char.charCodeAt(0) - 55);
		for (const digit of value) {
			remainder = (remainder * 10 + Number(digit)) % 97;
		}
	}
	return remainder === 1;
};

/** `FR76 3000 6000 0112 3456 7890 189` */
export const formatIban = (iban: string) =>
	compactIban(iban)
		.replace(/(.{4})/g, "$1 ")
		.trim();
