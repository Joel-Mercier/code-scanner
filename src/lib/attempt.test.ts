import { attempt } from "./attempt";

describe("attempt", () => {
	it("wraps a result", async () => {
		await expect(attempt(async () => 42)).resolves.toEqual({
			ok: true,
			value: 42,
		});
	});

	it("reports a failure as a value, and logs it", async () => {
		const log = jest.spyOn(console, "error").mockImplementation(() => {});
		const error = new Error("boom");
		await expect(
			attempt(async () => {
				throw error;
			}),
		).resolves.toEqual({ ok: false, error });
		expect(log).toHaveBeenCalledWith(error);
		log.mockRestore();
	});
});
