/** @jest-environment @shopify/react-native-skia/jestEnv.js */
import "@shopify/react-native-skia/jestSetup.js";
import * as MediaLibrary from "expo-media-library";
import { Platform } from "react-native";
import { fileSystem } from "@/test/fileSystem";
import { saveCodeToGallery } from "./exportCode";

jest.mock("expo-media-library", () => ({
	getPermissionsAsync: jest.fn(),
	requestPermissionsAsync: jest.fn(),
	Asset: { create: jest.fn() },
}));
jest.mock("react-native-share", () => ({ open: jest.fn() }));

const media = jest.mocked(MediaLibrary);
const permission = (granted: boolean, canAskAgain = true) =>
	({ granted, canAskAgain }) as never;

const onPlatform = (os: "ios" | "android", version: number) => {
	Object.defineProperty(Platform, "OS", { get: () => os, configurable: true });
	Object.defineProperty(Platform, "Version", {
		get: () => version,
		configurable: true,
	});
};

// No GPU surface under Jest: stand in for the offscreen render itself.
const drawAsImage = jest
	.spyOn(
		jest.requireMock<typeof import("@shopify/react-native-skia")>(
			"@shopify/react-native-skia",
		),
		"drawAsImage",
	)
	.mockResolvedValue({
		encodeToBytes: () => new Uint8Array([137, 80, 78, 71]),
	} as never);

beforeEach(() => {
	jest.clearAllMocks();
	fileSystem.reset();
});

describe("saveCodeToGallery", () => {
	it("saves a PNG of the code when access is granted", async () => {
		onPlatform("ios", 18);
		media.getPermissionsAsync.mockResolvedValue(permission(true));
		await expect(saveCodeToGallery("qr", "hello")).resolves.toBe("granted");
		const [uri] = media.Asset.create.mock.calls[0];
		expect(uri).toMatch(/^file:\/\/\/cache\/code-\d+\.png$/);
		expect(fileSystem.read(uri)).toEqual(new Uint8Array([137, 80, 78, 71]));
		// 1024px of code and 64px of paper on each side.
		expect(drawAsImage).toHaveBeenCalledWith(expect.anything(), {
			width: 1152,
			height: 1152,
		});
	});

	it("asks for access once, and saves if the user agrees", async () => {
		onPlatform("ios", 18);
		media.getPermissionsAsync.mockResolvedValue(permission(false));
		media.requestPermissionsAsync.mockResolvedValue(permission(true));
		await expect(saveCodeToGallery("qr", "hello")).resolves.toBe("granted");
		expect(media.requestPermissionsAsync).toHaveBeenCalledWith(true, ["photo"]);
		expect(media.Asset.create).toHaveBeenCalledTimes(1);
	});

	it("saves nothing when the user says no", async () => {
		onPlatform("ios", 18);
		media.getPermissionsAsync.mockResolvedValue(permission(false));
		media.requestPermissionsAsync.mockResolvedValue(permission(false));
		await expect(saveCodeToGallery("qr", "hello")).resolves.toBe("denied");
		expect(media.Asset.create).not.toHaveBeenCalled();
	});

	it("reports access blocked in the settings, without asking", async () => {
		onPlatform("ios", 18);
		media.getPermissionsAsync.mockResolvedValue(permission(false, false));
		await expect(saveCodeToGallery("qr", "hello")).resolves.toBe("blocked");
		expect(media.requestPermissionsAsync).not.toHaveBeenCalled();
	});

	it("reports access blocked after a final refusal", async () => {
		onPlatform("ios", 18);
		media.getPermissionsAsync.mockResolvedValue(permission(false));
		media.requestPermissionsAsync.mockResolvedValue(permission(false, false));
		await expect(saveCodeToGallery("qr", "hello")).resolves.toBe("blocked");
	});

	it("doesn't ask for any permission on Android 10+", async () => {
		onPlatform("android", 29);
		await expect(saveCodeToGallery("ean13", "5901234123457")).resolves.toBe(
			"granted",
		);
		expect(media.getPermissionsAsync).not.toHaveBeenCalled();
		expect(media.requestPermissionsAsync).not.toHaveBeenCalled();
		expect(media.Asset.create).toHaveBeenCalledTimes(1);
	});

	it("asks on older Android versions", async () => {
		onPlatform("android", 28);
		media.getPermissionsAsync.mockResolvedValue(permission(true));
		await saveCodeToGallery("qr", "hello");
		expect(media.getPermissionsAsync).toHaveBeenCalled();
	});

	it("fails for a code that can't be drawn", async () => {
		onPlatform("android", 34);
		await expect(saveCodeToGallery("code93", "x")).rejects.toThrow("code93");
		expect(media.Asset.create).not.toHaveBeenCalled();
	});
});
