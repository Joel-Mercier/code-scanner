import {
	base32Decode,
	base32Encode,
	groupSecret,
	hotp,
	otpauthUri,
	totp,
	verifyTotp,
} from "./totp";

// RFC 6238's SHA-1 test key, "12345678901234567890".
const key = new TextEncoder().encode("12345678901234567890");
const KEY_BASE32 = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

describe("base32", () => {
	it("encodes and decodes RFC 4648 base32", () => {
		expect(base32Encode(key)).toBe(KEY_BASE32);
		expect(base32Decode(KEY_BASE32)).toEqual(key);
		expect(base32Encode(new TextEncoder().encode("foobar"))).toBe("MZXW6YTBOI");
	});

	it("ignores case, spaces and padding, and refuses other letters", () => {
		expect(base32Decode("mzxw 6ytb oi======")).toEqual(
			new TextEncoder().encode("foobar"),
		);
		expect(() => base32Decode("MZ1W")).toThrow();
	});

	it("round-trips any bytes", () => {
		const bytes = Uint8Array.from({ length: 20 }, (_, i) => (i * 37) % 256);
		expect(base32Decode(base32Encode(bytes))).toEqual(bytes);
	});
});

describe("hotp", () => {
	it("matches RFC 4226's test values", () => {
		const expected = ["755224", "287082", "359152", "969429", "338314"];
		expected.forEach((code, counter) => {
			expect(hotp(key, counter)).toBe(code);
		});
	});
});

describe("totp", () => {
	it("matches RFC 6238's SHA-1 test values (last 6 digits)", () => {
		expect(totp(key, 59_000)).toBe("287082");
		expect(totp(key, 1_111_111_109_000)).toBe("081804");
		expect(totp(key, 1_234_567_890_000)).toBe("005924");
		expect(totp(key, 2_000_000_000_000)).toBe("279037");
	});

	it("accepts the current code and its neighbours, nothing further", () => {
		const now = 1_234_567_890_000;
		expect(verifyTotp(key, totp(key, now), now)).toBe(true);
		expect(verifyTotp(key, totp(key, now - 30_000), now)).toBe(true);
		expect(verifyTotp(key, totp(key, now + 30_000), now)).toBe(true);
		expect(verifyTotp(key, totp(key, now - 90_000), now)).toBe(false);
	});

	it("reads typed codes with spaces and refuses anything else", () => {
		const now = 59_000;
		expect(verifyTotp(key, "287 082", now)).toBe(true);
		expect(verifyTotp(key, "28708", now)).toBe(false);
		expect(verifyTotp(key, "abcdef", now)).toBe(false);
	});
});

describe("otpauthUri", () => {
	it("builds what authenticator apps scan", () => {
		expect(
			otpauthUri({
				secret: KEY_BASE32,
				issuer: "Code Scanner",
				account: "App lock",
			}),
		).toBe(
			`otpauth://totp/Code%20Scanner%3AApp%20lock?secret=${KEY_BASE32}&issuer=Code%20Scanner&algorithm=SHA1&digits=6&period=30`,
		);
	});

	it("groups a secret by four for typing", () => {
		expect(groupSecret("ABCDEFGHIJ")).toBe("ABCD EFGH IJ");
	});
});
