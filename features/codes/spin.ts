import { useEffect } from "react";
import {
	cancelAnimation,
	Easing,
	type SharedValue,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import useApp from "@/stores/appStore";
import { easeLift, easeOut } from "@/theme/motion";

/** The "3D animations" setting: off holds every code flat, facing you. */
const useMotion3d = () => useApp((state) => state.motion3d);

const holdFlat = (...values: SharedValue<number>[]) => {
	for (const value of values) {
		cancelAnimation(value);
		value.set(0);
	}
};

const TURN_EASE = Easing.bezier(0.45, 0, 0.25, 1);
const TURN_MS = 11000;

/**
 * A freshly captured object (`.c-lift` + `.c-obj`): it rises out of the
 * floor while spinning in, then idles with a slow look-around and a full
 * turn every 11s. Restarts whenever `replay` changes.
 */
export function useCaptureSpin(replay: number) {
	const motion3d = useMotion3d();
	const rotateX = useSharedValue(motion3d ? 35 : 0);
	const rotateY = useSharedValue(motion3d ? -630 : 0);
	const rise = useSharedValue(0);
	const fade = useSharedValue(0);

	useEffect(() => {
		const enter = { duration: 1500, easing: easeLift };
		const segment = (fraction: number) => ({
			duration: TURN_MS * fraction,
			easing: TURN_EASE,
		});
		rise.set(0);
		fade.set(0);
		rise.set(withTiming(1, enter));
		fade.set(withTiming(1, { duration: 300, easing: easeLift }));
		if (!motion3d) {
			holdFlat(rotateX, rotateY);
			return;
		}
		rotateX.set(35);
		rotateY.set(-630);
		rotateX.set(
			withSequence(
				withTiming(8, enter),
				withRepeat(
					withSequence(
						withTiming(6, segment(0.25)),
						withTiming(8, segment(0.25)),
						withTiming(8, segment(0.5)),
					),
					-1,
				),
			),
		);
		rotateY.set(
			withSequence(
				withTiming(0, enter),
				withRepeat(
					withSequence(
						withTiming(-16, segment(0.25)),
						withTiming(6, segment(0.25)),
						withTiming(0, segment(0.12)),
						withTiming(360, segment(0.38)),
						withTiming(0, { duration: 0 }),
					),
					-1,
				),
			),
		);
	}, [replay, motion3d, rotateX, rotateY, rise, fade]);

	const liftStyle = useAnimatedStyle(() => ({
		opacity: fade.get(),
		transform: [
			{ translateY: 90 * (1 - rise.get()) },
			{ scale: 0.7 + 0.3 * rise.get() },
		],
	}));

	return { rotateX, rotateY, liftStyle };
}

/** `.v-tilt`: an endless, gentle look-around, after a short pause. */
export function useTilt() {
	const motion3d = useMotion3d();
	const rotateX = useSharedValue(0);
	const rotateY = useSharedValue(0);

	useEffect(() => {
		if (!motion3d) {
			holdFlat(rotateX, rotateY);
			return;
		}
		const half = { duration: 5000, easing: Easing.inOut(Easing.ease) };
		const settle = { duration: 800, easing: easeOut };
		rotateX.set(
			withDelay(
				800,
				withSequence(
					withTiming(6, settle),
					withRepeat(
						withSequence(withTiming(4, half), withTiming(6, half)),
						-1,
					),
				),
			),
		);
		rotateY.set(
			withDelay(
				800,
				withSequence(
					withTiming(-8, settle),
					withRepeat(
						withSequence(withTiming(8, half), withTiming(-8, half)),
						-1,
					),
				),
			),
		);
	}, [motion3d, rotateX, rotateY]);

	return { rotateX, rotateY };
}

/**
 * An object on its detail page: a full turn in (`.d-turn`), then a gentle
 * endless tilt (`.v-tilt`). Restarts the turn whenever `replay` changes.
 */
export function useTurnAndTilt(replay: number) {
	const motion3d = useMotion3d();
	const turn = useSharedValue(motion3d ? -360 : 0);
	const tilt = useTilt();

	useEffect(() => {
		if (!motion3d) {
			holdFlat(turn);
			return;
		}
		turn.set(-360);
		turn.set(
			withTiming(0, {
				duration: 1200,
				easing: Easing.bezier(0.3, 0.7, 0.2, 1),
			}),
		);
	}, [replay, motion3d, turn]);

	const rotateY = useDerivedValue(() => turn.get() + tilt.rotateY.get());
	return { rotateX: tilt.rotateX, rotateY };
}
