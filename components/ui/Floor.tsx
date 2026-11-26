import {
	BlurMask,
	Canvas,
	Group,
	Oval,
	Path,
	RadialGradient,
	Skia,
	vec,
} from "@shopify/react-native-skia";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import {
	Easing,
	useDerivedValue,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/theme";

/** The soft blurred shadow an object casts on the floor. */
export function FloorShadow({
	width = 170,
	height = 16,
	opacity,
}: {
	width?: number;
	height?: number;
	/** Defaults to the theme's floor shadow (stronger on dark). */
	opacity?: number;
}) {
	const { shadows } = useTheme();
	const pad = 24;
	return (
		<Canvas
			pointerEvents="none"
			style={{ width: width + pad * 2, height: height + pad * 2 }}
		>
			<Oval
				x={pad}
				y={pad}
				width={width}
				height={height}
				color={`rgba(0,0,0,${opacity ?? shadows.floor})`}
			>
				<BlurMask blur={9} style="normal" />
			</Oval>
		</Canvas>
	);
}

const RING_W = 248;
const RING_H = 38;
const GLOW_W = 260;
const GLOW_H = 60;
const CANVAS_W = 280;
const CANVAS_H = 80;

const ring = (() => {
	const path = Skia.PathBuilder.Make();
	path.addOval(
		Skia.XYWHRect(
			(CANVAS_W - RING_W) / 2,
			(CANVAS_H - RING_H) / 2,
			RING_W,
			RING_H,
		),
	);
	return path.build();
})();

/**
 * The landing pad of a freshly captured object: a blue glow and an ellipse
 * that draws itself (`.c-glow`, `.c-ring`). Replays when `replay` changes.
 */
export function LandingRing({ replay }: { replay: number }) {
	const { colors } = useTheme();
	const draw = useSharedValue(0);
	const ringOpacity = useSharedValue(1);
	const glow = useSharedValue(0);

	useEffect(() => {
		draw.set(0);
		ringOpacity.set(1);
		glow.set(0);
		draw.set(
			withDelay(
				1050,
				withTiming(1, {
					duration: 1000,
					easing: Easing.bezier(0.3, 0.7, 0.3, 1),
				}),
			),
		);
		ringOpacity.set(
			withDelay(
				2200,
				withTiming(0.25, { duration: 1200, easing: Easing.out(Easing.ease) }),
			),
		);
		glow.set(
			withDelay(
				1050,
				withTiming(1, { duration: 1400, easing: Easing.out(Easing.ease) }),
			),
		);
	}, [replay, draw, ringOpacity, glow]);

	// 0 → 40%: fade in and grow; 40% → 100%: settle to 35%.
	const glowOpacity = useDerivedValue(() => {
		const t = glow.get();
		return t < 0.4 ? t / 0.4 : 1 - ((t - 0.4) / 0.6) * 0.65;
	});
	const glowTransform = useDerivedValue(() => {
		const scale = 0.6 + 0.4 * glow.get();
		return [
			{ translateX: CANVAS_W / 2 },
			{ translateY: CANVAS_H / 2 },
			{ scaleX: scale },
			{ scaleY: scale },
			{ translateX: -CANVAS_W / 2 },
			{ translateY: -CANVAS_H / 2 },
		];
	});
	return (
		<View pointerEvents="none" style={styles.wrap}>
			<Canvas style={{ width: CANVAS_W, height: CANVAS_H }}>
				<Group opacity={glowOpacity} transform={glowTransform}>
					<Oval
						x={(CANVAS_W - GLOW_W) / 2}
						y={(CANVAS_H - GLOW_H) / 2}
						width={GLOW_W}
						height={GLOW_H}
					>
						<RadialGradient
							c={vec(CANVAS_W / 2, CANVAS_H / 2)}
							r={GLOW_W / 2}
							colors={["rgba(42,68,255,0.28)", "rgba(42,68,255,0)"]}
							transform={[
								{ translateX: CANVAS_W / 2 },
								{ translateY: CANVAS_H / 2 },
								{ scaleY: GLOW_H / GLOW_W },
								{ translateX: -CANVAS_W / 2 },
								{ translateY: -CANVAS_H / 2 },
							]}
						/>
					</Oval>
				</Group>
				<Path
					path={ring}
					style="stroke"
					strokeWidth={1.5}
					color={colors.accent}
					start={0}
					end={draw}
					opacity={ringOpacity}
				/>
			</Canvas>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: { width: CANVAS_W, height: CANVAS_H },
});

export const landingSize = { width: CANVAS_W, height: CANVAS_H };
