import { detectInText } from "./text";

describe("detectInText", () => {
	it("finds a link, with or without a scheme", () => {
		expect(detectInText("Menu: https://example.com/menu.").url).toBe(
			"https://example.com/menu",
		);
		expect(detectInText("see www.example.fr").url).toBe(
			"https://www.example.fr",
		);
		expect(detectInText("Order at pizza-roma.fr/order!").url).toBe(
			"https://pizza-roma.fr/order",
		);
		expect(detectInText("notes.txt and file.pdf").url).toBeUndefined();
	});

	it("finds an e-mail without reading its domain as a link", () => {
		expect(detectInText("Write to ada@example.com")).toEqual({
			email: "ada@example.com",
		});
	});

	it("finds French and international phone numbers", () => {
		expect(detectInText("Call 06 12 34 56 78").phone).toBe("0612345678");
		expect(detectInText("Tel +33 1 23 45 67 89").phone).toBe("+33123456789");
		expect(detectInText("Room 12, floor 3").phone).toBeUndefined();
	});

	it("finds a valid IBAN and doesn't read it as a phone number", () => {
		expect(detectInText("IBAN FR76 3000 6000 0112 3456 7890 189")).toEqual({
			iban: "FR7630006000011234567890189",
		});
		expect(
			detectInText("FR76 3000 6000 0112 3456 7890 180").iban,
		).toBeUndefined();
	});
});
