import { compactIban, formatIban, isValidIban } from "./iban";

describe("IBAN", () => {
	it("checks the mod 97 check digits", () => {
		expect(isValidIban("FR76 3000 6000 0112 3456 7890 189")).toBe(true);
		expect(isValidIban("GB82WEST12345698765432")).toBe(true);
		expect(isValidIban("GB82WEST12345698765433")).toBe(false);
		expect(isValidIban("hello")).toBe(false);
	});

	it("compacts and groups by four", () => {
		expect(compactIban("fr76 3000-6000")).toBe("FR7630006000");
		expect(formatIban("FR7630006000011234567890189")).toBe(
			"FR76 3000 6000 0112 3456 7890 189",
		);
	});
});
