import type { GestureResponderEvent, StyleProp, ViewStyle } from "react-native";
import { makeStyles, useTheme } from "@/theme";
import { Icon, type IconName } from "./Icon";
import { Pressable } from "./Pressable";

type IconButtonProps = {
	icon: IconName;
	accessibilityLabel: string;
	onPress?: (event: GestureResponderEvent) => void;
	/**
	 * `outline`: a card with a hairline (default). `solid`: a card without
	 * one. `glass`: frosted white over the camera, in both themes.
	 */
	variant?: "outline" | "solid" | "glass";
	size?: number;
	iconSize?: number;
	iconColor?: string;
	disabled?: boolean;
	style?: StyleProp<ViewStyle>;
};

export function IconButton({
	icon,
	accessibilityLabel,
	onPress,
	variant = "outline",
	size = 46,
	iconSize = 19,
	iconColor,
	disabled,
	style,
}: IconButtonProps) {
	const { colors } = useTheme();
	const styles = useStyles();
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
			onPress={onPress}
			disabled={disabled}
			haptic
			pressedScale={0.92}
			style={[
				styles.base,
				styles[variant],
				{ width: size, height: size, borderRadius: size / 2 },
				disabled && styles.disabled,
				style,
			]}
		>
			<Icon
				name={icon}
				size={iconSize}
				color={
					iconColor ?? (variant === "glass" ? colors.glassInk : colors.ink)
				}
			/>
		</Pressable>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	base: { alignItems: "center", justifyContent: "center" },
	outline: {
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
	},
	solid: { backgroundColor: colors.surface },
	glass: { backgroundColor: "rgba(255,255,255,0.9)" },
	disabled: { opacity: 0.5 },
}));
