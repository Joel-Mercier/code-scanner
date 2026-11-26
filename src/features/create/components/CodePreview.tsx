import type { BarcodeType } from "expo-camera";
import { useTranslation } from "react-i18next";
import { useWindowDimensions, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { CodeArt } from "@/components/codes/CodeArt";
import { useTilt } from "@/components/codes/motion";
import { FloorShadow } from "@/components/ui/FloorShadow";
import { Icon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { type CodeStyle, paperOf } from "@/domain/codes/style";
import { boxShadow, makeStyles, useSharedStyles, useTheme } from "@/theme";
import { enter } from "@/theme/motion";

const PREVIEW = 216;

/** The live code on its tilted card, or a dashed placeholder until valid. */
export function CodePreview({
	format,
	payload,
	style,
	selectionKey,
}: {
	format: BarcodeType;
	/** `null` while the form isn't valid yet. */
	payload: string | null;
	style: CodeStyle;
	/** Replays the entrance when the type changes. */
	selectionKey: string;
}) {
	const shared = useSharedStyles();
	const { colors, shadows } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const { width } = useWindowDimensions();
	const { rotateX, rotateY } = useTilt();
	const tilt = useAnimatedStyle(() => ({
		transform: [
			{ perspective: 1000 },
			{ rotateX: `${rotateX.get()}deg` },
			{ rotateY: `${rotateY.get()}deg` },
		],
	}));
	const qr = format === "qr";
	const cardWidth = qr ? PREVIEW : Math.min(width - 64, 300);

	if (!payload) {
		return (
			<View style={styles.stage}>
				<Animated.View
					key="empty"
					entering={enter.fade()}
					style={[
						shared.dashed,
						shared.center,
						styles.placeholder,
						{ width: cardWidth },
					]}
				>
					<Icon
						name={qr ? "qr" : "barcode"}
						size={32}
						color={colors.muted}
						strokeWidth={1.5}
					/>
					<Text size={14} leading={1.4} color={colors.muted} align="center">
						{t("app.create.preview_hint")}
					</Text>
				</Animated.View>
			</View>
		);
	}

	return (
		<View style={styles.stage}>
			<Animated.View entering={enter.fade()} style={styles.shadow}>
				<FloorShadow />
			</Animated.View>
			<Animated.View key={selectionKey} entering={enter.lift()}>
				<Animated.View
					style={[
						styles.card,
						boxShadow(
							`inset 0px 0px 0px 1px rgba(14,14,16,0.06), ${shadows.raised}`,
						),
						{
							width: cardWidth,
							minHeight: qr ? PREVIEW : undefined,
							backgroundColor: paperOf(style),
						},
						tilt,
					]}
				>
					<Animated.View key={style.dots} entering={enter.pop()}>
						<CodeArt
							format={format}
							data={payload}
							style={style}
							size={cardWidth - 52}
						/>
					</Animated.View>
				</Animated.View>
			</Animated.View>
		</View>
	);
}

const useStyles = makeStyles(() => ({
	stage: {
		height: 300,
		alignItems: "center",
		justifyContent: "center",
	},
	shadow: { position: "absolute", bottom: 22 - 24 },
	card: {
		borderRadius: 32,
		padding: 26,
		alignItems: "center",
		justifyContent: "center",
	},
	placeholder: {
		height: PREVIEW,
		borderRadius: 32,
		borderWidth: 1.5,
		gap: 12,
		padding: 24,
	},
}));
