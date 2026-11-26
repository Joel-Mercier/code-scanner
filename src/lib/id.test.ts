import { createId } from "./id";

describe("createId", () => {
	it("is a time part and a random part", () => {
		expect(createId()).toMatch(/^[0-9a-z]+-[0-9a-z]{1,6}$/);
	});

	it("doesn't repeat", () => {
		const ids = new Set(Array.from({ length: 1000 }, createId));
		expect(ids.size).toBe(1000);
	});
});
