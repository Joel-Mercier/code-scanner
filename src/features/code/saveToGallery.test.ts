import { Alert, Linking } from "react-native";
import { saveCodeToGallery } from "@/components/codes/exportCode";
import { toast } from "@/components/ui/Toast";
import { makeCode } from "@/test/fixtures";
import { saveToGallery } from "./saveToGallery";

jest.mock("@/components/codes/exportCode", () => ({
	saveCodeToGallery: jest.fn(),
}));
jest.mock("@/components/ui/Toast", () => ({ toast: jest.fn() }));

const save = jest.mocked(saveCodeToGallery);
const item = makeCode({ data: "hello", style: { color: "blue" } });

beforeEach(() => {
	jest.clearAllMocks();
	jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

describe("saveToGallery", () => {
	it("renders the code with its style and confirms", async () => {
		save.mockResolvedValue("granted");
		await saveToGallery(item);
		expect(save).toHaveBeenCalledWith("qr", "hello", { color: "blue" });
		expect(toast).toHaveBeenCalledWith("Saved to your photos");
		expect(Alert.alert).not.toHaveBeenCalled();
	});

	it("offers the settings when access is blocked", async () => {
		save.mockResolvedValue("blocked");
		const openSettings = jest
			.spyOn(Linking, "openSettings")
			.mockResolvedValue(undefined);
		await saveToGallery(item);
		expect(toast).not.toHaveBeenCalled();
		const [, , buttons] = jest.mocked(Alert.alert).mock.calls[0];
		buttons?.[1].onPress?.();
		expect(openSettings).toHaveBeenCalled();
	});

	it("warns when access is denied", async () => {
		save.mockResolvedValue("denied");
		await saveToGallery(item);
		expect(toast).toHaveBeenCalledWith("Permission needed", "warning");
	});

	it("warns when saving fails", async () => {
		jest.spyOn(console, "error").mockImplementation(() => {});
		save.mockRejectedValue(new Error("disk full"));
		await saveToGallery(item);
		expect(toast).toHaveBeenCalledWith("Something went wrong", "warning");
	});
});
