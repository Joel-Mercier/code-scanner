import { contrastRatio, luminance } from "@/lib/color";

/** Ink colours for created codes: dark enough on light papers for scanners. */
export const codeInks = {
	ink: "#0E0E10",
	blue: "#2A44FF",
	teal: "#0F766E",
	plum: "#7E2E84",
	rust: "#B4471C",
	slate: "#3F4A5A",
} as const;

export type CodeInk = keyof typeof codeInks;

/** Every `codeInks` colour keeps at least 4:1 contrast on these. */
export const codePapers = {
	white: "#FFFFFF",
	stone: "#F1F1EE",
	butter: "#FFF6DB",
	mint: "#E8F5EE",
	sky: "#E9ECFF",
	blush: "#FCE8EC",
} as const;

export type CodePaper = keyof typeof codePapers;

/** Codes are printed objects: dark ink on light paper, whatever the theme. */
export const codeDefaults = { ink: codeInks.ink, paper: codePapers.white };

export type QRDotStyle = "square" | "rounded" | "dots";

/** How a created code is drawn. Scanned codes have none. */
export type CodeStyle = {
	/** A `codeInks` preset, or a custom `#rrggbb` colour. */
	color: CodeInk | (string & {});
	/** A `codePapers` preset, or a custom `#rrggbb` colour. Defaults to white. */
	background?: CodePaper | (string & {});
	dots?: QRDotStyle;
	/** A logo image in the app's documents, drawn in the middle of QR codes. */
	logo?: string;
};

const isCodeInk = (value: string): value is CodeInk => value in codeInks;
const isCodePaper = (value: string): value is CodePaper => value in codePapers;

/** Foreground colour of a code: a preset key or a custom hex. */
export const inkOf = (style?: Pick<CodeStyle, "color">) => {
	const value = style?.color ?? "ink";
	return isCodeInk(value) ? codeInks[value] : value;
};

/** Background colour of a code: a preset key or a custom hex. */
export const paperOf = (style?: Pick<CodeStyle, "background">) => {
	const value = style?.background ?? "white";
	return isCodePaper(value) ? codePapers[value] : value;
};

/** Whether a code gets its own rounded paper (and so less card padding). */
export const hasPaper = (style?: CodeStyle) =>
	paperOf(style).toLowerCase() !== codeDefaults.paper.toLowerCase();

/**
 * Scanners need a dark code on a light background with enough contrast.
 * Inverted (light-on-dark) codes only work with some scanner apps.
 */
export const scanRisk = (ink: string, paper: string) => {
	if (luminance(ink) > luminance(paper)) return "inverted" as const;
	if (contrastRatio(ink, paper) < 3) return "low_contrast" as const;
	return null;
};
