import { View } from "react-native";
import type { QRDotStyle } from "@/domain/codes/style";
import { makeStyles } from "@/theme";

/** The little glyphs in the "Dots" control. */
export function DotGlyph({
	style,
	color,
}: {
	style: QRDotStyle;
	color: string;
}) {
	const styles = useStyles();
	if (style === "rounded") {
		return (
			<View style={styles.column}>
				<View style={[styles.pill, { backgroundColor: color }]} />
				<View style={[styles.cell, styles.round, { backgroundColor: color }]} />
			</View>
		);
	}
	const cell = [
		styles.cell,
		style === "dots" && styles.round,
		{ backgroundColor: color },
	];
	return (
		<View style={styles.grid}>
			<View style={cell} />
			<View style={cell} />
			<View style={cell} />
			<View style={styles.cell} />
		</View>
	);
}

const useStyles = makeStyles(() => ({
	grid: { width: 12, flexDirection: "row", flexWrap: "wrap", gap: 2 },
	column: { gap: 2 },
	cell: { width: 5, height: 5 },
	pill: { width: 12, height: 5, borderRadius: 3 },
	round: { borderRadius: 3 },
}));
