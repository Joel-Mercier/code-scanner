import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { create } from "zustand";
import { boxShadow, makeStyles, useTheme } from "@/theme";
import { enter, exit } from "@/theme/motion";
import { Text } from "./Text";

type Tone = "info" | "warning";
type ToastMessage = { id: number; text: string; tone: Tone };

const useToastStore = create<{ current: ToastMessage | null }>(() => ({
	current: null,
}));

let timer: ReturnType<typeof setTimeout> | undefined;

export const toast = (text: string, tone: Tone = "info") => {
	clearTimeout(timer);
	useToastStore.setState({ current: { id: Date.now(), text, tone } });
	timer = setTimeout(() => useToastStore.setState({ current: null }), 2200);
};

/** A white pill with a status dot, like the scanner's "Looking for codes". */
export function ToastHost() {
	const { colors, shadows } = useTheme();
	const styles = useStyles();
	const current = useToastStore((state) => state.current);
	const insets = useSafeAreaInsets();
	return (
		<View
			pointerEvents="none"
			style={[StyleSheet.absoluteFill, { paddingTop: insets.top + 8 }]}
		>
			{current && (
				<Animated.View
					key={current.id}
					entering={enter.pop()}
					exiting={exit.fade()}
					style={[styles.toast, boxShadow(shadows.card)]}
				>
					<View
						style={[
							styles.dot,
							{
								backgroundColor:
									current.tone === "warning" ? colors.danger : colors.accent,
							},
						]}
					/>
					<Text size={14} weight="medium" style={styles.text}>
						{current.text}
					</Text>
				</Animated.View>
			)}
		</View>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	toast: {
		alignSelf: "center",
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		maxWidth: "88%",
		paddingVertical: 9,
		paddingHorizontal: 14,
		borderRadius: 999,
		backgroundColor: colors.surface,
	},
	dot: { width: 7, height: 7, borderRadius: 3.5 },
	text: { flexShrink: 1 },
}));
