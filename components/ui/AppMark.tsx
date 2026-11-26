import { View } from "react-native";
import { makeStyles, useSharedStyles } from "@/theme";

/** The app's mark: three rings and a blue dot, on a floating tile. */
export function AppMark({ size = 64 }: { size?: number }) {
	const shared = useSharedStyles();
	const styles = useStyles();
	const cell = size / 4;
	const gap = size * 0.094;
	const ring = [
		styles.ring,
		{
			width: cell,
			height: cell,
			borderRadius: cell / 2,
			borderWidth: cell / 4,
		},
	];
	return (
		<View
			style={[
				shared.floating,
				shared.center,
				{ width: size, height: size, borderRadius: size * 0.28, gap },
			]}
		>
			<View style={[shared.row, { gap }]}>
				<View style={ring} />
				<View style={ring} />
			</View>
			<View style={[shared.row, { gap }]}>
				<View style={ring} />
				<View
					style={[
						styles.dot,
						{ width: cell, height: cell, borderRadius: cell / 2 },
					]}
				/>
			</View>
		</View>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	ring: { borderColor: colors.ink },
	dot: { backgroundColor: colors.accent, transform: [{ scale: 0.6 }] },
}));
