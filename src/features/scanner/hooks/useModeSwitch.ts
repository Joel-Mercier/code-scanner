import { useState } from "react";
import { useWindowDimensions } from "react-native";
import { usePanGesture } from "react-native-gesture-handler";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { haptics } from "@/lib/haptics";
import { ease } from "@/theme/motion";

export type ScanMode = "codes" | "docs";

/** A flick this fast (pt/s) switches modes, however short. */
const FLICK = 500;

/**
 * The codes ⇄ docs switch: by tab or by swiping the feed (left for
 * documents, right for codes). `progress` follows the finger (0 codes,
 * 1 docs); `moving` is true while both modes are on screen.
 */
export function useModeSwitch(onChange: (mode: ScanMode) => void) {
	const { width } = useWindowDimensions();
	const [mode, setMode] = useState<ScanMode>("codes");
	const [moving, setMoving] = useState(false);
	const progress = useSharedValue(0);
	const dragStart = useSharedValue(0);

	const settle = (next: ScanMode) => {
		if (next !== mode) {
			haptics.select();
			setMode(next);
			onChange(next);
		}
	};

	const changeMode = (next: ScanMode) => {
		if (next === mode) return;
		setMoving(true);
		settle(next);
		progress.set(
			withTiming(next === "docs" ? 1 : 0, ease, (finished) => {
				if (finished) scheduleOnRN(setMoving, false);
			}),
		);
	};

	const swipe = usePanGesture({
		activeOffsetX: [-14, 14],
		failOffsetY: [-14, 14],
		maxPointers: 1,
		onActivate: () => {
			dragStart.set(progress.get());
			scheduleOnRN(setMoving, true);
		},
		onUpdate: (event) => {
			progress.set(
				Math.min(1, Math.max(0, dragStart.get() - event.translationX / width)),
			);
		},
		onDeactivate: (event) => {
			const target =
				event.velocityX < -FLICK
					? 1
					: event.velocityX > FLICK
						? 0
						: Math.round(progress.get());
			scheduleOnRN(settle, target === 1 ? "docs" : "codes");
			progress.set(
				withTiming(target, ease, (finished) => {
					if (finished) scheduleOnRN(setMoving, false);
				}),
			);
		},
	});

	return { mode, moving, progress, changeMode, swipe };
}
