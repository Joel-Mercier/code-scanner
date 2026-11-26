import { View } from "react-native";
import { makeStyles, radii, useSharedStyles, useTheme } from "@/theme";
import { Icon } from "./Icon";

/** A tile that couldn't be drawn: a dashed square with a warning. */
export function BrokenTile({ size, label }: { size: number; label: string }) {
	const { colors } = useTheme();
	const shared = useSharedStyles();
	const styles = useStyles();
	return (
		<View
			accessible
			accessibilityLabel={label}
			style={[
				shared.dashed,
				shared.center,
				styles.tile,
				{ width: size, height: size },
			]}
		>
			<Icon name="alert" size={18} color={colors.muted} />
		</View>
	);
}

const useStyles = makeStyles(() => ({
	tile: { borderRadius: radii.lg },
}));
