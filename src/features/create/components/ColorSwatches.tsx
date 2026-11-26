import { View } from "react-native";
import Animated from "react-native-reanimated";
import { Icon } from "@/components/ui/Icon";
import { Pressable } from "@/components/ui/Pressable";
import { readableOn } from "@/lib/color";
import { haptics } from "@/lib/haptics";
import { makeStyles, useTheme } from "@/theme";
import { enter } from "@/theme/motion";

const SIZE = 40;
/** A ring around the picked swatch, with a gap in the card colour. */
const selectedRing = (gap: string, ring: string) =>
	`0px 0px 0px 3px ${gap}, 0px 0px 0px 5px ${ring}`;
const HAIRLINE = "inset 0px 0px 0px 1px rgba(14,14,16,0.15)";

type ColorSwatchesProps<K extends string> = {
	presets: Record<K, string>;
	labels: Record<K, string>;
	/** A preset key, or a custom hex colour. */
	value: string;
	onChange: (value: K) => void;
	onCustom: () => void;
	customLabel: string;
	/** Light swatches get a hairline so white shows on white. */
	light?: boolean;
	accessibilityLabel: string;
};

function Check({ fill }: { fill: string }) {
	return (
		<Animated.View entering={enter.pop()}>
			<Icon name="check" size={16} color={readableOn(fill)} strokeWidth={2.4} />
		</Animated.View>
	);
}

/** Six preset colours and a dashed "+" for a custom one. */
export function ColorSwatches<K extends string>({
	presets,
	labels,
	value,
	onChange,
	onCustom,
	customLabel,
	light = false,
	accessibilityLabel,
}: ColorSwatchesProps<K>) {
	const { colors } = useTheme();
	const styles = useStyles();
	const keys = Object.keys(presets) as K[];
	const custom = !keys.includes(value as K);
	const SELECTED = selectedRing(colors.surface, colors.ink);

	return (
		<View
			accessibilityRole="radiogroup"
			accessibilityLabel={accessibilityLabel}
			style={styles.row}
		>
			{keys.map((key) => {
				const selected = value === key;
				return (
					<View key={key} style={styles.cell}>
						<Pressable
							accessibilityRole="radio"
							accessibilityLabel={labels[key]}
							accessibilityState={{ selected }}
							pressedScale={0.9}
							onPress={() => {
								haptics.select();
								onChange(key);
							}}
							style={[
								styles.swatch,
								{
									backgroundColor: presets[key],
									boxShadow: selected ? SELECTED : light ? HAIRLINE : undefined,
								},
							]}
						>
							{selected && <Check fill={presets[key]} />}
						</Pressable>
					</View>
				);
			})}
			<View style={styles.cell}>
				<Pressable
					accessibilityRole="radio"
					accessibilityLabel={customLabel}
					accessibilityState={{ selected: custom }}
					pressedScale={0.9}
					onPress={() => {
						haptics.select();
						onCustom();
					}}
					style={[
						styles.swatch,
						custom
							? { backgroundColor: value, boxShadow: SELECTED }
							: styles.custom,
					]}
				>
					{custom ? (
						<Check fill={value} />
					) : (
						<Icon name="plus" size={16} color={colors.muted} />
					)}
				</Pressable>
			</View>
		</View>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	row: { flexDirection: "row", gap: 6 },
	cell: { flex: 1, alignItems: "center" },
	swatch: {
		width: SIZE,
		height: SIZE,
		borderRadius: SIZE / 2,
		alignItems: "center",
		justifyContent: "center",
	},
	custom: {
		borderWidth: 1.5,
		borderStyle: "dashed",
		borderColor: colors.dashedStrong,
	},
}));
