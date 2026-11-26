import i18n from "@/i18n";

/** "1.4 MB", with a localised unit. */
export function formatBytes(bytes: number): string {
	let unit = 0;
	let value = bytes || 0;
	while (value >= 1024 && ++unit) {
		value = value / 1024;
	}
	return `${value.toFixed(value < 10 && unit > 0 ? 1 : 0)} ${i18n.t(`app.shared.fileSizes.${unit}`)}`;
}
