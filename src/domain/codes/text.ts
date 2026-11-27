/** Finds things to act on inside free text: a link, an e-mail, a phone number, an IBAN. */
import { compactIban, isValidIban } from "./iban";

export type TextFindings = {
	url?: string;
	email?: string;
	phone?: string;
	iban?: string;
};

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)*\.[A-Z]{2,}/i;
const LINK = /\b(?:https?:\/\/|www\.)[^\s<>"]+/i;
/** Bare domains with a common TLD, so `notes.txt` stays text. */
const DOMAIN =
	/\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:com|fr|org|net|io|eu|be|ch|ca|de|es|it|uk|co|app|dev|info|me|tv|shop|store|online|site|link|page|gouv\.fr)\b(?:\/[^\s<>"]*)?/i;
const PHONE = /(?:\+|\b00)\d[\d\s.()-]{6,16}\d|\b0[1-9](?:[\s.-]?\d{2}){4}\b/;
const IBAN = /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){2,7}(?:\s?[A-Z0-9]{1,4})?\b/;

/** Drops sentence punctuation that a link can't end with. */
const trimLink = (link: string) => link.replace(/[.,;:!?)\]}'"»]+$/, "");

export const detectInText = (text: string): TextFindings => {
	const findings: TextFindings = {};
	const email = text.match(EMAIL)?.[0];
	if (email) findings.email = email;
	// Keep the e-mail's domain from being read as a link.
	const rest = email ? text.replace(email, " ") : text;
	const link = rest.match(LINK)?.[0] ?? rest.match(DOMAIN)?.[0];
	if (link) {
		const url = trimLink(link);
		findings.url = /^https?:\/\//i.test(url) ? url : `https://${url}`;
	}
	const iban = text.toUpperCase().match(IBAN)?.[0];
	if (iban && isValidIban(iban)) findings.iban = compactIban(iban);
	const withoutIban = iban ? text.toUpperCase().replace(iban, " ") : text;
	const phone = withoutIban.match(PHONE)?.[0];
	if (phone) findings.phone = phone.replace(/[\s.()-]/g, "");
	return findings;
};
