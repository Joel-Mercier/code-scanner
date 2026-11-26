import type { BarcodeType } from "expo-camera";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import type { CodeStyle } from "@/stores/library";
import { codeDefaults, makeStyles } from "@/theme";
import { isLinearBarcode } from "@/utils/barcodeGeometry";
import { CodeArt } from "./CodeArt";
import { paperOf } from "./codeColors";

const isLinear = (format: BarcodeType) =>
	format !== "qr" &&
	isLinearBarcode(format as Parameters<typeof isLinearBarcode>[0]);

type CodeFaceProps = {
	format: BarcodeType;
	data: string;
	style?: CodeStyle;
	/** Width of the area to fill. */
	size: number;
	/** Linear barcodes as bars only (thumbnails). */
	thumbnail?: boolean;
};

/**
 * A code as drawn on a white card: bare on white, or on its own rounded
 * paper when it has a background colour.
 */
export function CodeFace({
	format,
	data,
	style,
	size,
	thumbnail = false,
}: CodeFaceProps) {
	const styles = useStyles();
	const paper = paperOf(style);
	const barHeight = thumbnail && isLinear(format) ? 0.44 : undefined;
	if (paper.toLowerCase() === codeDefaults.paper.toLowerCase()) {
		return (
			<CodeArt
				format={format}
				data={data}
				style={style}
				size={size}
				barHeight={barHeight}
			/>
		);
	}
	const padding = size * 0.09;
	return (
		<View
			style={[
				styles.paper,
				{
					width: size,
					height: format === "qr" ? size : undefined,
					borderRadius: size * 0.14,
					padding,
					backgroundColor: paper,
				},
			]}
		>
			<CodeArt
				format={format}
				data={data}
				style={style}
				size={size - padding * 2}
				barHeight={barHeight}
			/>
		</View>
	);
}

/** Whether a code gets its own rounded paper (and so less card padding). */
export const hasPaper = (style?: CodeStyle) =>
	paperOf(style).toLowerCase() !== codeDefaults.paper.toLowerCase();

/** A small page: the first scanned page, framed like a sheet of paper. */
export function PageThumb({ uri, width }: { uri?: string; width: number }) {
	const styles = useStyles();
	return (
		<View
			style={[styles.page, { width, height: width * (4 / 3) }]}
			accessibilityIgnoresInvertColors
		>
			{uri && (
				<Image
					source={uri}
					style={StyleSheet.absoluteFill}
					contentFit="cover"
					transition={150}
				/>
			)}
		</View>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	paper: { alignItems: "center", justifyContent: "center" },
	page: {
		borderRadius: 3,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surface,
		overflow: "hidden",
	},
}));
