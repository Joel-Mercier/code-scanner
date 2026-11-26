import { Share as NativeShare } from "react-native";
import Share from "react-native-share";
import { makeCode, makeDoc } from "@/test/fixtures";
import { shareItem } from "./share";

jest.mock("react-native-share", () => ({ open: jest.fn() }));

beforeEach(() => {
	jest.clearAllMocks();
	jest
		.spyOn(NativeShare, "share")
		.mockResolvedValue({ action: "sharedAction", activityType: undefined });
});

describe("shareItem", () => {
	it("shares a document's PDF", async () => {
		await shareItem(makeDoc({ pdfUri: "file:///doc.pdf" }));
		expect(Share.open).toHaveBeenCalledWith({
			url: "file:///doc.pdf",
			type: "application/pdf",
			failOnCancel: false,
		});
	});

	it("shares the first page of a document without a PDF", async () => {
		await shareItem(makeDoc({ pages: ["file:///p1.jpg", "file:///p2.jpg"] }));
		expect(Share.open).toHaveBeenCalledWith({
			url: "file:///p1.jpg",
			type: "image/jpeg",
			failOnCancel: false,
		});
	});

	it("shares a code's content as text", async () => {
		await shareItem(makeCode({ data: "WIFI:S:Home;;" }));
		expect(NativeShare.share).toHaveBeenCalledWith({
			message: "WIFI:S:Home;;",
		});
		expect(Share.open).not.toHaveBeenCalled();
	});
});
