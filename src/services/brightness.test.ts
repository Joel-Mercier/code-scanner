import * as Brightness from "expo-brightness";
import { Platform } from "react-native";
import { raiseBrightness } from "./brightness";

jest.mock("expo-brightness", () => ({
	getBrightnessAsync: jest.fn(async () => 0.3),
	setBrightnessAsync: jest.fn(async () => {}),
	restoreSystemBrightnessAsync: jest.fn(async () => {}),
}));

afterEach(() => jest.clearAllMocks());

describe("raiseBrightness", () => {
	it("on iOS, goes to full and puts the level from before back", async () => {
		jest.replaceProperty(Platform, "OS", "ios");
		const restore = await raiseBrightness();
		expect(Brightness.setBrightnessAsync).toHaveBeenLastCalledWith(1);
		await restore();
		expect(Brightness.setBrightnessAsync).toHaveBeenLastCalledWith(0.3);
	});

	it("on Android, raises the window and hands it back to the system", async () => {
		jest.replaceProperty(Platform, "OS", "android");
		const restore = await raiseBrightness();
		expect(Brightness.setBrightnessAsync).toHaveBeenLastCalledWith(1);
		expect(Brightness.getBrightnessAsync).not.toHaveBeenCalled();
		await restore();
		expect(Brightness.restoreSystemBrightnessAsync).toHaveBeenCalled();
	});
});
