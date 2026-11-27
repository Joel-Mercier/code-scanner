import { flag, formatMoney, regionLabel, regionName } from "./region";

describe("regions", () => {
	it("turns a region code into a flag", () => {
		expect(flag("FR")).toBe("🇫🇷");
		expect(flag("fr")).toBe("🇫🇷");
		expect(flag("FRA")).toBe("");
	});

	it("names regions in the app's language", () => {
		expect(regionName("FR", "en")).toBe("France");
		expect(regionName("DE", "fr")).toBe("Allemagne");
		expect(regionLabel("FR", "en")).toBe("🇫🇷 France");
	});

	it("falls back to the code without Intl.DisplayNames", () => {
		const spy = jest.spyOn(Intl, "DisplayNames").mockImplementation(() => {
			throw new TypeError("Intl.DisplayNames is not a constructor");
		});
		expect(regionName("FR", "en")).toBe("FR");
		spy.mockRestore();
	});

	it("formats amounts in their currency", () => {
		expect(formatMoney(12.5, "EUR", "en")).toBe("€12.50");
		expect(formatMoney(12.5, "XYZ1", "en")).toBe("12.50 XYZ1");
	});
});
