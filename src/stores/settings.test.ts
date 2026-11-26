import i18n from "@/i18n";
import { haptics } from "@/lib/haptics";
import { storage } from "@/lib/storage";
import useSettings from "./settings";

jest.mock("expo-haptics", () => ({
	impactAsync: jest.fn(),
	selectionAsync: jest.fn(),
	notificationAsync: jest.fn(),
	ImpactFeedbackStyle: {},
	NotificationFeedbackType: {},
}));
const Haptics = jest.requireMock("expo-haptics");

const settings = () => useSettings.getState();

afterEach(() => {
	settings().setLocale("en");
	settings().setHaptics(true);
	jest.clearAllMocks();
});

describe("settings", () => {
	it("starts with everything on, following the system", () => {
		expect(settings()).toMatchObject({
			locale: null,
			haptics: true,
			motion3d: true,
			theme: "system",
		});
	});

	it("switches the app's language", () => {
		settings().setLocale("fr");
		expect(settings().locale).toBe("fr");
		expect(i18n.language).toBe("fr");
	});

	it("turns haptics off and on", () => {
		settings().setHaptics(false);
		haptics.tap();
		expect(Haptics.impactAsync).not.toHaveBeenCalled();

		settings().setHaptics(true);
		haptics.tap();
		expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
	});

	it("stores the theme and 3D preferences", () => {
		settings().setTheme("dark");
		settings().setMotion3d(false);
		expect(settings()).toMatchObject({ theme: "dark", motion3d: false });
	});

	it("persists under the 'app' key, kept from before the rename", () => {
		settings().setTheme("light");
		const saved = JSON.parse(storage.getString("app") ?? "{}");
		expect(saved).toMatchObject({ version: 1, state: { theme: "light" } });
	});
});
