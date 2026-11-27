import { useKeepAwake } from "expo-keep-awake";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CodeArt } from "@/components/codes/CodeArt";
import { useModalGuard } from "@/components/lock/hooks";
import { IconButton } from "@/components/ui/IconButton";
import { Pressable } from "@/components/ui/Pressable";
import { StatusBar } from "@/components/ui/StatusBar";
import { Text } from "@/components/ui/Text";
import { describeItem } from "@/domain/codes/describe";
import { isLinearBarcode } from "@/domain/codes/formats";
import { paperOf } from "@/domain/codes/style";
import { readableOn, withAlpha } from "@/lib/color";
import useLibrary from "@/stores/library";
import { makeStyles } from "@/theme";
import { enter } from "@/theme/motion";
import { useFullBrightness } from "./hooks/useFullBrightness";

/** Room kept around the code: its quiet zone, and the screen's edges. */
const MARGIN = 28;
/** The title and the hint under the code. */
const CAPTION = 132;

/**
 * A code on its own, as big as the screen allows, on its paper, with the
 * screen at full brightness and kept awake: to hold it up to a scanner.
 * Tap anywhere to close.
 */
export function ShowCodeScreen({ id }: { id: string }) {
	const styles = useStyles();
	const { t } = useTranslation();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { width, height } = useWindowDimensions();
	const item = useLibrary((state) => state.items[id]);
	// A native modal sits above the lock: it hides the code itself.
	const hidden = useModalGuard(item);
	useFullBrightness();
	useKeepAwake();

	const code = item?.kind === "code" ? item : undefined;
	// Codes are always printed dark on their paper, white by default.
	const paper = paperOf(code?.style);
	const ink = readableOn(paper);
	const close = () =>
		router.canGoBack() ? router.back() : router.replace("/");

	if (hidden || !code) {
		return <View style={[styles.screen, { backgroundColor: paper }]} />;
	}

	const roomX = width - insets.left - insets.right - MARGIN * 2;
	const roomY = height - insets.top - insets.bottom - MARGIN * 2 - CAPTION;
	// Barcodes take the whole width (their height follows); QR codes are square.
	const size = Math.max(
		120,
		isLinearBarcode(code.format) ? roomX : Math.min(roomX, roomY),
	);
	const described = describeItem(code);

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={t("app.code.close_full_screen")}
			pressedScale={1}
			onPress={close}
			style={[styles.screen, { backgroundColor: paper }]}
		>
			<StatusBar style={ink === "#FFFFFF" ? "light" : "dark"} />
			<View style={styles.center}>
				<Animated.View entering={enter.pop()}>
					<CodeArt
						format={code.format}
						data={code.data}
						style={code.style}
						size={size}
					/>
				</Animated.View>
				<Animated.View entering={enter.up(120)} style={styles.caption}>
					<Text
						size={20}
						weight="semibold"
						tracking={-0.015}
						align="center"
						numberOfLines={2}
						color={ink}
					>
						{described.title}
					</Text>
					<Text size={12} mono align="center" color={withAlpha(ink, 0.55)}>
						{t("app.code.tap_to_close").toUpperCase()}
					</Text>
				</Animated.View>
			</View>
			<View
				pointerEvents="box-none"
				style={[
					styles.bar,
					{ paddingTop: insets.top + 6, paddingRight: insets.right + 16 },
				]}
			>
				<IconButton
					icon="close"
					variant="solid"
					accessibilityLabel={t("app.common.close")}
					onPress={close}
				/>
			</View>
		</Pressable>
	);
}

const useStyles = makeStyles(() => ({
	screen: { flex: 1 },
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: MARGIN,
		gap: 28,
	},
	caption: { gap: 10, alignItems: "center", paddingHorizontal: 12 },
	bar: {
		position: "absolute",
		top: 0,
		right: 0,
		left: 0,
		flexDirection: "row",
		justifyContent: "flex-end",
	},
}));
