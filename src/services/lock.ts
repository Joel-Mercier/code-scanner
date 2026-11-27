import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import { requireOptionalNativeModule } from "expo";
import { getRandomBytes } from "expo-crypto";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import {
	type Derive,
	hashPassword,
	KEY_LENGTH,
	parsePasswordRecord,
	verifyPassword,
} from "@/domain/security/password";
import {
	isCompleteRecoveryCode,
	normalizeRecoveryCode,
	RECOVERY_BYTES,
	recoveryCodeFrom,
} from "@/domain/security/recovery";
import { base32Decode, base32Encode, verifyTotp } from "@/domain/security/totp";

/** `modules/pbkdf2`: CommonCrypto on iOS, the system HMAC on Android. */
type Pbkdf2Native = {
	sha256(
		passwordHex: string,
		saltHex: string,
		iterations: number,
		length: number,
	): Promise<string>;
};

const Pbkdf2 = requireOptionalNativeModule<Pbkdf2Native>("Pbkdf2");

/** A build without `modules/pbkdf2`: passwords can't be set or checked. */
export class MissingNativeModuleError extends Error {
	constructor() {
		super("modules/pbkdf2 is missing from this build: rebuild the app");
		this.name = "MissingNativeModuleError";
	}
}

/**
 * PBKDF2 natively, off the JS thread: about a tenth of a second. There is
 * no JS fallback on purpose: it takes many seconds on a phone, so a build
 * missing the module fails clearly instead of unlocking at a crawl.
 */
const derive: Derive = async (password, salt, iterations) => {
	if (!Pbkdf2) throw new MissingNativeModuleError();
	return hexToBytes(
		await Pbkdf2.sha256(
			bytesToHex(password),
			bytesToHex(salt),
			iterations,
			KEY_LENGTH,
		),
	);
};

/**
 * What the phone itself can check: its biometrics (by name, for labels), or
 * just its passcode, or nothing at all (no passcode set).
 */
export type DeviceAuth =
	| "faceId"
	| "touchId"
	| "face"
	| "fingerprint"
	| "iris"
	| "passcode"
	| "none";

const { AuthenticationType, SecurityLevel } = LocalAuthentication;

export const deviceAuth = async (): Promise<DeviceAuth> => {
	const level = await LocalAuthentication.getEnrolledLevelAsync();
	if (level === SecurityLevel.NONE) return "none";
	if (level === SecurityLevel.SECRET) return "passcode";
	const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
	const ios = Platform.OS === "ios";
	if (types.includes(AuthenticationType.FACIAL_RECOGNITION)) {
		return ios ? "faceId" : "face";
	}
	if (types.includes(AuthenticationType.FINGERPRINT)) {
		return ios ? "touchId" : "fingerprint";
	}
	if (types.includes(AuthenticationType.IRIS)) return "iris";
	return "passcode";
};

/** The system prompt: biometrics, falling back to the phone's passcode. */
export const authenticateWithDevice = async (
	promptMessage: string,
	cancelLabel: string,
) => {
	const result = await LocalAuthentication.authenticateAsync({
		promptMessage,
		cancelLabel,
		disableDeviceFallback: false,
	});
	return result.success;
};

// Secrets stay on this phone (not in iCloud / Google backups, not in the
// app's own .zip backups), readable only while the phone is unlocked.
const SECURE = {
	keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};
const PASSWORD_KEY = "lock.password";
const TOTP_KEY = "lock.totp";
const RECOVERY_KEY = "lock.recovery";

export const savePassword = async (password: string) => {
	const record = await hashPassword(password, getRandomBytes(16), derive);
	await SecureStore.setItemAsync(PASSWORD_KEY, JSON.stringify(record), SECURE);
};

export const hasPassword = async () =>
	parsePasswordRecord(await SecureStore.getItemAsync(PASSWORD_KEY, SECURE)) !==
	null;

export const checkPassword = async (password: string) => {
	const record = parsePasswordRecord(
		await SecureStore.getItemAsync(PASSWORD_KEY, SECURE),
	);
	return record ? verifyPassword(password, record, derive) : false;
};

/** A new authenticator key: 160 random bits, as base32 (RFC 4226's size). */
export const createTotpSecret = () => base32Encode(getRandomBytes(20));

export const saveTotpSecret = (secret: string) =>
	SecureStore.setItemAsync(TOTP_KEY, secret, SECURE);

export const hasTotpSecret = async () =>
	Boolean(await SecureStore.getItemAsync(TOTP_KEY, SECURE));

/** Checks against `secret`, or the stored one. */
export const checkTotp = async (code: string, secret?: string) => {
	const key = secret ?? (await SecureStore.getItemAsync(TOTP_KEY, SECURE));
	return key ? verifyTotp(base32Decode(key), code, Date.now()) : false;
};

/** A new recovery code, "ABCD-EFGH-IJKL-MNOP" (80 random bits). */
export const createRecoveryCode = () =>
	recoveryCodeFrom(getRandomBytes(RECOVERY_BYTES));

/** Keeps a recovery code the way a password is kept: as a salted hash. */
export const saveRecoveryCode = async (code: string) => {
	const record = await hashPassword(
		normalizeRecoveryCode(code),
		getRandomBytes(16),
		derive,
	);
	await SecureStore.setItemAsync(RECOVERY_KEY, JSON.stringify(record), SECURE);
};

export const hasRecoveryCode = async () =>
	parsePasswordRecord(await SecureStore.getItemAsync(RECOVERY_KEY, SECURE)) !==
	null;

export const checkRecoveryCode = async (typed: string) => {
	if (!isCompleteRecoveryCode(typed)) return false;
	const record = parsePasswordRecord(
		await SecureStore.getItemAsync(RECOVERY_KEY, SECURE),
	);
	return record
		? verifyPassword(normalizeRecoveryCode(typed), record, derive)
		: false;
};

/**
 * Forgets the secrets of the methods no longer in use. With the phone's
 * own lock (no `keep`), the recovery code goes too: it only stood in for a
 * password or an authenticator.
 */
export const clearSecrets = async (keep?: "password" | "totp") => {
	if (keep !== "password")
		await SecureStore.deleteItemAsync(PASSWORD_KEY, SECURE);
	if (keep !== "totp") await SecureStore.deleteItemAsync(TOTP_KEY, SECURE);
	if (!keep) await SecureStore.deleteItemAsync(RECOVERY_KEY, SECURE);
};
