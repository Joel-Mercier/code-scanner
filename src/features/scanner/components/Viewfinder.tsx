import { Canvas, Group, Path, Skia } from "@shopify/react-native-skia";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import {
	Easing,
	type SharedValue,
	useDerivedValue,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/theme";

export type Quad = [
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
];

/** The reticle: 224pt on a 390pt-wide screen, a little above the centre. */
const viewfinderBox = (width: number, height: number) => {
	const size = Math.min(width * 0.575, height * 0.5);
	return { size, cx: width / 2, cy: height * 0.52 };
};

/** The idle square, clockwise from top-left. */
const idleCorners = (width: number, height: number): Quad => {
	const { size, cx, cy } = viewfinderBox(width, height);
	const half = size / 2;
	return [
		cx - half,
		cy - half,
		cx + half,
		cy - half,
		cx + half,
		cy + half,
		cx - half,
		cy + half,
	];
};

/** Where the frame is drawn: the idle square blended towards the detected quad. */
const frameCorners = (idle: number[], quad: number[], lock: number) => {
	"worklet";
	return idle.map((value, index) => value + (quad[index] - value) * lock);
};

const ARM = 22;
const STROKE = 1.5;

/** Unit vector and length from corner `i` towards corner `j` of a quad. */
const towards = (c: number[], i: number, j: number) => {
	"worklet";
	const dx = c[j * 2] - c[i * 2];
	const dy = c[j * 2 + 1] - c[i * 2 + 1];
	const length = Math.hypot(dx, dy) || 1;
	return { x: dx / length, y: dy / length, length };
};

type ViewfinderProps = {
	width: number;
	height: number;
	/** 0 = idle frame, 1 = snapped onto the detected code. */
	lock: SharedValue<number>;
	quad: SharedValue<Quad>;
};

/** Four thin corner brackets that breathe (`.v-ret`) and snap onto codes. */
export function Viewfinder({ width, height, lock, quad }: ViewfinderProps) {
	const { colors } = useTheme();
	const idle = idleCorners(width, height);
	const { cx, cy } = viewfinderBox(width, height);
	const breath = useSharedValue(1);

	useEffect(() => {
		const half = { duration: 1500, easing: Easing.inOut(Easing.ease) };
		breath.set(
			withRepeat(withSequence(withTiming(0.97, half), withTiming(1, half)), -1),
		);
	}, [breath]);

	const corners = useDerivedValue(() => {
		// The idle frame breathes around its centre; a locked one holds still.
		const scale = 1 + (breath.get() - 1) * (1 - lock.get());
		const breathing = idle.map((value, index) =>
			index % 2 === 0 ? cx + (value - cx) * scale : cy + (value - cy) * scale,
		);
		return frameCorners(breathing, quad.get(), lock.get());
	});

	const brackets = useDerivedValue(() => {
		const c = corners.get();
		const path = Skia.PathBuilder.Make();
		for (let i = 0; i < 4; i++) {
			const prev = towards(c, i, (i + 3) % 4);
			const next = towards(c, i, (i + 1) % 4);
			const arm = Math.min(ARM, Math.min(prev.length, next.length) * 0.3);
			const x = c[i * 2];
			const y = c[i * 2 + 1];
			path.moveTo(x + prev.x * arm, y + prev.y * arm);
			path.lineTo(x, y);
			path.lineTo(x + next.x * arm, y + next.y * arm);
		}
		return path.build();
	});

	const fill = useDerivedValue(() => {
		const c = corners.get();
		const path = Skia.PathBuilder.Make();
		path.moveTo(c[0], c[1]);
		for (let i = 1; i < 4; i++) path.lineTo(c[i * 2], c[i * 2 + 1]);
		path.close();
		return path.build();
	});
	const fillOpacity = useDerivedValue(() => lock.get() * 0.16);

	return (
		<View pointerEvents="none" style={StyleSheet.absoluteFill}>
			<Canvas style={StyleSheet.absoluteFill}>
				<Group>
					<Path path={fill} color={colors.white} opacity={fillOpacity} />
					<Path
						path={brackets}
						style="stroke"
						strokeWidth={STROKE}
						strokeJoin="miter"
						color={colors.white}
					/>
				</Group>
			</Canvas>
		</View>
	);
}
