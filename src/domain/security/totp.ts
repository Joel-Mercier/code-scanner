import { hmac } from "@noble/hashes/hmac.js";
import { sha1 } from "@noble/hashes/legacy.js";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** RFC 4648 base32, without padding (what authenticator apps expect). */
export const base32Encode = (bytes: Uint8Array) => {
	let bits = 0;
	let value = 0;
	let out = "";
	for (const byte of bytes) {
		value = (value << 8) | byte;
		bits += 8;
		while (bits >= 5) {
			out += ALPHABET[(value >>> (bits - 5)) & 31];
			bits -= 5;
		}
	}
	if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
	return out;
};

/** Reads base32, ignoring case, spaces and padding; throws on other letters. */
export const base32Decode = (text: string) => {
	const clean = text.toUpperCase().replace(/[\s=]/g, "");
	const out: number[] = [];
	let bits = 0;
	let value = 0;
	for (const char of clean) {
		const index = ALPHABET.indexOf(char);
		if (index < 0) throw new Error(`Not base32: ${char}`);
		value = ((value << 5) | index) & 0xffff;
		bits += 5;
		if (bits >= 8) {
			out.push((value >>> (bits - 8)) & 0xff);
			bits -= 8;
		}
	}
	return Uint8Array.from(out);
};

/** RFC 4226: the `digits`-long code for `counter`. */
export const hotp = (key: Uint8Array, counter: number, digits = 6) => {
	const message = new Uint8Array(8);
	let rest = counter;
	for (let i = 7; i >= 0; i--) {
		message[i] = rest % 256;
		rest = Math.floor(rest / 256);
	}
	const mac = hmac(sha1, key, message);
	const offset = mac[mac.length - 1] & 0xf;
	const binary =
		((mac[offset] & 0x7f) << 24) |
		(mac[offset + 1] << 16) |
		(mac[offset + 2] << 8) |
		mac[offset + 3];
	return String(binary % 10 ** digits).padStart(digits, "0");
};

/** Codes renew every this many seconds (what every authenticator assumes). */
export const TOTP_PERIOD = 30;
export const TOTP_DIGITS = 6;

/** RFC 6238: the code at `time` (ms since the epoch). */
export const totp = (key: Uint8Array, time: number) =>
	hotp(key, Math.floor(time / 1000 / TOTP_PERIOD), TOTP_DIGITS);

/**
 * Whether `code` is the one at `time`, or the one just before or after it
 * (the phone's and the authenticator's clocks rarely agree to the second).
 */
export const verifyTotp = (key: Uint8Array, code: string, time: number) => {
	const typed = code.replace(/\s/g, "");
	if (!/^\d{6}$/.test(typed)) return false;
	const step = Math.floor(time / 1000 / TOTP_PERIOD);
	let match = false;
	for (const drift of [-1, 0, 1]) {
		// No early return: every candidate costs the same.
		if (hotp(key, step + drift, TOTP_DIGITS) === typed) match = true;
	}
	return match;
};

/** What an authenticator app scans to add the account. */
export const otpauthUri = ({
	secret,
	issuer,
	account,
}: {
	secret: string;
	issuer: string;
	account: string;
}) => {
	const label = encodeURIComponent(`${issuer}:${account}`);
	// Built by hand: React Native's URLSearchParams is incomplete.
	const params = Object.entries({
		secret,
		issuer,
		algorithm: "SHA1",
		digits: String(TOTP_DIGITS),
		period: String(TOTP_PERIOD),
	})
		.map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
		.join("&");
	return `otpauth://totp/${label}?${params}`;
};

/** "JBSW Y3DP EHPK 3PXP": a secret in groups of four, to type by hand. */
export const groupSecret = (secret: string) =>
	secret.match(/.{1,4}/g)?.join(" ") ?? secret;
