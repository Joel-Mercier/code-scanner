import type { ReactNode } from "react";
import {
	type GestureResponderEvent,
	Pressable as RNPressable,
	type PressableProps as RNPressableProps,
	type StyleProp,
	type ViewStyle,
} from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { haptics } from "@/lib/haptics";
import { ease } from "@/theme/motion";

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);

export type PressableProps = Omit<RNPressableProps, "style" | "children"> & {
	style?: StyleProp<ViewStyle>;
	children?: ReactNode;
	/** Scale while pressed. */
	pressedScale?: number;
	/** Plays a light tap on press. */
	haptic?: boolean;
};

/** A pressable that dips slightly while held. */
export function Pressable({
	style,
	children,
	pressedScale = 0.97,
	haptic = false,
	onPressIn,
	onPressOut,
	onPress,
	disabled,
	...props
}: PressableProps) {
	const scale = useSharedValue(1);
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.get() }],
	}));

	return (
		<AnimatedPressable
			{...props}
			disabled={disabled}
			onPressIn={(event: GestureResponderEvent) => {
				scale.set(withTiming(pressedScale, { duration: 110 }));
				onPressIn?.(event);
			}}
			onPressOut={(event: GestureResponderEvent) => {
				scale.set(withTiming(1, ease));
				onPressOut?.(event);
			}}
			onPress={(event: GestureResponderEvent) => {
				if (haptic) haptics.tap();
				onPress?.(event);
			}}
			style={[style, animatedStyle]}
		>
			{children}
		</AnimatedPressable>
	);
}
