import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Pressable } from "@/components/ui/Pressable";
import { makeStyles, SCREEN_GAP, useTheme } from "@/theme";
import type { ScanMode } from "../hooks/useModeSwitch";

/** Height of the bar's tallest control, the shutter. */
export const SHUTTER = 74;

/** Collection, the shutter (photo scan / document scan), and create. */
export function BottomBar({
	mode,
	busy,
	onShutter,
}: {
	mode: ScanMode;
	/** Disables the shutter (a document scan is under way). */
	busy: boolean;
	onShutter: () => void;
}) {
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const codes = mode === "codes";
	return (
		<View
			style={[styles.nav, { paddingBottom: insets.bottom + SCREEN_GAP }]}
			accessibilityRole="toolbar"
		>
			<IconButton
				icon="grid"
				size={52}
				iconSize={21}
				accessibilityLabel={t("app.library.title")}
				onPress={() => router.push("/library")}
				style={styles.start}
			/>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={t(
					codes ? "app.scan.from_gallery" : "app.scan.scan_document",
				)}
				disabled={busy}
				haptic
				pressedScale={0.94}
				onPress={onShutter}
				style={styles.shutter}
			>
				<View style={styles.shutterFace}>
					<Icon
						name={codes ? "imagePlus" : "scan"}
						size={24}
						color={colors.canvas}
					/>
				</View>
			</Pressable>
			<IconButton
				icon="plus"
				size={52}
				iconSize={21}
				accessibilityLabel={t("app.create.title")}
				onPress={() => router.push("/create")}
				style={styles.end}
			/>
		</View>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	nav: {
		marginTop: "auto",
		paddingHorizontal: 28,
		flexDirection: "row",
		alignItems: "center",
	},
	start: { marginRight: "auto" },
	end: { marginLeft: "auto" },
	shutter: {
		width: SHUTTER,
		height: SHUTTER,
		borderRadius: SHUTTER / 2,
		borderWidth: 1.5,
		borderColor: colors.ink,
		alignItems: "center",
		justifyContent: "center",
	},
	shutterFace: {
		width: 62,
		height: 62,
		borderRadius: 31,
		backgroundColor: colors.ink,
		alignItems: "center",
		justifyContent: "center",
	},
}));
