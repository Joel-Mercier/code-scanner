import { bytesToHex } from "@noble/hashes/utils.js";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { hashPassword } from "@/domain/security/password";
import { base32Decode, totp } from "@/domain/security/totp";
import { deriveInNode, fakePbkdf2Module } from "@/test/derive";
import {
	authenticateWithDevice,
	checkPassword,
	checkRecoveryCode,
	checkTotp,
	clearSecrets,
	createRecoveryCode,
	createTotpSecret,
	deviceAuth,
	hasPassword,
	hasRecoveryCode,
	hasTotpSecret,
	savePassword,
	saveRecoveryCode,
	saveTotpSecret,
} from "./lock";

// modules/pbkdf2, as Node computes it (the same bytes as the phone's).
const mockSha256 = jest.fn();
jest.mock("expo", () => ({
	requireOptionalNativeModule: (name: string) =>
		name === "Pbkdf2"
			? { sha256: (...args: unknown[]) => mockSha256(...args) }
			: null,
}));

jest.mock("expo-secure-store", () => {
	const store = new Map<string, string>();
	return {
		WHEN_UNLOCKED_THIS_DEVICE_ONLY: 5,
		store,
		setItemAsync: jest.fn(async (key: string, value: string) => {
			store.set(key, value);
		}),
		getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
		deleteItemAsync: jest.fn(async (key: string) => {
			store.delete(key);
		}),
	};
});
jest.mock("expo-crypto", () => ({
	getRandomBytes: (count: number) =>
		Uint8Array.from({ length: count }, (_, i) => (i * 53 + 7) % 256),
}));
jest.mock("expo-local-authentication", () => ({
	AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
	SecurityLevel: { NONE: 0, SECRET: 1, BIOMETRIC_WEAK: 2, BIOMETRIC_STRONG: 3 },
	getEnrolledLevelAsync: jest.fn(),
	supportedAuthenticationTypesAsync: jest.fn(),
	authenticateAsync: jest.fn(),
}));

const auth = jest.mocked(LocalAuthentication);
const store = (SecureStore as unknown as { store: Map<string, string> }).store;

beforeEach(() => mockSha256.mockImplementation(fakePbkdf2Module.sha256));

afterEach(() => {
	store.clear();
	jest.clearAllMocks();
});

describe("deviceAuth", () => {
	const setOs = (os: "ios" | "android") =>
		jest.replaceProperty(Platform, "OS", os);

	it("names what the phone checks", async () => {
		auth.getEnrolledLevelAsync.mockResolvedValue(3);
		auth.supportedAuthenticationTypesAsync.mockResolvedValue([2]);
		setOs("ios");
		await expect(deviceAuth()).resolves.toBe("faceId");
		setOs("android");
		await expect(deviceAuth()).resolves.toBe("face");

		auth.supportedAuthenticationTypesAsync.mockResolvedValue([1]);
		await expect(deviceAuth()).resolves.toBe("fingerprint");
		setOs("ios");
		await expect(deviceAuth()).resolves.toBe("touchId");
	});

	it("falls back to the passcode, or nothing", async () => {
		auth.getEnrolledLevelAsync.mockResolvedValue(1);
		await expect(deviceAuth()).resolves.toBe("passcode");
		auth.getEnrolledLevelAsync.mockResolvedValue(0);
		await expect(deviceAuth()).resolves.toBe("none");
	});

	it("prompts with the passcode as a fallback", async () => {
		auth.authenticateAsync.mockResolvedValue({ success: true });
		await expect(authenticateWithDevice("Unlock", "Cancel")).resolves.toBe(
			true,
		);
		expect(auth.authenticateAsync).toHaveBeenCalledWith({
			promptMessage: "Unlock",
			cancelLabel: "Cancel",
			disableDeviceFallback: false,
		});
	});
});

