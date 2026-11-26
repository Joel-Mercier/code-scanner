/** @jest-environment @shopify/react-native-skia/jestEnv.js */
import "@shopify/react-native-skia/jestSetup.js";
import { buildQR } from "./qr";

describe("buildQR", () => {
	it("encodes short text as a version 1 symbol (21 modules)", () => {
		expect(buildQR("hello").modules).toBe(21);
	});

	it("grows with the content and the error correction", () => {
		const long = "https://example.com/".repeat(10);
		expect(buildQR(long).modules).toBeGreaterThan(21);
		expect(buildQR(long, { ecc: "high" }).modules).toBeGreaterThan(
			buildQR(long, { ecc: "low" }).modules,
		);
	});

	it("still draws something for empty text", () => {
		expect(buildQR("").modules).toBe(21);
	});

	it.each(["square", "rounded", "dots"] as const)(
		"draws %s modules and three eyes inside the symbol",
		(style) => {
			const { modules, dots, eyes } = buildQR("hello", { style });
			expect(dots.countPoints()).toBeGreaterThan(0);
			const eyeBounds = eyes.computeTightBounds();
			expect(eyeBounds.x).toBeCloseTo(0);
			expect(eyeBounds.y).toBeCloseTo(0);
			expect(eyeBounds.width).toBeCloseTo(modules);
			expect(eyeBounds.height).toBeCloseTo(modules);
			const dotBounds = dots.computeTightBounds();
			expect(dotBounds.x + dotBounds.width).toBeLessThanOrEqual(modules + 0.1);
		},
	);

	it("keeps the centre free for a logo", () => {
		const text = "https://example.com/menu";
		const { modules, dots } = buildQR(text, {
			ecc: "high",
			style: "square",
			logoRatio: 0.24,
		});
		const full = buildQR(text, { ecc: "high", style: "square" }).dots;
		expect(dots.countPoints()).toBeLessThan(full.countPoints());
		const centre = modules / 2;
		expect(dots.contains(centre, centre)).toBe(false);
	});
});
