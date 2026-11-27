import { bytesToHex, hexToBytes, utf8ToBytes } from "@noble/hashes/utils.js";

/** A password as kept: never the password itself, its salted PBKDF2 hash. */
export type PasswordRecord = {
	salt: string;
	hash: string;
	iterations: number;
};

/**
 * Slow enough to make guessing costly: about a tenth of a second natively.
 * In JavaScript on a phone it would take many seconds, so it is only ever
 * derived natively (services/lock, `modules/pbkdf2`).
 */
export const PASSWORD_ITERATIONS = 100_000;
export const PASSWORD_MIN_LENGTH = 4;
/** Bytes of a derived key (one SHA-256 block). */
export const KEY_LENGTH = 32;

/**
 * PBKDF2-HMAC-SHA256 of `password` (its UTF-8 bytes) with `salt`, giving
 * KEY_LENGTH bytes. Passed in: the app's is native, the tests' is Node's.
 */
export type Derive = (
	password: Uint8Array,
	salt: Uint8Array,
	iterations: number,
) => Promise<Uint8Array>;

/** A password as hashed: composed accents, UTF-8. */
const passwordBytes = (password: string) =>
	utf8ToBytes(password.normalize("NFC"));

export const hashPassword = async (
	password: string,
	salt: Uint8Array,
	derive: Derive,
	iterations = PASSWORD_ITERATIONS,
): Promise<PasswordRecord> => ({
	salt: bytesToHex(salt),
	hash: bytesToHex(await derive(passwordBytes(password), salt, iterations)),
	iterations,
});

/** Compares in constant time, so timing doesn't leak how close a guess was. */
const sameBytes = (a: Uint8Array, b: Uint8Array) => {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
	return diff === 0;
};

export const verifyPassword = async (
	password: string,
	record: PasswordRecord,
	derive: Derive,
) => {
	const derived = await derive(
		passwordBytes(password),
		hexToBytes(record.salt),
		record.iterations,
	);
	return sameBytes(derived, hexToBytes(record.hash));
};

/** Reads a stored record; anything malformed counts as none. */
export const parsePasswordRecord = (
	json: string | null,
): PasswordRecord | null => {
	if (!json) return null;
	try {
		const record = JSON.parse(json) as Partial<PasswordRecord>;
		return typeof record.salt === "string" &&
			typeof record.hash === "string" &&
			typeof record.iterations === "number"
			? (record as PasswordRecord)
			: null;
	} catch {
		return null;
	}
};
