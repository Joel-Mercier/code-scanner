import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
	HEADER_ROW,
	HEADER_TOP,
	makeStyles,
	SCREEN_GAP,
	useTheme,
	withAlpha,
} from "@/theme";
import { IconButton } from "./IconButton";

type HeaderProps = {
	/** Replaces the back button. */
	left?: ReactNode;
	center?: ReactNode;
	right?: ReactNode;
	onBack?: () => void;
	/** `close` shows an ✕ instead of an arrow (modal screens). */
	backIcon?: "back" | "close";
};

/**
 * The top bar: a round back button, an optional centre and right slot. It
 * floats over the screen on a fade of the page colour, so content scrolls
 * under it; start the content at `useScreenInsets().top`.
 */
export function Header({
	left,
	center,
	right,
	onBack,
	backIcon = "back",
}: HeaderProps) {
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const back = () => {
		if (onBack) onBack();
		else if (router.canGoBack()) router.back();
		else router.replace("/");
	};
	// Solid behind the status bar, then fading out past the buttons.
	const solid = insets.top + HEADER_TOP;
	const height = solid + HEADER_ROW + SCREEN_GAP;
	const stop = (px: number) => `${((px / height) * 100).toFixed(1)}%`;
	const fade = `linear-gradient(to bottom, ${colors.canvas} 0%, ${withAlpha(colors.canvas, 0.92)} ${stop(solid)}, ${withAlpha(colors.canvas, 0.7)} ${stop(solid + HEADER_ROW * 0.6)}, ${withAlpha(colors.canvas, 0)} 100%)`;

	return (
		<View pointerEvents="box-none" style={styles.overlay}>
			<View
				pointerEvents="none"
				style={[styles.fade, { height, backgroundImage: fade }]}
			/>
			<View
				pointerEvents="box-none"
				style={[styles.row, { paddingTop: solid }]}
			>
				{left ?? (
					<IconButton
						icon={backIcon}
						accessibilityLabel={t(
							backIcon === "close" ? "app.common.close" : "app.common.back",
						)}
						onPress={back}
					/>
				)}
				{center && (
					<View pointerEvents="box-none" style={styles.center}>
						{center}
					</View>
				)}
				<View pointerEvents="box-none" style={styles.right}>
					{right}
				</View>
			</View>
		</View>
	);
}

const useStyles = makeStyles(() => ({
	overlay: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
	fade: { position: "absolute", top: 0, left: 0, right: 0 },
	row: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 10,
		paddingHorizontal: 16,
		minHeight: HEADER_ROW,
	},
	center: {
		position: "absolute",
		left: 70,
		right: 70,
		bottom: 0,
		height: HEADER_ROW,
		alignItems: "center",
		justifyContent: "center",
	},
	right: { flexDirection: "row", gap: 8, minHeight: HEADER_ROW },
}));
