import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import { Eyebrow, Text } from "@/components/ui/Text";
import {
	type CodeInk,
	type CodePaper,
	type CodeShape,
	type CodeStyle,
	codeInks,
	codePapers,
	inkOf,
	paperOf,
	type QRDotStyle,
	scanRisk,
} from "@/domain/codes/style";
import { makeStyles, radii, useSharedStyles, useTheme } from "@/theme";
import { enter } from "@/theme/motion";
import { ColorSwatches } from "./ColorSwatches";
import { DotGlyph } from "./DotGlyph";

const DOT_STYLES: QRDotStyle[] = ["square", "rounded", "dots"];
const SHAPES: CodeShape[] = ["square", "rectangle"];

type StylePanelProps = {
	style: CodeStyle;
	/** QR codes also get dot shapes, a logo and a sturdier build. */
	qr: boolean;
	/** Data Matrix codes can be square or rectangular. */
	shapes: boolean;
	onInkChange: (ink: string) => void;
	onPaperChange: (paper: string) => void;
	onDotsChange: (dots: QRDotStyle) => void;
	onLogoChange: (logo: string | undefined) => void;
	onSturdyChange: (sturdy: boolean) => void;
	onShapeChange: (shape: CodeShape) => void;
	/** Opens the custom colour picker. */
	onPickColor: (request: {
		title: string;
		initial: string;
		onPick: (hex: string) => void;
	}) => void;
};

/**
 * The "Style" card: ink, paper, a scan-risk warning; then dots, sturdiness
 * and logo for QR codes, or the shape of a Data Matrix.
 */
export function StylePanel({
	style,
	qr,
	shapes,
	onInkChange,
	onPaperChange,
	onDotsChange,
	onLogoChange,
	onSturdyChange,
	onShapeChange,
	onPickColor,
}: StylePanelProps) {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const risk = scanRisk(inkOf(style), paperOf(style));

	const inkLabels = Object.fromEntries(
		Object.keys(codeInks).map((key) => [key, t(`app.color.inks.${key}`)]),
	) as Record<CodeInk, string>;
	const paperLabels = Object.fromEntries(
		Object.keys(codePapers).map((key) => [key, t(`app.color.papers.${key}`)]),
	) as Record<CodePaper, string>;

	const pickLogo = async () => {
		const picked = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.8,
		});
		if (!picked.canceled) onLogoChange(picked.assets[0].uri);
	};

	return (
		<View style={[shared.card, styles.panel]}>
			<Text size={20} weight="semibold" tracking={-0.015}>
				{t("app.create.style")}
			</Text>
			<View style={styles.field}>
				<Eyebrow>{t("app.create.color")}</Eyebrow>
				<ColorSwatches
					presets={codeInks}
					labels={inkLabels}
					value={style.color}
					onChange={onInkChange}
					accessibilityLabel={t("app.create.color")}
					customLabel={t("app.color.custom")}
					onCustom={() =>
						onPickColor({
							title: t("app.create.color"),
							initial: inkOf(style),
							onPick: onInkChange,
						})
					}
				/>
			</View>
			<View style={styles.field}>
				<Eyebrow>{t("app.create.background")}</Eyebrow>
				<ColorSwatches
					presets={codePapers}
					labels={paperLabels}
					value={style.background ?? "white"}
					onChange={onPaperChange}
					light
					accessibilityLabel={t("app.create.background")}
					customLabel={t("app.color.custom")}
					onCustom={() =>
						onPickColor({
							title: t("app.create.background"),
							initial: paperOf(style),
							onPick: onPaperChange,
						})
					}
				/>
			</View>
			{risk && (
				<Animated.View entering={enter.up()} style={shared.warning}>
					<Icon name="alert" size={18} color={colors.danger} />
					<Text size={13} leading={1.4} color={colors.body} style={shared.flex}>
						{t(`app.create.scan_risk.${risk}`)}
					</Text>
				</Animated.View>
			)}
			{shapes && (
				<View style={styles.field}>
					<Eyebrow>{t("app.create.shape")}</Eyebrow>
					<Segmented
						value={style.shape ?? "square"}
						onChange={onShapeChange}
						tone="tile"
						height={48}
						weight="medium"
						accessibilityLabel={t("app.create.shape")}
						options={SHAPES.map((value) => ({
							value,
							label: t(`app.create.shape_${value}`),
						}))}
					/>
				</View>
			)}
			{qr && (
				<>
					<View style={styles.field}>
						<Eyebrow>{t("app.create.dots")}</Eyebrow>
						<Segmented
							value={style.dots ?? "rounded"}
							onChange={onDotsChange}
							tone="tile"
							height={48}
							weight="medium"
							accessibilityLabel={t("app.create.dots")}
							options={DOT_STYLES.map((value) => ({
								value,
								label: t(`app.create.dots_${value}`),
								leading: (color: string) => (
									<DotGlyph style={value} color={color} />
								),
							}))}
						/>
					</View>
					<View style={styles.sturdy}>
						<View style={[shared.flex, styles.sturdyText]}>
							<Text size={16}>{t("app.create.sturdy")}</Text>
							<Text size={13} leading={1.4} color={colors.muted}>
								{t(
									style.logo
										? "app.create.sturdy_logo"
										: "app.create.sturdy_hint",
								)}
							</Text>
						</View>
						{/* A logo already needs the most error correction. */}
						{!style.logo && (
							<Switch
								value={!!style.sturdy}
								onChange={onSturdyChange}
								accessibilityLabel={t("app.create.sturdy")}
							/>
						)}
					</View>
					<View style={styles.field}>
						<Eyebrow>{t("app.create.logo")}</Eyebrow>
						{style.logo ? (
							<View style={styles.logoRow}>
								<Image
									source={style.logo}
									style={styles.logo}
									contentFit="cover"
								/>
								<Button
									variant="secondary"
									icon="imagePlus"
									label={t("app.create.change_logo")}
									onPress={pickLogo}
									style={shared.flex}
								/>
								<IconButton
									icon="trash"
									size={52}
									accessibilityLabel={t("app.create.remove_logo")}
									onPress={() => onLogoChange(undefined)}
								/>
							</View>
						) : (
							<Button
								variant="dashed"
								icon="imagePlus"
								label={t("app.create.add_logo")}
								onPress={pickLogo}
							/>
						)}
					</View>
				</>
			)}
		</View>
	);
}

const useStyles = makeStyles(() => ({
	panel: {
		marginTop: 14,
		marginHorizontal: 16,
		paddingVertical: 20,
		paddingHorizontal: 18,
		borderRadius: radii.xl,
		gap: 22,
	},
	field: { gap: 10 },
	sturdy: { flexDirection: "row", alignItems: "center", gap: 12 },
	sturdyText: { gap: 4 },
	logoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
	logo: { width: 52, height: 52, borderRadius: radii.md },
}));
