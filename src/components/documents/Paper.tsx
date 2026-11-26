import { View } from "react-native";
import { makeStyles } from "@/theme";

/** A page of text, drawn as lines (the design's paper illustration). */
export function Paper({
	width,
	height,
	scale = 1,
}: {
	width: number;
	height: number;
	scale?: number;
}) {
	const styles = useStyles();
	const line = (extra: object) => [styles.line, { height: 4 * scale }, extra];
	return (
		<View
			style={[
				styles.paper,
				{
					width,
					height,
					paddingVertical: 20 * scale,
					paddingHorizontal: 18 * scale,
					gap: 8 * scale,
				},
			]}
		>
			<View style={[styles.heading, { height: 5 * scale, width: "30%" }]} />
			<View style={line({ width: "45%", marginLeft: "auto" })} />
			<View style={line({ marginTop: 8 * scale })} />
			<View style={line({})} />
			<View style={line({ width: "70%" })} />
			<View style={line({})} />
		</View>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	paper: { backgroundColor: colors.paper, borderRadius: 3 },
	heading: {
		backgroundColor: colors.accent,
		opacity: 0.55,
		borderRadius: 1,
	},
	line: { backgroundColor: colors.paperLine },
}));
