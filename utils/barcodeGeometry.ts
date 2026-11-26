import {
	Skia,
	type SkPath,
	type SkPathBuilder,
} from "@shopify/react-native-skia";
import bwipjs, {
	type DrawingContext,
	type RenderOptions,
} from "bwip-js/generic";
import type { BarcodeType } from "expo-camera";

export type GeneratableBarcode = Exclude<BarcodeType, "qr" | "code93">;

export const bwipIds: Record<GeneratableBarcode, string> = {
	aztec: "azteccode",
	codabar: "rationalizedCodabar",
	code128: "code128",
	code39: "code39",
	datamatrix: "datamatrix",
	ean13: "ean13",
	ean8: "ean8",
	itf14: "itf14",
	pdf417: "pdf417",
	upc_a: "upca",
	upc_e: "upce",
};

export const isLinearBarcode = (type: GeneratableBarcode) =>
	!["aztec", "datamatrix", "pdf417"].includes(type);

export type BarcodeGeometry = {
	width: number;
	height: number;
	/** Bars / modules, in barcode pixels. */
	bars: SkPath;
	/** Human readable text, drawn with bwip-js' built-in OCR-B glyph paths. */
	text: SkPath;
};

const skiaDrawing = (): DrawingContext<BarcodeGeometry> => {
	let options: RenderOptions;
	let width = 0;
	let height = 0;
	let dx = 0;
	let dy = 0;
	const bars = Skia.PathBuilder.Make();
	const text = Skia.PathBuilder.Make();
	let pending: SkPathBuilder | null = null;
	const { FontLib } = bwipjs;

	const current = () => {
		if (!pending) pending = Skia.PathBuilder.Make();
		return pending;
	};

	return {
		setopts(opts) {
			options = opts;
		},
		scale() {
			return null;
		},
		measure(str, font, fwidth, fheight) {
			const fontId = FontLib.lookup(font);
			let measured = 0;
			let ascent = 0;
			let descent = 0;
			for (let i = 0; i < str.length; i++) {
				const glyph = FontLib.getglyph(
					fontId,
					str.charCodeAt(i),
					fwidth | 0,
					fheight | 0,
				);
				if (!glyph) continue;
				ascent = Math.max(ascent, glyph.top);
				descent = Math.max(descent, glyph.height - glyph.top);
				measured +=
					i === str.length - 1 ? glyph.left + glyph.width : glyph.advance;
			}
			return { width: measured, ascent, descent };
		},
		init(w, h) {
			dx = options.paddingleft ?? 0;
			dy = options.paddingtop ?? 0;
			width = w + dx + (options.paddingright ?? 0);
			height = h + dy + (options.paddingbottom ?? 0);
		},
		line(x0, y0, x1, y1, lw) {
			const half = (Math.round(lw) || 1) / 2;
			if (x0 === x1) {
				bars.addRect(
					Skia.XYWHRect(
						x0 - half + dx,
						Math.min(y0, y1) + dy,
						half * 2,
						Math.abs(y1 - y0) + 1,
					),
				);
			} else {
				bars.addRect(
					Skia.XYWHRect(
						Math.min(x0, x1) + dx,
						y0 - half + dy,
						Math.abs(x1 - x0) + 1,
						half * 2,
					),
				);
			}
		},
		polygon(points) {
			const path = current();
			path.moveTo(points[0][0] + dx, points[0][1] + dy);
			for (let i = 1; i < points.length; i++) {
				path.lineTo(points[i][0] + dx, points[i][1] + dy);
			}
			path.close();
		},
		hexagon(points) {
			this.polygon(points);
		},
		ellipse(x, y, rx, ry) {
			current().addOval(
				Skia.XYWHRect(x - rx + dx, y - ry + dy, rx * 2, ry * 2),
			);
		},
		fill() {
			if (pending) {
				bars.addPath(pending.build());
				pending = null;
			}
		},
		text(x, y, str, _rgb, font) {
			const fontId = FontLib.lookup(font.name);
			const fwidth = font.width | 0;
			const fheight = font.height | 0;
			let cursor = x;
			for (let k = 0; k < str.length; k++) {
				const code = str.charCodeAt(k);
				const glyph = FontLib.getpaths(fontId, code, fwidth, fheight);
				if (glyph?.length) {
					for (const seg of glyph) {
						if (seg.type === "M") {
							text.moveTo(seg.x + cursor + dx, y - seg.y + dy);
						} else if (seg.type === "L") {
							text.lineTo(seg.x + cursor + dx, y - seg.y + dy);
						} else if (seg.type === "Q") {
							text.quadTo(
								seg.cx + cursor + dx,
								y - seg.cy + dy,
								seg.x + cursor + dx,
								y - seg.y + dy,
							);
						} else if (seg.type === "C") {
							text.cubicTo(
								seg.cx1 + cursor + dx,
								y - seg.cy1 + dy,
								seg.cx2 + cursor + dx,
								y - seg.cy2 + dy,
								seg.x + cursor + dx,
								y - seg.y + dy,
							);
						}
					}
					text.close();
				}
				cursor +=
					FontLib.getglyph(fontId, code, fwidth, fheight).advance +
					(font.dx | 0);
			}
		},
		end() {
			return { width, height, bars: bars.build(), text: text.build() };
		},
	};
};

export type BarcodeOptions = {
	/** Bar height in millimetres, as understood by bwip-js (linear codes only). */
	height?: number;
	includeText?: boolean;
	textPosition?: "bottom" | "top";
};

/** Throws when `content` is not valid for the symbology. */
export const buildBarcode = (
	type: GeneratableBarcode,
	content: string,
	{
		height = 12,
		includeText = true,
		textPosition = "bottom",
	}: BarcodeOptions = {},
): BarcodeGeometry => {
	const linear = isLinearBarcode(type);
	return bwipjs.render(
		{
			bcid: bwipIds[type],
			text: content,
			scale: 3,
			padding: 0,
			...(linear
				? {
						height,
						includetext: includeText,
						textxalign: "center",
						textyalign: textPosition === "top" ? "above" : "below",
					}
				: {}),
		},
		skiaDrawing(),
	);
};

export const validateBarcode = (type: GeneratableBarcode, content: string) => {
	try {
		buildBarcode(type, content);
		return null;
	} catch (error) {
		return error instanceof Error
			? error.message.replace(/^bwipp\.\w+#?\d*:\s*/, "")
			: String(error);
	}
};
