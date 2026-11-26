import encodeQR, { type ErrorCorrection } from "@paulmillr/qr";
import {
	FillType,
	Skia,
	type SkPath,
	type SkPathBuilder,
} from "@shopify/react-native-skia";
import type { QRDotStyle } from "@/domain/codes/style";

export type QRGeometry = {
	/** Number of modules per side (no quiet zone). */
	modules: number;
	/** Data modules, in module units. */
	dots: SkPath;
	/** The three finder "eyes", in module units. */
	eyes: SkPath;
};

const FINDER = 7;
/** Width of the rounded style's pills (a 0.78 stroke with round caps). */
const PILL = 0.78;
/** Diameter of the dot style's modules (a 0.84 stroke with round caps). */
const DOT = 0.84;

const isFinder = (x: number, y: number, n: number) =>
	(x < FINDER && y < FINDER) ||
	(x >= n - FINDER && y < FINDER) ||
	(x < FINDER && y >= n - FINDER);

const rrect = (
	path: SkPathBuilder,
	x: number,
	y: number,
	size: number,
	radius: number,
) => {
	path.addRRect(Skia.RRectXY(Skia.XYWHRect(x, y, size, size), radius, radius));
};

/** Outer ring + centre, drawn even-odd: square, rounded or concentric circles. */
const addEye = (
	path: SkPathBuilder,
	x: number,
	y: number,
	style: QRDotStyle,
) => {
	if (style === "dots") {
		path.addCircle(x + 3.5, y + 3.5, 3.5);
		path.addCircle(x + 3.5, y + 3.5, 2.5);
		path.addCircle(x + 3.5, y + 3.5, 1.5);
		return;
	}
	const rounded = style === "rounded";
	rrect(path, x, y, 7, rounded ? 2 : 0);
	rrect(path, x + 1, y + 1, 5, rounded ? 1.2 : 0);
	rrect(path, x + 2, y + 2, 3, rounded ? 0.9 : 0);
};

/**
 * Draws a QR symbol the way the design does: plain squares, horizontal runs
 * of modules joined into pills, or round dots with circular eyes.
 *
 * @param logoRatio fraction of the symbol (0..0.3) kept free in the centre for a logo.
 */
export const buildQR = (
	text: string,
	{
		ecc = "medium",
		style = "dots",
		logoRatio = 0,
	}: { ecc?: ErrorCorrection; style?: QRDotStyle; logoRatio?: number } = {},
): QRGeometry => {
	const matrix = encodeQR(text || " ", "raw", { ecc, border: 0 });
	const n = matrix.length;
	const dots = Skia.PathBuilder.Make();
	const eyes = Skia.PathBuilder.Make();
	eyes.setFillType(FillType.EvenOdd);

	const hole = Math.ceil(n * logoRatio);
	const holeStart = Math.floor((n - hole) / 2);
	const inHole = (x: number, y: number) =>
		hole > 0 &&
		x >= holeStart &&
		x < holeStart + hole &&
		y >= holeStart &&
		y < holeStart + hole;
	const isOn = (x: number, y: number) =>
		x < n && !!matrix[y][x] && !isFinder(x, y, n) && !inHole(x, y);

	for (let y = 0; y < n; y++) {
		for (let x = 0; x < n; x++) {
			if (!isOn(x, y)) continue;
			if (style === "square") {
				dots.addRect(Skia.XYWHRect(x, y, 1.02, 1.02));
			} else if (style === "dots") {
				dots.addCircle(x + 0.5, y + 0.5, DOT / 2);
			} else {
				let end = x;
				while (isOn(end + 1, y)) end++;
				const length = end - x;
				dots.addRRect(
					Skia.RRectXY(
						Skia.XYWHRect(
							x + 0.5 - PILL / 2,
							y + 0.5 - PILL / 2,
							length + PILL,
							PILL,
						),
						PILL / 2,
						PILL / 2,
					),
				);
				x = end;
			}
		}
	}
	addEye(eyes, 0, 0, style);
	addEye(eyes, n - FINDER, 0, style);
	addEye(eyes, 0, n - FINDER, style);
	return { modules: n, dots: dots.build(), eyes: eyes.build() };
};
