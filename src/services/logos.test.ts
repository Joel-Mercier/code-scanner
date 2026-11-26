import { fileSystem } from "@/test/fileSystem";
import { persistLogo } from "./logos";

beforeEach(() => fileSystem.reset());
afterEach(() => jest.useRealTimers());

describe("persistLogo", () => {
	it("copies the picked image into the app's documents", async () => {
		jest.useFakeTimers({ now: 1_700_000_000_000 });
		fileSystem.seed("file:///cache/picker/IMG_1.png", 4);
		const uri = await persistLogo("file:///cache/picker/IMG_1.png");
		expect(uri).toBe(
			`file:///document/logos/${(1_700_000_000_000).toString(36)}.png`,
		);
		expect(fileSystem.read(uri)).toHaveLength(4);
	});

	it("defaults to .jpg", async () => {
		fileSystem.seed("file:///cache/picker/image", 1);
		expect(await persistLogo("file:///cache/picker/image")).toMatch(/\.jpg$/);
	});
});
