import {
	type GestureResponderEvent,
	type StyleProp,
	View,
	type ViewStyle,
} from "react-native";
import { makeStyles, radii, useTheme } from "@/theme";
import { Icon, type IconName } from "./Icon";
import { Pressable } from "./Pressable";
import { Text } from "./Text";

type Variant = "primary" | "secondary" | "danger" | "dashed";

type ButtonProps = {
	label: string;
	icon?: IconName;
	variant?: Variant;
	onPress?: (event: GestureResponderEvent) => void;
	/** Looks disabled; still pressable when `inert` is false (to reveal errors). */
	disabled?: boolean;
	inert?: boolean;
	style?: StyleProp<ViewStyle>;
};

export function Button({
	label,
	icon,
	variant = "primary",
	onPress,
	disabled = false,
	inert = disabled,
	style,
}: ButtonProps) {
	const { colors } = useTheme();
	const styles = useStyles();
	const primary = variant === "primary";
	const looksDisabled = disabled && primary;
	const textColor = looksDisabled
		? colors.muted
		: primary
			? colors.onAccent
			: variant === "danger"
				? colors.danger
				: colors.ink;
	const large = primary || variant === "danger" || variant === "dashed";

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{ disabled }}
			disabled={inert}
			onPress={onPress}
			haptic={!disabled}
			style={[
				styles.base,
				large ? styles.large : styles.small,
				styles[variant],
				looksDisabled && styles.disabled,
				style,
			]}
		>
			{icon && (
				<Icon
					name={icon}
					size={large ? 20 : 18}
					color={textColor}
					strokeWidth={primary ? 2 : 1.75}
				/>
			)}
			<Text
				size={primary ? 17 : variant === "danger" ? 16 : 15}
				weight={primary ? "semibold" : "medium"}
				color={textColor}
				numberOfLines={1}
				style={styles.label}
			>
				{label}
			</Text>
		</Pressable>
	);
}

/** Two secondary buttons per row, like the design's action grids. */
export function ButtonGrid({ children }: { children: React.ReactNode }) {
	const styles = useStyles();
	return <View style={styles.grid}>{children}</View>;
}

export const gridCell: ViewStyle = { flexBasis: "47%", flexGrow: 1 };

const useStyles = makeStyles(({ colors }) => ({
	base: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
		paddingHorizontal: 14,
	},
	large: { height: 56 },
	small: { height: 52, gap: 8 },
	label: { flexShrink: 1 },
	primary: { backgroundColor: colors.accent, borderRadius: radii.md },
	secondary: {
		backgroundColor: colors.surface,
		borderRadius: radii.md,
		borderWidth: 1,
		borderColor: colors.border,
	},
	danger: {
		backgroundColor: colors.surface,
		borderRadius: radii.lg,
		borderWidth: 1,
		borderColor: colors.borderSoft,
	},
	dashed: {
		borderRadius: radii.md,
		borderWidth: 1.5,
		borderStyle: "dashed",
		borderColor: colors.dashed,
	},
	disabled: { backgroundColor: colors.border },
	grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
}));
