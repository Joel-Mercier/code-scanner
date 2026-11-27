import { deriveInNode as derive } from "@/test/derive";
import {
	hashPassword,
	PASSWORD_ITERATIONS,
	parsePasswordRecord,
	verifyPassword,
} from "./password";

const salt = Uint8Array.from({ length: 16 }, (_, i) => i);

describe("passwords", () => {
	it("keeps a salted hash, never the password", async () => {
		const record = await hashPassword("open sesame", salt, derive, 1000);
		expect(record.iterations).toBe(1000);
		expect(record.salt).toBe("000102030405060708090a0b0c0d0e0f");
		expect(record.hash).toMatch(/^[0-9a-f]{64}$/);
		expect(JSON.stringify(record)).not.toContain("sesame");
	});

	it("is PBKDF2-HMAC-SHA256 at 100,000 rounds by default", async () => {
		// The value the Swift and Kotlin modules were checked against.
		const record = await hashPassword("open sesame", salt, derive);
		expect(record.iterations).toBe(PASSWORD_ITERATIONS);
		expect(record.hash).toBe(
			"63786974f6be8b6bf76b56780cd622095eb7ca7cdf0bfa7b1bce77826299d9a8",
		);
	});

	it("verifies the right password only", async () => {
		const record = await hashPassword("open sesame", salt, derive, 1000);
		await expect(verifyPassword("open sesame", record, derive)).resolves.toBe(
			true,
		);
		await expect(verifyPassword("open sesam", record, derive)).resolves.toBe(
			false,
		);
		await expect(verifyPassword("", record, derive)).resolves.toBe(false);
	});

	it("reads the same password typed with composed or decomposed accents", async () => {
		const record = await hashPassword("café", salt, derive, 1000);
		await expect(verifyPassword("café", record, derive)).resolves.toBe(true);
	});

	it("gives another hash with another salt", async () => {
		const a = await hashPassword("same", salt, derive, 1000);
		const b = await hashPassword(
			"same",
			salt.map((n) => n + 1),
			derive,
			1000,
		);
		expect(a.hash).not.toBe(b.hash);
	});

	it("reads stored records, and nothing malformed", async () => {
		const record = await hashPassword("x", salt, derive, 1000);
		expect(parsePasswordRecord(JSON.stringify(record))).toEqual(record);
		expect(parsePasswordRecord(null)).toBeNull();
		expect(parsePasswordRecord("{")).toBeNull();
		expect(parsePasswordRecord('{"salt":"00"}')).toBeNull();
	});
});
