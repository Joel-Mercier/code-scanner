import type { BarcodeType } from "expo-camera";
import { View } from "react-native";
import { isLinearBarcode } from "@/domain/codes/formats";
import { type CodeStyle, hasPaper, paperOf } from "@/domain/codes/style";
import { makeStyles } from "@/theme";
import { CodeArt } from "./CodeArt";

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
	const barHeight = thumbnail && isLinearBarcode(format) ? 0.44 : undefined;
	if (!hasPaper(style)) {
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
					backgroundColor: paperOf(style),
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

const useStyles = makeStyles(() => ({
	paper: { alignItems: "center", justifyContent: "center" },
}));
