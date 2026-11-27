import { Share as NativeShare } from "react-native";
import Share from "react-native-share";
import { makeCode, makeDoc } from "@/test/fixtures";
import { namedPdf } from "./documents";
import { shareItem, shareItems } from "./share";

jest.mock("react-native-share", () => ({ open: jest.fn() }));
jest.mock("./documents", () => ({
	namedPdf: jest.fn(
		async (doc: { name: string }) => `file:///cache/${doc.name}.pdf`,
	),
}));

beforeEach(() => {
	jest.clearAllMocks();
	jest
		.spyOn(NativeShare, "share")
		.mockResolvedValue({ action: "sharedAction", activityType: undefined });
});

describe("shareItem", () => {
	it("shares a document's PDF, named after it", async () => {
		const doc = makeDoc({ name: "Lease", pdf: "document.pdf" });
		await shareItem(doc);
		expect(namedPdf).toHaveBeenCalledWith(doc);
		expect(Share.open).toHaveBeenCalledWith({
			url: "file:///cache/Lease.pdf",
			type: "application/pdf",
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

describe("shareItems", () => {
	it("shares the documents' PDFs with the codes as the message", async () => {
		await shareItems([
			makeDoc({ id: "a", name: "A" }),
			makeCode({ id: "c", data: "hello" }),
			makeDoc({ id: "b", name: "B" }),
			makeCode({ id: "d", data: "world" }),
		]);
		expect(Share.open).toHaveBeenCalledWith({
			urls: ["file:///cache/A.pdf", "file:///cache/B.pdf"],
			type: "application/pdf",
			message: "hello\n\nworld",
			failOnCancel: false,
		});
	});

	it("shares codes alone as text", async () => {
		await shareItems([
			makeCode({ id: "a", data: "one" }),
			makeCode({ id: "b", data: "two" }),
		]);
		expect(NativeShare.share).toHaveBeenCalledWith({ message: "one\n\ntwo" });
	});

	it("shares a single item like shareItem", async () => {
		await shareItems([makeCode({ data: "solo" })]);
		expect(NativeShare.share).toHaveBeenCalledWith({ message: "solo" });
	});
});
