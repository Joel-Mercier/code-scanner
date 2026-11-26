import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, {
	type SharedValue,
	useAnimatedStyle,
} from "react-native-reanimated";
import { Pressable } from "@/components/ui/Pressable";
import { Text } from "@/components/ui/Text";
import { makeStyles, useTheme } from "@/theme";
import type { ScanMode } from "../hooks/useModeSwitch";

const MODES: ScanMode[] = ["codes", "docs"];

/** "Codes · Docs" over the feed; the underline follows the swipe. */
export function ModeTabs({
	mode,
	progress,
	onChange,
}: {
	mode: ScanMode;
	/** 0 codes, 1 docs. */
	progress: SharedValue<number>;
	onChange: (mode: ScanMode) => void;
}) {
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	// Over the camera (codes) the tabs are white; on the docs backdrop, ink.
	const onCamera = mode === "codes";
	const codesLine = useAnimatedStyle(() => ({ opacity: 1 - progress.get() }));
	const docsLine = useAnimatedStyle(() => ({ opacity: progress.get() }));

	return (
		<View accessibilityRole="tablist" style={styles.modes}>
			{MODES.map((value) => {
				const active = value === mode;
				const color = onCamera
					? active
						? colors.white
						: "rgba(255,255,255,0.78)"
					: active
						? colors.ink
						: colors.muted;
				return (
					<Pressable
						key={value}
						accessibilityRole="tab"
						accessibilityState={{ selected: active }}
						onPress={() => onChange(value)}
						style={styles.mode}
					>
						<Text
							size={16}
							weight={active ? "semibold" : "medium"}
							color={color}
						>
							{t(`app.scan.${value}`)}
						</Text>
						<Animated.View
							style={[
								styles.modeLine,
								{ backgroundColor: onCamera ? colors.white : colors.ink },
								value === "codes" ? codesLine : docsLine,
							]}
						/>
					</Pressable>
				);
			})}
		</View>
	);
}

const useStyles = makeStyles(() => ({
	modes: { flexDirection: "row", gap: 6 },
	mode: {
		height: 44,
		paddingHorizontal: 12,
		alignItems: "center",
		justifyContent: "center",
		gap: 5,
	},
	modeLine: { width: 18, height: 2, borderRadius: 1 },
}));
