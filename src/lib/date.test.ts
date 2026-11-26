import i18n from "@/i18n";
import { format } from "./date";

const date = new Date(2026, 0, 5, 14, 30);

afterEach(() => i18n.changeLanguage("en"));

describe("format", () => {
	it("formats in English by default", () => {
		expect(format(date, "d MMMM yyyy, HH:mm")).toBe("5 January 2026, 14:30");
	});

	it("follows the app's language", async () => {
		await i18n.changeLanguage("fr");
		expect(format(date, "d MMMM yyyy")).toBe("5 janvier 2026");
	});

	it("accepts timestamps", () => {
		expect(format(date.getTime(), "yyyy-MM")).toBe("2026-01");
	});
});
