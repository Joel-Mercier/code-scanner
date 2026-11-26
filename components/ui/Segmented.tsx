import { type ReactNode, useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { boxShadow, makeStyles, radii, useTheme } from "@/theme";
import { ease } from "@/theme/motion";
import { haptics } from "@/utils/haptics";
import { Icon, type IconName } from "./Icon";
import { Pressable } from "./Pressable";
import { Text } from "./Text";

export type SegmentOption<T extends string> = {
	value: T;
	label: string;
	icon?: IconName;
	/** A custom glyph before the label (e.g. the dot shapes). */
	leading?: (color: string) => ReactNode;
};

type SegmentedProps<T extends string> = {
	value: T;
	options: SegmentOption<T>[];
	onChange: (value: T) => void;
	height?: number;
	/** `sunken` on the canvas, `tile` inside a white card. */
	tone?: "sunken" | "tile";
	weight?: "medium" | "semibold";
	accessibilityLabel?: string;
};

const PAD = 4;

/** A track with a white pill that slides to the picked option. */
export function Segmented<T extends string>({
	value,
	options,
	onChange,
	height = 44,
	tone = "sunken",
	weight = "semibold",
	accessibilityLabel,
}: SegmentedProps<T>) {
	const { colors, shadows } = useTheme();
	const styles = useStyles();
	const [width, setWidth] = useState(0);
	const index = Math.max(
		0,
		options.findIndex((option) => option.value === value),
	);
	const segment = width > 0 ? (width - PAD * 2) / options.length : 0;
	const offset = useSharedValue(index * segment);

	useEffect(() => {
		offset.set(withTiming(index * segment, ease));
	}, [index, segment, offset]);

	const pillStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: offset.get() }],
	}));

	return (
		<View
			accessibilityRole="radiogroup"
			accessibilityLabel={accessibilityLabel}
			onLayout={(event) => {
				const next = event.nativeEvent.layout.width;
				// Jump (don't slide) on first layout.
				offset.set(index * ((next - PAD * 2) / options.length));
				setWidth(next);
			}}
			style={[
				styles.track,
				{
					backgroundColor: tone === "sunken" ? colors.sunken : colors.tile,
				},
			]}
		>
			{segment > 0 && (
				<Animated.View
					style={[
						styles.pill,
						boxShadow(shadows.pill),
						{ width: segment, height },
						pillStyle,
					]}
				/>
			)}
			{options.map((option) => {
				const active = option.value === value;
				const color = active ? colors.ink : colors.muted;
				return (
					<Pressable
						key={option.value}
						accessibilityRole="radio"
						accessibilityState={{ selected: active }}
						pressedScale={0.96}
						onPress={() => {
							if (active) return;
							haptics.select();
							onChange(option.value);
						}}
						style={[styles.option, { height }]}
					>
						{option.icon && <Icon name={option.icon} size={18} color={color} />}
						{option.leading?.(color)}
						<Text size={15} weight={weight} color={color} numberOfLines={1}>
							{option.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	track: {
		flexDirection: "row",
		padding: PAD,
		borderRadius: radii.md,
	},
	pill: {
		position: "absolute",
		top: PAD,
		left: PAD,
		borderRadius: 12,
		backgroundColor: colors.surface,
	},
	option: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
	},
}));
