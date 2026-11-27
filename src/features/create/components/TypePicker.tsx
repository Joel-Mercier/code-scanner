import { useTranslation } from "react-i18next";
import { useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";
import { kindIcons } from "@/components/codes/kindIcons";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ListCard, ListRow } from "@/components/ui/List";
import { Pressable } from "@/components/ui/Pressable";
import { Segmented } from "@/components/ui/Segmented";
import { LargeTitle, Text } from "@/components/ui/Text";
import { qrKinds } from "@/domain/codes/describe";
import type { QRKind } from "@/domain/codes/payload";
import { makeStyles, useSharedStyles, useTheme } from "@/theme";
import { enter, stagger } from "@/theme/motion";
import {
	type BarcodeChoice,
	barcodeTypes,
	choiceLabel,
} from "../barcodeOptions";

export type CodeTab = "qr" | "barcode";

const COLUMNS = 3;
const GRID_PADDING = 16;
const GRID_GAP = 12;

function KindTile({
	icon,
	label,
	delay,
	width,
	onPress,
}: {
	icon: IconName;
	label: string;
	delay: number;
	width: number;
	onPress: () => void;
}) {
	const shared = useSharedStyles();
	const styles = useStyles();
	return (
		<Animated.View entering={enter.lift(delay)} style={{ width }}>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={label}
				onPress={onPress}
				haptic
				style={[shared.floating, shared.center, styles.kind]}
			>
				<View style={[shared.iconTile, styles.kindIcon]}>
					<Icon name={icon} size={22} />
				</View>
				<Text size={15} weight="medium" numberOfLines={1}>
					{label}
				</Text>
			</Pressable>
		</Animated.View>
	);
}

/** Step one of the workshop: a QR payload kind or a barcode format. */
export function TypePicker({
	tab,
	onTabChange,
	onPickQR,
	onPickBarcode,
}: {
	tab: CodeTab;
	onTabChange: (tab: CodeTab) => void;
	onPickQR: (kind: QRKind) => void;
	onPickBarcode: (type: BarcodeChoice) => void;
}) {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	// Fixed widths, so a last row that isn't full keeps the same tiles.
	const { width } = useWindowDimensions();
	const tileWidth = Math.floor(
		(width - GRID_PADDING * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS,
	);
	return (
		<>
			<Animated.View entering={enter.up()} style={shared.titleBlock}>
				<LargeTitle>{t("app.create.title")}</LargeTitle>
			</Animated.View>
			<Animated.View entering={enter.up(50)} style={styles.segmented}>
				<Segmented
					value={tab}
					onChange={onTabChange}
					accessibilityLabel={t("app.create.code_type")}
					options={[
						{ value: "qr", label: t("app.create.qr"), icon: "qr" },
						{
							value: "barcode",
							label: t("app.create.barcode"),
							icon: "barcode",
						},
					]}
				/>
			</Animated.View>
			{tab === "qr" ? (
				<View key="qr">
					<Animated.View entering={enter.up(100)}>
						<Text size={15} color={colors.muted} style={styles.prompt}>
							{t("app.create.pick_type")}
						</Text>
					</Animated.View>
					<View style={styles.kinds}>
						{qrKinds.map((kind, index) => (
							<KindTile
								key={kind}
								icon={kindIcons[kind]}
								label={t(`app.kinds.${kind}`)}
								delay={index * 30}
								width={tileWidth}
								onPress={() => onPickQR(kind)}
							/>
						))}
					</View>
				</View>
			) : (
				<View key="barcode">
					<Animated.View entering={enter.up()}>
						<Text size={15} color={colors.muted} style={styles.prompt}>
							{t("app.create.pick_format")}
						</Text>
					</Animated.View>
					<ListCard style={styles.formats}>
						{barcodeTypes.map((type, index) => (
							<Animated.View key={type} entering={enter.up(stagger(index, 40))}>
								<ListRow
									icon="barcode"
									iconTile={40}
									label={choiceLabel(type)}
									description={t(`app.barcode_formats.${type}`)}
									height={64}
									chevron
									last={index === barcodeTypes.length - 1}
									onPress={() => onPickBarcode(type)}
								/>
							</Animated.View>
						))}
					</ListCard>
				</View>
			)}
		</>
	);
}

const useStyles = makeStyles(() => ({
	segmented: { marginTop: 16, marginHorizontal: 16 },
	prompt: { marginTop: 22, marginBottom: 14, marginHorizontal: 20 },
	kinds: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: GRID_GAP,
		paddingHorizontal: GRID_PADDING,
	},
	kind: { aspectRatio: 1, borderRadius: 20, gap: 12 },
	kindIcon: { width: 46, height: 46, borderRadius: 14 },
	formats: { marginHorizontal: 16 },
}));
