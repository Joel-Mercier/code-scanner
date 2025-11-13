import { Spacings } from "@/constants/Spacings";
import type { ReactElement } from "react";
import {
	ActivityIndicator,
	Pressable,
	type StyleProp,
	StyleSheet,
	type ViewStyle,
} from "react-native";
import Animated, {
	interpolate,
	ReduceMotion,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { ThemedText } from "./ThemedText";

export type ButtonProps = {
	accessibilityHint?: string;
	accessibilityLabel?: string;
	Icon?: ReactElement;
	isDisabled?: boolean;
	isLoading?: boolean;
	onPress: () => void;
	buttonColor: string;
	textColor: string;
	scale?: number;
	title: string;
	reduceMotion?: "never" | "always" | "system";
	style?: StyleProp<ViewStyle>;
};

const DURATION = 100;

export const Button = ({
	accessibilityHint,
	accessibilityLabel,
	Icon,
	isDisabled = false,
	isLoading = false,
	onPress,
	buttonColor,
	textColor,
	scale = 0.95,
	title,
	reduceMotion = "system",
	style,
}: ButtonProps) => {
	const transition = useSharedValue(0);
	const isActive = useSharedValue(false);

	const motion =
		reduceMotion === "never"
			? ReduceMotion.Never
			: reduceMotion === "always"
				? ReduceMotion.Always
				: ReduceMotion.System;

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [
			{
				scale: interpolate(transition.value, [0, 1], [1, scale]),
			},
		],
	}));

	return (
		<Pressable
			accessibilityHint={accessibilityHint}
			accessibilityLabel={accessibilityLabel}
			accessibilityRole="button"
			accessibilityState={{
				busy: isLoading,
				disabled: isDisabled || isLoading,
			}}
			disabled={isDisabled || isLoading}
			onPress={onPress}
			onPressIn={() => {
				isActive.value = true;
				transition.value = withTiming(
					1,
					{ duration: DURATION, reduceMotion: motion },
					() => {
						if (!isActive.value) {
							transition.value = withTiming(0, {
								duration: DURATION,
								reduceMotion: motion,
							});
						}
					},
				);
			}}
			onPressOut={() => {
				if (transition.value === 1) {
					transition.value = withTiming(0, {
						duration: DURATION,
						reduceMotion: motion,
					});
				}
				isActive.value = false;
			}}
		>
			<Animated.View
				style={[
					styles.container,
					style,
					animatedStyle,
					{
						opacity: isDisabled ? 0.5 : 1,
						backgroundColor: buttonColor,
					},
				]}
			>
				{isLoading ? (
					<ActivityIndicator color={textColor} size={18} />
				) : (
					<>
						{Icon}
						<ThemedText
							numberOfLines={1}
							style={[styles.title, { color: textColor }]}
						>
							{title}
						</ThemedText>
					</>
				)}
			</Animated.View>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		borderRadius: Spacings.sm,
		flexDirection: "row",
		gap: 8,
		height: 52,
		justifyContent: "center",
		paddingVertical: Spacings.sm,
		paddingHorizontal: Spacings.md,
	},
	title: {
		fontFamily: "Inter_700Bold",
	},
});
