import { toast } from "@/components/ui/Toast";
import { exportDocument } from "@/services/documents";
import { makeDoc } from "@/test/fixtures";
import { saveDocumentToFiles } from "./actions";

jest.mock("@/services/documents", () => ({ exportDocument: jest.fn() }));
jest.mock("@/components/ui/Toast", () => ({ toast: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

describe("saveDocumentToFiles", () => {
	it("exports the document and confirms", async () => {
		const doc = makeDoc();
		await saveDocumentToFiles(doc);
		expect(exportDocument).toHaveBeenCalledWith(doc);
		expect(toast).toHaveBeenCalledTimes(1);
	});

	it("stays quiet when the user cancels the folder picker", async () => {
		jest.spyOn(console, "error").mockImplementation(() => {});
		jest.mocked(exportDocument).mockRejectedValue(new Error("cancelled"));
		await saveDocumentToFiles(makeDoc());
		expect(toast).not.toHaveBeenCalled();
	});
});
