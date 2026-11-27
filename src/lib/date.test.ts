import i18n from "@/i18n";
import { format, timeAgo } from "./date";

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

describe("timeAgo", () => {
	it("says how long ago, in the app's language", async () => {
		const threeHours = Date.now() - 3 * 60 * 60 * 1000;
		expect(timeAgo(threeHours)).toBe("about 3 hours ago");
		await i18n.changeLanguage("fr");
		expect(timeAgo(threeHours)).toBe("il y a environ 3 heures");
	});
});
