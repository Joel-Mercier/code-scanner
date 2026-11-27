import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import { type Derive, KEY_LENGTH } from "@/domain/security/password";

// Node's own (native) PBKDF2, typed by hand: the project has no @types/node.
const { pbkdf2Sync } = require("node:crypto") as {
	pbkdf2Sync: (
		password: Uint8Array,
		salt: Uint8Array,
		iterations: number,
		length: number,
		digest: "sha256",
	) => Uint8Array;
};

/**
 * PBKDF2-HMAC-SHA256 as Node computes it: what `modules/pbkdf2` computes on
 * the phone (both checked against RFC 7914's vectors).
 */
export const deriveInNode: Derive = async (password, salt, iterations) =>
	new Uint8Array(pbkdf2Sync(password, salt, iterations, KEY_LENGTH, "sha256"));

/** `modules/pbkdf2`'s JS face, backed by Node: for `jest.mock("expo", …)`. */
export const fakePbkdf2Module = {
	sha256: async (
		passwordHex: string,
		saltHex: string,
		iterations: number,
		length: number,
	) =>
		bytesToHex(
			pbkdf2Sync(
				hexToBytes(passwordHex),
				hexToBytes(saltHex),
				iterations,
				length,
				"sha256",
			),
		),
};
