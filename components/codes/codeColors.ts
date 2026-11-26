import type { CodeStyle } from "@/stores/library";
import {
	type CodeInk,
	type CodePaper,
	codeInks,
	codePapers,
	luminance,
} from "@/theme";

export const isCodeInk = (value: string): value is CodeInk => value in codeInks;
export const isCodePaper = (value: string): value is CodePaper =>
	value in codePapers;

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

export const contrastRatio = (a: string, b: string) => {
	const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (light + 0.05) / (dark + 0.05);
};

/**
 * Scanners need a dark code on a light background with enough contrast.
 * Inverted (light-on-dark) codes only work with some scanner apps.
 */
export const scanRisk = (ink: string, paper: string) => {
	if (luminance(ink) > luminance(paper)) return "inverted" as const;
	if (contrastRatio(ink, paper) < 3) return "low_contrast" as const;
	return null;
};

export const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export const normalizeHex = (value: string) => {
	const match = value.trim().match(HEX_PATTERN);
	if (!match) return null;
	let hex = match[1].toLowerCase();
	if (hex.length === 3) {
		hex = hex
			.split("")
			.map((c) => c + c)
			.join("");
	}
	return `#${hex}`;
};
