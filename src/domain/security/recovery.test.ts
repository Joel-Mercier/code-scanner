import {
	formatRecoveryCode,
	isCompleteRecoveryCode,
	normalizeRecoveryCode,
	RECOVERY_BYTES,
	RECOVERY_LENGTH,
	recoveryCodeFrom,
} from "./recovery";

describe("recovery codes", () => {
	it("are 16 base32 letters from 80 random bits, in groups of four", () => {
		const code = recoveryCodeFrom(new Uint8Array(RECOVERY_BYTES).fill(255));
		expect(code).toBe("7777-7777-7777-7777");
		const other = recoveryCodeFrom(
			Uint8Array.from({ length: RECOVERY_BYTES }, (_, i) => i * 29),
		);
		expect(other).toMatch(/^[A-Z2-7]{4}(-[A-Z2-7]{4}){3}$/);
		expect(normalizeRecoveryCode(other)).toHaveLength(RECOVERY_LENGTH);
	});

	it("groups by four", () => {
		expect(formatRecoveryCode("ABCDEFGHIJKLMNOP")).toBe("ABCD-EFGH-IJKL-MNOP");
	});

	it("read back in any case, with or without dashes and spaces", () => {
		expect(normalizeRecoveryCode("abcd efgh-ijkl mnop")).toBe(
			"ABCDEFGHIJKLMNOP",
		);
	});

	it("read 0, 1 and 8 as the letters they are mistaken for", () => {
		expect(normalizeRecoveryCode("0a1b8c")).toBe("OAIBBC");
	});

	it("are complete at 16 letters only", () => {
		expect(isCompleteRecoveryCode("ABCD-EFGH-IJKL-MNOP")).toBe(true);
		expect(isCompleteRecoveryCode("ABCD-EFGH-IJKL-MNO")).toBe(false);
		expect(isCompleteRecoveryCode("ABCD-EFGH-IJKL-MNOPQ")).toBe(false);
	});
});
