import { FREE_ATTEMPTS, lockoutDelay, secondsLeft } from "./throttle";

describe("lockoutDelay", () => {
	it("lets the first few wrong guesses through", () => {
		for (let failures = 0; failures < FREE_ATTEMPTS; failures++) {
			expect(lockoutDelay(failures)).toBe(0);
		}
	});

	it("waits longer and longer after that, up to a ceiling", () => {
		expect(lockoutDelay(FREE_ATTEMPTS)).toBe(30_000);
		expect(lockoutDelay(FREE_ATTEMPTS + 1)).toBe(60_000);
		expect(lockoutDelay(FREE_ATTEMPTS + 2)).toBe(300_000);
		expect(lockoutDelay(FREE_ATTEMPTS + 3)).toBe(900_000);
		expect(lockoutDelay(FREE_ATTEMPTS + 30)).toBe(900_000);
	});
});

describe("secondsLeft", () => {
	it("rounds up, and stops at zero", () => {
		expect(secondsLeft(10_500, 10_000)).toBe(1);
		expect(secondsLeft(40_000, 10_000)).toBe(30);
		expect(secondsLeft(5_000, 10_000)).toBe(0);
	});
});
