import { Image } from "expo-image";
import { StyleSheet } from "react-native";
import {
	GestureDetector,
	usePanGesture,
	usePinchGesture,
	useSimultaneousGestures,
	useTapGesture,
} from "react-native-gesture-handler";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { ease } from "@/theme/motion";

const MAX_SCALE = 5;
/** How far a double tap zooms in. */
const TAP_SCALE = 2.5;

/**
 * One page, filling `width` × `height`: pinch to zoom, drag to move around
 * once zoomed, double tap to zoom in on a spot or back out. Tells the reader
 * when it is zoomed, so swiping between pages can pause.
 */
export function ZoomablePage({
	uri,
	width,
	height,
	zoomed,
	onZoomChange,
	accessibilityLabel,
}: {
	uri: string;
	width: number;
	height: number;
	zoomed: boolean;
	onZoomChange: (zoomed: boolean) => void;
	accessibilityLabel: string;
}) {
	const scale = useSharedValue(1);
	const x = useSharedValue(0);
	const y = useSharedValue(0);
	const start = useSharedValue({ x: 0, y: 0 });

	/** Keeps the page covering the screen: no moving past its edges. */
	const clampX = (value: number, at: number) => {
		"worklet";
		const limit = (width * (at - 1)) / 2;
		return Math.min(limit, Math.max(-limit, value));
	};
	const clampY = (value: number, at: number) => {
		"worklet";
		const limit = (height * (at - 1)) / 2;
		return Math.min(limit, Math.max(-limit, value));
	};

	const settle = (to: number, toX: number, toY: number) => {
		"worklet";
		scale.set(withTiming(to, ease));
		x.set(withTiming(toX, ease));
		y.set(withTiming(toY, ease));
		scheduleOnRN(onZoomChange, to > 1);
	};

	const pinch = usePinchGesture({
		onUpdate: (event) => {
			scale.set(
				Math.min(MAX_SCALE, Math.max(1, scale.get() * event.scaleChange)),
			);
			x.set(clampX(x.get(), scale.get()));
			y.set(clampY(y.get(), scale.get()));
		},
		onDeactivate: () => {
			const at = scale.get() < 1.05 ? 1 : scale.get();
			settle(at, clampX(x.get(), at), clampY(y.get(), at));
		},
	});

	const pan = usePanGesture({
		enabled: zoomed,
		onActivate: () => start.set({ x: x.get(), y: y.get() }),
		onUpdate: (event) => {
			x.set(clampX(start.get().x + event.translationX, scale.get()));
			y.set(clampY(start.get().y + event.translationY, scale.get()));
		},
	});

	const doubleTap = useTapGesture({
		numberOfTaps: 2,
		onActivate: (event) => {
			if (scale.get() > 1) {
				settle(1, 0, 0);
				return;
			}
			// Zoom in on the tapped spot.
			settle(
				TAP_SCALE,
				clampX((width / 2 - event.x) * (TAP_SCALE - 1), TAP_SCALE),
				clampY((height / 2 - event.y) * (TAP_SCALE - 1), TAP_SCALE),
			);
		},
	});

	const gesture = useSimultaneousGestures(pinch, pan, doubleTap);

	const style = useAnimatedStyle(() => ({
		transform: [
			{ translateX: x.get() },
			{ translateY: y.get() },
			{ scale: scale.get() },
		],
	}));

	return (
		<GestureDetector gesture={gesture}>
			<Animated.View
				accessible
				accessibilityRole="image"
				accessibilityLabel={accessibilityLabel}
				style={[{ width, height }, style]}
			>
				<Image
					source={uri}
					style={StyleSheet.absoluteFill}
					contentFit="contain"
					transition={120}
				/>
			</Animated.View>
		</GestureDetector>
	);
}
