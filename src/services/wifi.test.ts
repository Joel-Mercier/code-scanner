import * as Clipboard from "expo-clipboard";
import { Linking, Platform } from "react-native";
import { joinWifi } from "./wifi";

const mockConnect = jest.fn();
let mockNative: { connect: typeof mockConnect } | null = null;

jest.mock("expo", () => ({
	requireOptionalNativeModule: () => mockNative,
}));
jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn() }));

const network = {
	ssid: "Home",
	password: "secret123",
	encryption: "WPA" as const,
	hidden: false,
};

const setPlatform = (os: "ios" | "android") =>
	Object.defineProperty(Platform, "OS", { value: os, configurable: true });

let sendIntent: jest.SpyInstance;

beforeEach(() => {
	sendIntent = jest
		.spyOn(Linking, "sendIntent")
		.mockResolvedValue(undefined as never);
});

afterEach(() => {
	mockNative = null;
	jest.clearAllMocks();
	jest.restoreAllMocks();
	setPlatform("ios");
});

describe("joinWifi", () => {
	it("asks the system to join, passing the network as it was scanned", async () => {
		mockNative = { connect: mockConnect.mockResolvedValue("connected") };
		await expect(joinWifi({ ...network, encryption: "SAE" })).resolves.toBe(
			"connected",
		);
		expect(mockConnect).toHaveBeenCalledWith({
			ssid: "Home",
			password: "secret123",
			security: "SAE",
			hidden: false,
		});
		expect(Clipboard.setStringAsync).not.toHaveBeenCalled();
	});

	it("reports a cancelled prompt without falling back", async () => {
		mockNative = { connect: mockConnect.mockResolvedValue("cancelled") };
		await expect(joinWifi(network)).resolves.toBe("cancelled");
		expect(Clipboard.setStringAsync).not.toHaveBeenCalled();
	});

	it("copies the password and opens the Wi-Fi panel where it can't join", async () => {
		setPlatform("android");
		mockNative = { connect: mockConnect.mockResolvedValue("unsupported") };
		await expect(joinWifi(network)).resolves.toBe("manual");
		expect(Clipboard.setStringAsync).toHaveBeenCalledWith("secret123");
		expect(sendIntent).toHaveBeenCalledWith(
			"android.settings.panel.action.WIFI",
		);
	});

	it("falls back to the Wi-Fi settings without the panel", async () => {
		setPlatform("android");
		sendIntent
			.mockRejectedValueOnce(new Error("no panel"))
			.mockResolvedValueOnce(undefined as never);
		await expect(joinWifi(network)).resolves.toBe("manual");
		expect(sendIntent).toHaveBeenLastCalledWith(
			"android.settings.WIFI_SETTINGS",
		);
	});

	it("only copies the password on iOS without the module, and for enterprise networks", async () => {
		await expect(joinWifi(network)).resolves.toBe("manual");
		mockNative = { connect: mockConnect };
		await expect(joinWifi({ ...network, encryption: "EAP" })).resolves.toBe(
			"manual",
		);
		expect(mockConnect).not.toHaveBeenCalled();
		expect(Clipboard.setStringAsync).toHaveBeenCalledTimes(2);
		expect(sendIntent).not.toHaveBeenCalled();
	});
});
