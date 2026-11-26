import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { makeStyles, useTheme } from "@/theme";
import { ease } from "@/theme/motion";
import { haptics } from "@/utils/haptics";
import { Pressable } from "./Pressable";
import { Text } from "./Text";

type TabsProps<T extends string> = {
	value: T;
	options: { value: T; label: string }[];
	onChange: (value: T) => void;
};

const INDICATOR = 28;

/** Equal-width text tabs over a hairline, with a short sliding underline. */
export function Tabs<T extends string>({
	value,
	options,
	onChange,
}: TabsProps<T>) {
	const { colors } = useTheme();
	const styles = useStyles();
	const [width, setWidth] = useState(0);
	const index = Math.max(
		0,
		options.findIndex((option) => option.value === value),
	);
	const column = width / options.length;
	const left = useSharedValue(0);

	useEffect(() => {
		left.set(withTiming(column * (index + 0.5) - INDICATOR / 2, ease));
	}, [column, index, left]);

	const indicator = useAnimatedStyle(() => ({
		transform: [{ translateX: left.get() }],
	}));

	return (
		<View
			accessibilityRole="tablist"
			onLayout={(event) => {
				const next = event.nativeEvent.layout.width;
				left.set((next / options.length) * (index + 0.5) - INDICATOR / 2);
				setWidth(next);
			}}
			style={styles.row}
		>
			{options.map((option) => {
				const active = option.value === value;
				return (
					<Pressable
						key={option.value}
						accessibilityRole="tab"
						accessibilityState={{ selected: active }}
						pressedScale={0.96}
						onPress={() => {
							if (active) return;
							haptics.select();
							onChange(option.value);
						}}
						style={styles.tab}
					>
						<Text
							size={15}
							weight={active ? "semibold" : "regular"}
							color={active ? colors.ink : colors.muted}
							numberOfLines={1}
						>
							{option.label}
						</Text>
					</Pressable>
				);
			})}
			{width > 0 && <Animated.View style={[styles.indicator, indicator]} />}
		</View>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	row: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	tab: { flex: 1, height: 44, alignItems: "center", justifyContent: "center" },
	indicator: {
		position: "absolute",
		left: 0,
		bottom: -1,
		width: INDICATOR,
		height: 2,
		borderRadius: 1,
		backgroundColor: colors.ink,
	},
}));
