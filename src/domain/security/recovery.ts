import { base32Encode } from "./totp";

/** Characters in a recovery code: 16 base32 letters, 80 random bits. */
export const RECOVERY_LENGTH = 16;
/** Random bytes behind a recovery code (16 base32 letters × 5 bits). */
export const RECOVERY_BYTES = 10;

/** "ABCD-EFGH-IJKL-MNOP": in groups of four, to write down. */
export const formatRecoveryCode = (code: string) =>
	code.match(/.{1,4}/g)?.join("-") ?? code;

export const recoveryCodeFrom = (bytes: Uint8Array) =>
	formatRecoveryCode(base32Encode(bytes).slice(0, RECOVERY_LENGTH));

/**
 * A recovery code as typed back: any case, with or without dashes and
 * spaces. Base32 has no 0, 1 or 8, so those are read as the letters they
 * get mistaken for (O, I, B).
 */
export const normalizeRecoveryCode = (typed: string) =>
	typed
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, "")
		.replace(/0/g, "O")
		.replace(/1/g, "I")
		.replace(/8/g, "B");

export const isCompleteRecoveryCode = (typed: string) =>
	normalizeRecoveryCode(typed).length === RECOVERY_LENGTH;