describe("password", () => {
	it("hashes natively: the password composed, as UTF-8 hex", async () => {
		await savePassword("cafe\u0301");
		expect(mockSha256).toHaveBeenCalledWith(
			bytesToHex(new TextEncoder().encode("caf\u00e9")),
			expect.stringMatching(/^[0-9a-f]{32}$/),
			100_000,
			32,
		);
		await expect(checkPassword("caf\u00e9")).resolves.toBe(true);
	});

	it("reads passwords kept by earlier builds (same algorithm)", async () => {
		const record = await hashPassword(
			"old password",
			new Uint8Array(16).fill(3),
			deriveInNode,
		);
		store.set("lock.password", JSON.stringify(record));
		await expect(checkPassword("old password")).resolves.toBe(true);
	});

	it("keeps only a hash, on this device, and checks against it", async () => {
		await expect(hasPassword()).resolves.toBe(false);
		await expect(checkPassword("anything")).resolves.toBe(false);

		await savePassword("correct horse");
		expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
			"lock.password",
			expect.not.stringContaining("horse"),
			{ keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
		);
		await expect(hasPassword()).resolves.toBe(true);
		await expect(checkPassword("correct horse")).resolves.toBe(true);
		await expect(checkPassword("Correct horse")).resolves.toBe(false);
	});
});

describe("authenticator", () => {
	it("makes a 160-bit key and checks codes against it", async () => {
		const secret = createTotpSecret();
		expect(base32Decode(secret)).toHaveLength(20);
		const code = totp(base32Decode(secret), Date.now());

		// Before it is saved, a code is checked against the key being set up.
		await expect(checkTotp(code, secret)).resolves.toBe(true);
		await expect(checkTotp(code)).resolves.toBe(false);

		await saveTotpSecret(secret);
		await expect(hasTotpSecret()).resolves.toBe(true);
		await expect(checkTotp(code)).resolves.toBe(true);
		// Every digit off by one: never the code, nor its neighbours' (in practice).
		const wrong = code.replace(/\d/g, (digit) =>
			String((Number(digit) + 1) % 10),
		);
		await expect(checkTotp(wrong)).resolves.toBe(false);
	});
});

describe("recovery code", () => {
	it("keeps only a hash, and takes the code back however it is typed", async () => {
		const code = createRecoveryCode();
		expect(code).toMatch(/^[A-Z2-7]{4}(-[A-Z2-7]{4}){3}$/);
		await expect(hasRecoveryCode()).resolves.toBe(false);
		await expect(checkRecoveryCode(code)).resolves.toBe(false);

		await saveRecoveryCode(code);
		expect(store.get("lock.recovery")).not.toContain(code.replace(/-/g, ""));
		await expect(hasRecoveryCode()).resolves.toBe(true);
		await expect(checkRecoveryCode(code)).resolves.toBe(true);
		await expect(
			checkRecoveryCode(code.toLowerCase().replace(/-/g, " ")),
		).resolves.toBe(true);
		await expect(checkRecoveryCode("AAAA-AAAA-AAAA-AAAA")).resolves.toBe(false);
		await expect(checkRecoveryCode(code.slice(0, 10))).resolves.toBe(false);
	});
});

describe("clearSecrets", () => {
	it("keeps the one in use (and the recovery code), forgets the other", async () => {
		await savePassword("pass");
		await saveTotpSecret(createTotpSecret());
		await saveRecoveryCode(createRecoveryCode());
		await clearSecrets("totp");
		await expect(hasPassword()).resolves.toBe(false);
		await expect(hasTotpSecret()).resolves.toBe(true);
		await expect(hasRecoveryCode()).resolves.toBe(true);
	});

	it("forgets everything, recovery code included, for the phone's lock", async () => {
		await saveTotpSecret(createTotpSecret());
		await saveRecoveryCode(createRecoveryCode());
		await clearSecrets();
		await expect(hasTotpSecret()).resolves.toBe(false);
		await expect(hasRecoveryCode()).resolves.toBe(false);
	});
});

describe("without modules/pbkdf2", () => {
	it("fails clearly rather than hashing in JS", async () => {
		jest.resetModules();
		jest.doMock("expo", () => ({ requireOptionalNativeModule: () => null }));
		const lock: typeof import("./lock") = require("./lock");
		await expect(lock.savePassword("secret")).rejects.toThrow(
			lock.MissingNativeModuleError,
		);
		jest
			.requireMock("expo-secure-store")
			.store.set(
				"lock.password",
				JSON.stringify({ salt: "00", hash: "00", iterations: 1 }),
			);
		await expect(lock.checkPassword("secret")).rejects.toThrow(
			"rebuild the app",
		);
	});
});
