import * as Haptics from "expo-haptics";
import { haptics, setHapticsEnabled } from "./haptics";

jest.mock("expo-haptics", () => ({
	impactAsync: jest.fn(),
	selectionAsync: jest.fn(),
	notificationAsync: jest.fn(),
	ImpactFeedbackStyle: { Light: "light", Medium: "medium" },
	NotificationFeedbackType: { Success: "success", Warning: "warning" },
}));

beforeEach(() => {
	jest.clearAllMocks();
	setHapticsEnabled(true);
});

describe("haptics", () => {
	it("plays the matching feedback", () => {
		haptics.tap();
		haptics.pop();
		haptics.select();
		haptics.success();
		haptics.warning();
		expect(Haptics.impactAsync).toHaveBeenNthCalledWith(1, "light");
		expect(Haptics.impactAsync).toHaveBeenNthCalledWith(2, "medium");
		expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
		expect(Haptics.notificationAsync).toHaveBeenNthCalledWith(1, "success");
		expect(Haptics.notificationAsync).toHaveBeenNthCalledWith(2, "warning");
	});

	it("stays silent when turned off", () => {
		setHapticsEnabled(false);
		haptics.tap();
		haptics.pop();
		haptics.select();
		haptics.success();
		haptics.warning();
		expect(Haptics.impactAsync).not.toHaveBeenCalled();
		expect(Haptics.selectionAsync).not.toHaveBeenCalled();
		expect(Haptics.notificationAsync).not.toHaveBeenCalled();
	});
});
