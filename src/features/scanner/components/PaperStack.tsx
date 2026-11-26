import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import { Paper } from "@/components/documents/Paper";
import { boxShadow, makeStyles, useTheme } from "@/theme";
import { easeLift, enter } from "@/theme/motion";

const PAGE_W = 168;
const PAGE_H = 222;

/** Three pages: two fan out from under the top one, and the stack floats. */
export function PaperStack() {
	const { shadows } = useTheme();
	const styles = useStyles();
	const fan = useSharedValue(0);
	const float = useSharedValue(0);

	useEffect(() => {
		fan.set(withDelay(150, withTiming(1, { duration: 800, easing: easeLift })));
		const half = { duration: 3000, easing: Easing.inOut(Easing.ease) };
		float.set(
			withDelay(
				1000,
				withRepeat(withSequence(withTiming(-6, half), withTiming(0, half)), -1),
			),
		);
	}, [fan, float]);

	const stackStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: float.get() }],
	}));
	const leftStyle = useAnimatedStyle(() => ({
		transform: [
			{ rotate: `${-9 * fan.get()}deg` },
			{ translateX: -34 * fan.get() },
		],
	}));
	const rightStyle = useAnimatedStyle(() => ({
		transform: [
			{ rotate: `${7 * fan.get()}deg` },
			{ translateX: 34 * fan.get() },
		],
	}));

	return (
		<Animated.View
			pointerEvents="none"
			style={[styles.stack, stackStyle]}
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
		>
			<Animated.View style={[styles.sheet, boxShadow(shadows.card), leftStyle]}>
				<Paper width={PAGE_W} height={PAGE_H} />
			</Animated.View>
			<Animated.View
				style={[styles.sheet, boxShadow(shadows.card), rightStyle]}
			>
				<Paper width={PAGE_W} height={PAGE_H} />
			</Animated.View>
			<Animated.View
				entering={enter.lift()}
				style={[styles.sheet, boxShadow(shadows.raised)]}
			>
				<Paper width={PAGE_W} height={PAGE_H} />
			</Animated.View>
		</Animated.View>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	stack: { width: PAGE_W, height: PAGE_H },
	sheet: {
		...StyleSheet.absoluteFill,
		borderRadius: 6,
		backgroundColor: colors.paper,
	},
}));
