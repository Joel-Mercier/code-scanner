import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
	type DerivedValue,
	useAnimatedStyle,
} from "react-native-reanimated";
import { makeStyles, useTheme } from "@/theme";

const PERSPECTIVE = 1000;

/**
 * Screen-space transform of a plane `z` px in front of the object's centre,
 * for an object turned by `rx`/`ry` degrees (CSS `rotateX(rx) rotateY(ry)`).
 * React Native has no `translateZ`, so the depth is projected by hand:
 * R·(p + zẑ) = R·p + z·R·ẑ.
 */
const planeTransform = (rx: number, ry: number, z: number, flip: boolean) => {
	"worklet";
	const a = (rx * Math.PI) / 180;
	const b = (ry * Math.PI) / 180;
	return [
		{ perspective: PERSPECTIVE },
		{ translateX: z * Math.sin(b) },
		{ translateY: -z * Math.cos(b) * Math.sin(a) },
		{ rotateX: `${rx}deg` },
		{ rotateY: `${ry + (flip ? 180 : 0)}deg` },
	];
};

/** Whether the front face points at the viewer. */
const facesViewer = (rx: number, ry: number) => {
	"worklet";
	return Math.cos((rx * Math.PI) / 180) * Math.cos((ry * Math.PI) / 180) >= 0;
};

function Layer({
	z,
	rotateX,
	rotateY,
	style,
}: {
	z: number;
	rotateX: DerivedValue<number>;
	rotateY: DerivedValue<number>;
	style: ViewStyle;
}) {
	const animated = useAnimatedStyle(() => ({
		transform: planeTransform(rotateX.get(), rotateY.get(), z, false),
	}));
	return <Animated.View style={[StyleSheet.absoluteFill, style, animated]} />;
}

function Face({
	z,
	back,
	rotateX,
	rotateY,
	style,
	children,
}: {
	z: number;
	back: boolean;
	rotateX: DerivedValue<number>;
	rotateY: DerivedValue<number>;
	style: ViewStyle;
	children: ReactNode;
}) {
	const styles = useStyles();
	const animated = useAnimatedStyle(() => {
		const front = facesViewer(rotateX.get(), rotateY.get());
		return {
			opacity: front === !back ? 1 : 0,
			transform: planeTransform(
				rotateX.get(),
				rotateY.get(),
				back ? -z : z,
				back,
			),
		};
	});
	return (
		<Animated.View
			style={[StyleSheet.absoluteFill, styles.face, style, animated]}
		>
			{children}
		</Animated.View>
	);
}

type TurntableProps = {
	width: number;
	height: number;
	radius: number;
	/** Depths of the slabs that give the object its thickness. */
	layers: number[];
	layerColor?: string;
	/** Depth of the front and back faces. */
	faceDepth: number;
	front: ReactNode;
	back: ReactNode;
	faceStyle?: ViewStyle;
	frontStyle?: ViewStyle;
	backStyle?: ViewStyle;
	rotateX: DerivedValue<number>;
	rotateY: DerivedValue<number>;
};

/**
 * A thick card that can spin in 3D: a stack of slabs (`.v-layer`) between a
 * front and a back face (`.v-face`), like the design's captured objects.
 */
export function Turntable({
	width,
	height,
	radius,
	layers,
	layerColor,
	faceDepth,
	front,
	back,
	faceStyle,
	frontStyle,
	backStyle,
	rotateX,
	rotateY,
}: TurntableProps) {
	const { colors } = useTheme();
	const shape = { borderRadius: radius };
	return (
		<View style={{ width, height }}>
			{layers.map((z) => (
				<Layer
					key={z}
					z={z}
					rotateX={rotateX}
					rotateY={rotateY}
					style={{ ...shape, backgroundColor: layerColor ?? colors.layer }}
				/>
			))}
			<Face
				z={faceDepth}
				back={false}
				rotateX={rotateX}
				rotateY={rotateY}
				style={{ ...shape, ...faceStyle, ...frontStyle }}
			>
				{front}
			</Face>
			<Face
				z={faceDepth}
				back
				rotateX={rotateX}
				rotateY={rotateY}
				style={{ ...shape, ...faceStyle, ...backStyle }}
			>
				{back}
			</Face>
		</View>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	face: {
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.faceEdge,
		overflow: "hidden",
		alignItems: "center",
		justifyContent: "center",
	},
}));
