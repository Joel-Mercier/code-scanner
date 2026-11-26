import {
	Canvas,
	Path,
	RadialGradient,
	Rect,
	Skia,
	vec,
} from "@shopify/react-native-skia";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import { Text } from "@/components/ui/Text";
import { makeStyles, useTheme } from "@/theme";

/** `.v-feed`: the grey blur shown behind (and before) the camera. */
export function FeedBackdrop({
	width,
	height,
}: {
	width: number;
	height: number;
}) {
	const { colors } = useTheme();
	return (
		<Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
			<Rect x={0} y={0} width={width} height={height}>
				<RadialGradient
					c={vec(width * 0.6, height * 0.3)}
					r={Math.max(width, height) * 0.8}
					colors={["#8D8E8F", "#5B5D60", colors.feed]}
					positions={[0, 0.45, 1]}
				/>
			</Rect>
		</Canvas>
	);
}

/**
 * Covers the square corners at the bottom of the feed with the page colour.
 * The camera preview can be a SurfaceView on Android, which ignores rounded
 * clipping; views drawn on top of it don't.
 */
export function FeedCorners({
	width,
	radius,
}: {
	width: number;
	radius: number;
}) {
	const { colors } = useTheme();
	const styles = useStyles();
	// The area between the square corner and the rounded edge of the feed.
	const corner = (left: boolean) => {
		const r = radius;
		const edge = left ? 0 : r;
		const path = Skia.PathBuilder.Make();
		path.moveTo(edge, 0);
		path.lineTo(edge, r);
		path.lineTo(r - edge, r);
		path.arcToTangent(edge, r, edge, 0, r);
		path.close();
		return path.build();
	};
	return (
		<View pointerEvents="none" style={[styles.corners, { height: radius }]}>
			<Canvas style={{ width: radius, height: radius }}>
				<Path path={corner(true)} color={colors.canvas} />
			</Canvas>
			<View style={{ width: width - radius * 2 }} />
			<Canvas style={{ width: radius, height: radius }}>
				<Path path={corner(false)} color={colors.canvas} />
			</Canvas>
		</View>
	);
}

/** `.v-dot`: a status dot that softly pulses. */
export function PulseDot({ color }: { color?: string }) {
	const { colors } = useTheme();
	const styles = useStyles();
	const pulse = useSharedValue(0);
	useEffect(() => {
		const half = { duration: 800, easing: Easing.inOut(Easing.ease) };
		pulse.set(
			withRepeat(withSequence(withTiming(1, half), withTiming(0, half)), -1),
		);
	}, [pulse]);
	const style = useAnimatedStyle(() => ({
		opacity: 1 - pulse.get() * 0.5,
		transform: [{ scale: 1 - pulse.get() * 0.4 }],
	}));
	return (
		<Animated.View
			style={[styles.dot, { backgroundColor: color ?? colors.accent }, style]}
		/>
	);
}

/** The white status pill at the bottom of the feed. */
export function StatusPill({ label }: { label: string }) {
	const styles = useStyles();
	return (
		<View style={styles.pill}>
			<PulseDot />
			<Text size={14} weight="medium">
				{label}
			</Text>
		</View>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	corners: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		flexDirection: "row",
	},
	dot: { width: 7, height: 7, borderRadius: 3.5 },
	pill: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingVertical: 9,
		paddingHorizontal: 14,
		borderRadius: 999,
		backgroundColor: colors.surface,
	},
}));
