import i18n from "@/i18n";
import { formatBytes } from "./bytes";

describe("formatBytes", () => {
	it("picks the unit, with one decimal below 10", () => {
		expect(formatBytes(0)).toBe("0 B");
		expect(formatBytes(512)).toBe("512 B");
		expect(formatBytes(1024)).toBe("1.0 KB");
		expect(formatBytes(1536)).toBe("1.5 KB");
		expect(formatBytes(20 * 1024)).toBe("20 KB");
		expect(formatBytes(3.25 * 1024 * 1024)).toBe("3.3 MB");
		expect(formatBytes(2 * 1024 ** 3)).toBe("2.0 GB");
	});

	it("treats a missing size as zero", () => {
		expect(formatBytes(Number.NaN)).toBe("0 B");
	});

	it("uses the current language's units", async () => {
		await i18n.changeLanguage("fr");
		expect(formatBytes(2048)).toBe("2.0 Ko");
		await i18n.changeLanguage("en");
	});
});
