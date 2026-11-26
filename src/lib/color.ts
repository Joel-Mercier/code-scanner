const channel = (value: number) => {
	const c = value / 255;
	return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/** WCAG relative luminance of a `#rgb` / `#rrggbb` colour. */
export const luminance = (hex: string) => {
	let value = hex.replace("#", "");
	if (value.length === 3) {
		value = value
			.split("")
			.map((c) => c + c)
			.join("");
	}
	const n = Number.parseInt(value.slice(0, 6), 16);
	if (Number.isNaN(n)) return 0;
	return (
		0.2126 * channel((n >> 16) & 255) +
		0.7152 * channel((n >> 8) & 255) +
		0.0722 * channel(n & 255)
	);
};

/** Ink or white: whichever reads on top of `fill` (checks, selected icons). */
export const readableOn = (fill: string) =>
	luminance(fill) > 0.45 ? "#0E0E10" : "#FFFFFF";

/** `#rrggbb` with an opacity, as `rgba()` (for gradients). */
export const withAlpha = (hex: string, alpha: number) => {
	const n = Number.parseInt(hex.replace("#", "").slice(0, 6), 16);
	return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** `#rrggbb` (lowercase) from `rgb`, `#rgb`, `rrggbb` or `#rrggbb`; `null` if invalid. */
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

/** WCAG contrast ratio between two colours (1 to 21). */
export const contrastRatio = (a: string, b: string) => {
	const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (light + 0.05) / (dark + 0.05);
};
