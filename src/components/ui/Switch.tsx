import { useEffect } from "react";
import Animated, {
	interpolateColor,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { haptics } from "@/lib/haptics";
import { boxShadow, makeStyles, useTheme } from "@/theme";
import { ease } from "@/theme/motion";
import { Pressable } from "./Pressable";

type SwitchProps = {
	value: boolean;
	onChange: (value: boolean) => void;
	accessibilityLabel?: string;
};

export function Switch({ value, onChange, accessibilityLabel }: SwitchProps) {
	const { colors, shadows } = useTheme();
	const styles = useStyles();
	const progress = useSharedValue(value ? 1 : 0);

	useEffect(() => {
		progress.set(withTiming(value ? 1 : 0, ease));
	}, [value, progress]);

	const track = useAnimatedStyle(() => ({
		backgroundColor: interpolateColor(
			progress.get(),
			[0, 1],
			[colors.dashed, colors.accent],
		),
	}));
	const knob = useAnimatedStyle(() => ({
		transform: [{ translateX: progress.get() * 20 }],
	}));

	return (
		<Pressable
			accessibilityRole="switch"
			accessibilityLabel={accessibilityLabel}
			accessibilityState={{ checked: value }}
			pressedScale={0.95}
			onPress={() => {
				haptics.select();
				onChange(!value);
			}}
		>
			<Animated.View style={[styles.track, track]}>
				<Animated.View style={[styles.knob, boxShadow(shadows.knob), knob]} />
			</Animated.View>
		</Pressable>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	track: { width: 52, height: 32, borderRadius: 16 },
	knob: {
		position: "absolute",
		top: 3,
		left: 3,
		width: 26,
		height: 26,
		borderRadius: 13,
		backgroundColor: colors.white,
	},
}));
