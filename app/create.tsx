import type { BarcodeType } from "expo-camera";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useEffectEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, useWindowDimensions, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { CodeArt } from "@/components/codes/CodeArt";
import { inkOf, paperOf, scanRisk } from "@/components/codes/codeColors";
import { Button } from "@/components/ui/Button";
import { FloorShadow } from "@/components/ui/Floor";
import { Header } from "@/components/ui/Header";
import { Icon, type IconName } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { ListCard, ListRow } from "@/components/ui/List";
import { Pressable } from "@/components/ui/Pressable";
import { Segmented } from "@/components/ui/Segmented";
import { StatusBar } from "@/components/ui/StatusBar";
import { Eyebrow, LargeTitle, Text } from "@/components/ui/Text";
import { TextField } from "@/components/ui/TextField";
import { toast } from "@/components/ui/Toast";
import { useColorPicker } from "@/components/ui/useColorPicker";
import { barcodeLabels, kindIcons, qrKinds } from "@/features/codes/kinds";
import { useTilt } from "@/features/codes/spin";
import { ColorSwatches } from "@/features/create/ColorSwatches";
import { FormFields } from "@/features/create/FormFields";
import {
	type FieldValue,
	type FormState,
	qrForms,
	validateQR,
} from "@/features/create/qrForms";
import useLibrary, { type CodeStyle } from "@/stores/library";
import {
	boxShadow,
	type CodeInk,
	type CodePaper,
	codeInks,
	codePapers,
	makeStyles,
	radii,
	useScreenInsets,
	useSharedStyles,
	useTheme,
} from "@/theme";
import { enter, stagger } from "@/theme/motion";
import { attempt } from "@/utils/attempt";
import {
	bwipIds,
	type GeneratableBarcode,
	validateBarcode,
} from "@/utils/barcodeGeometry";
import type { QRKind } from "@/utils/codePayload";
import { persistLogo } from "@/utils/documentFiles";
import { haptics } from "@/utils/haptics";
import type { QRDotStyle } from "@/utils/qrGeometry";

export { ErrorScreen as ErrorBoundary } from "@/components/ui/ErrorScreen";

type Tab = "qr" | "barcode";
type Selection =
	| { tab: "qr"; kind: QRKind }
	| { tab: "barcode"; type: GeneratableBarcode };

const TEXT_MAX = 2000;
const PREVIEW = 216;

/** Most common formats first. */
const barcodeTypes: GeneratableBarcode[] = [
	"ean13",
	"ean8",
	"upc_a",
	"upc_e",
	"code128",
	"code39",
	"itf14",
	"codabar",
	"datamatrix",
	"pdf417",
	"aztec",
].filter((type): type is GeneratableBarcode => type in bwipIds);
const numericBarcodes: GeneratableBarcode[] = [
	"ean13",
	"ean8",
	"itf14",
	"upc_a",
	"upc_e",
];
const sampleBarcodes: Partial<Record<GeneratableBarcode, string>> = {
	ean13: "5901234123457",
	ean8: "96385074",
	upc_a: "036000291452",
	upc_e: "01234565",
	itf14: "00012345600012",
};

/** The little glyphs in the "Dots" control. */
function DotGlyph({ style, color }: { style: QRDotStyle; color: string }) {
	const styles = useStyles();
	if (style === "rounded") {
		return (
			<View style={styles.glyphColumn}>
				<View style={[styles.glyphPill, { backgroundColor: color }]} />
				<View
					style={[styles.glyphCell, styles.round, { backgroundColor: color }]}
				/>
			</View>
		);
	}
	const cell = [
		styles.glyphCell,
		style === "dots" && styles.round,
		{ backgroundColor: color },
	];
	return (
		<View style={styles.glyphGrid}>
			<View style={cell} />
			<View style={cell} />
			<View style={cell} />
			<View style={styles.glyphCell} />
		</View>
	);
}

/** The live code on its tilted card, or a dashed placeholder. */
function Preview({
	format,
	payload,
	style,
	selectionKey,
}: {
	format: BarcodeType;
	payload: string | null;
	style: CodeStyle;
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
			<Animated.View entering={enter.fade()} style={styles.previewShadow}>
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

export default function CreateScreen() {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const router = useRouter();
	const edges = useScreenInsets();
	const addCode = useLibrary((state) => state.addCode);
	const colorPicker = useColorPicker();

	const [tab, setTab] = useState<Tab>("qr");
	const [selection, setSelection] = useState<Selection | null>(null);
	const [form, setForm] = useState<FormState>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});
	const [barcodeContent, setBarcodeContent] = useState("");
	const [ink, setInk] = useState<string>("ink");
	const [paper, setPaper] = useState<string>("white");
	const [dots, setDots] = useState<QRDotStyle>("rounded");
	const [logo, setLogo] = useState<string | undefined>();
	const [saving, setSaving] = useState(false);

	const onHardwareBack = useEffectEvent(() => {
		if (!selection) return false;
		setSelection(null);
		return true;
	});
	useEffect(() => {
		const subscription = BackHandler.addEventListener(
			"hardwareBackPress",
			onHardwareBack,
		);
		return () => subscription.remove();
	}, []);

	const pickQR = (kind: QRKind) => {
		setForm(qrForms[kind].initial);
		setTouched({});
		setSelection({ tab: "qr", kind });
	};
	const pickBarcode = (type: GeneratableBarcode) => {
		setBarcodeContent(sampleBarcodes[type] ?? "");
		setTouched({});
		setSelection({ tab: "barcode", type });
	};

	const qrValidation =
		selection?.tab === "qr" ? validateQR(selection.kind, form) : null;
	const barcodeError =
		selection?.tab === "barcode"
			? barcodeContent.trim()
				? validateBarcode(selection.type, barcodeContent.trim())
				: t("app.create.content_required")
			: null;

	const payload =
		selection?.tab === "qr"
			? qrValidation?.ok
				? qrValidation.payload
				: null
			: selection && !barcodeError
				? barcodeContent.trim()
				: null;
	const format: BarcodeType | null = selection
		? selection.tab === "qr"
			? "qr"
			: selection.type
		: null;
	const style: CodeStyle = {
		color: ink,
		background: paper === "white" ? undefined : paper,
		dots: selection?.tab === "qr" ? dots : undefined,
		logo: selection?.tab === "qr" ? logo : undefined,
	};

	const risk = scanRisk(inkOf(style), paperOf(style));

	const pickLogo = async () => {
		const picked = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.8,
		});
		if (!picked.canceled) setLogo(picked.assets[0].uri);
	};

	const save = async () => {
		if (!payload || !format || !selection) {
			setTouched(
				selection?.tab === "barcode"
					? { content: true }
					: Object.fromEntries(Object.keys(form).map((key) => [key, true])),
			);
			haptics.warning();
			return;
		}
		setSaving(true);
		const logoResult = await attempt(async () =>
			style.logo ? persistLogo(style.logo) : undefined,
		);
		setSaving(false);
		if (!logoResult.ok) {
			toast(t("app.common.something_went_wrong"), "warning");
			return;
		}
		const item = addCode({
			source: "created",
			format,
			data: payload,
			qrKind: selection.tab === "qr" ? selection.kind : undefined,
			style: { ...style, logo: logoResult.value },
		});
		haptics.success();
		toast(t("app.create.saved"));
		router.replace({ pathname: "/code/[id]", params: { id: item.id } });
	};

	const inkLabels = Object.fromEntries(
		Object.keys(codeInks).map((key) => [key, t(`app.color.inks.${key}`)]),
	) as Record<CodeInk, string>;
	const paperLabels = Object.fromEntries(
		Object.keys(codePapers).map((key) => [key, t(`app.color.papers.${key}`)]),
	) as Record<CodePaper, string>;

	if (!selection) {
		return (
			<View style={shared.screen}>
				<StatusBar />
				<Header />
				<KeyboardAwareScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={edges.content}
				>
					<Animated.View entering={enter.up()} style={shared.titleBlock}>
						<LargeTitle>{t("app.create.title")}</LargeTitle>
					</Animated.View>
					<Animated.View entering={enter.up(50)} style={styles.segmented}>
						<Segmented
							value={tab}
							onChange={setTab}
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
										onPress={() => pickQR(kind)}
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
									<Animated.View
										key={type}
										entering={enter.up(stagger(index, 40))}
									>
										<ListRow
											icon="barcode"
											iconTile={40}
											label={barcodeLabels[type] ?? type}
											description={t(`app.barcode_formats.${type}`)}
											height={64}
											chevron
											last={index === barcodeTypes.length - 1}
											onPress={() => pickBarcode(type)}
										/>
									</Animated.View>
								))}
							</ListCard>
						</View>
					)}
				</KeyboardAwareScrollView>
			</View>
		);
	}

	const qr = selection.tab === "qr";
	const selectionLabel = qr
		? t(`app.kinds.${selection.kind}`)
		: (barcodeLabels[selection.type] ?? selection.type);

	return (
		<View style={shared.screen}>
			<StatusBar />
			<Header
				onBack={() => setSelection(null)}
				right={
					<Pressable
						accessibilityRole="button"
						accessibilityLabel={t("app.create.change_type")}
						onPress={() => setSelection(null)}
						style={styles.change}
					>
						<Icon name={qr ? kindIcons[selection.kind] : "barcode"} size={18} />
						<Text size={15} weight="medium">
							{selectionLabel}
						</Text>
						<Text size={15} weight="medium" color={colors.muted}>
							· {t("app.create.change")}
						</Text>
					</Pressable>
				}
			/>
			<KeyboardAwareScrollView
				showsVerticalScrollIndicator={false}
				bottomOffset={24}
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={edges.content}
			>
				{format && (
					<Preview
						format={format}
						payload={payload}
						style={style}
						selectionKey={qr ? selection.kind : selection.type}
					/>
				)}

				<View style={styles.fields}>
					{qr ? (
						<FormFields
							fields={qrForms[selection.kind].fields}
							state={form}
							errors={
								qrValidation && !qrValidation.ok ? qrValidation.errors : {}
							}
							showErrors={touched}
							maxLength={selection.kind === "text" ? TEXT_MAX : undefined}
							onChange={(name: string, value: FieldValue) =>
								setForm((current) => ({ ...current, [name]: value }))
							}
							onBlur={(name) =>
								setTouched((current) => ({ ...current, [name]: true }))
							}
						/>
					) : (
						<View style={styles.field}>
							<Eyebrow>{t("app.fields.content")}</Eyebrow>
							<TextField
								value={barcodeContent}
								onChangeText={setBarcodeContent}
								onBlur={() => setTouched({ content: true })}
								keyboardType={
									numericBarcodes.includes(selection.type)
										? "number-pad"
										: "default"
								}
								autoCapitalize={
									selection.type === "code39" ? "characters" : "none"
								}
								autoCorrect={false}
								placeholder={t("app.placeholders.content")}
								invalid={!!(touched.content && barcodeError)}
							/>
							<Text
								size={13}
								color={
									touched.content && barcodeError ? colors.danger : colors.muted
								}
							>
								{touched.content && barcodeError
									? barcodeError
									: t(`app.barcode_help.${selection.type}`)}
							</Text>
						</View>
					)}
				</View>

				<View style={[shared.card, styles.personalise]}>
					<Text size={20} weight="semibold" tracking={-0.015}>
						{t("app.create.style")}
					</Text>
					<View style={styles.field}>
						<Eyebrow>{t("app.create.color")}</Eyebrow>
						<ColorSwatches
							presets={codeInks}
							labels={inkLabels}
							value={ink}
							onChange={setInk}
							accessibilityLabel={t("app.create.color")}
							customLabel={t("app.color.custom")}
							onCustom={() =>
								colorPicker.open({
									title: t("app.create.color"),
									initial: inkOf(style),
									onPick: setInk,
								})
							}
						/>
					</View>
					<View style={styles.field}>
						<Eyebrow>{t("app.create.background")}</Eyebrow>
						<ColorSwatches
							presets={codePapers}
							labels={paperLabels}
							value={paper}
							onChange={setPaper}
							light
							accessibilityLabel={t("app.create.background")}
							customLabel={t("app.color.custom")}
							onCustom={() =>
								colorPicker.open({
									title: t("app.create.background"),
									initial: paperOf(style),
									onPick: setPaper,
								})
							}
						/>
					</View>
					{risk && (
						<Animated.View entering={enter.up()} style={shared.warning}>
							<Icon name="alert" size={18} color={colors.danger} />
							<Text
								size={13}
								leading={1.4}
								color={colors.body}
								style={shared.flex}
							>
								{t(`app.create.scan_risk.${risk}`)}
							</Text>
						</Animated.View>
					)}
					{qr && (
						<>
							<View style={styles.field}>
								<Eyebrow>{t("app.create.dots")}</Eyebrow>
								<Segmented
									value={dots}
									onChange={setDots}
									tone="tile"
									height={48}
									weight="medium"
									accessibilityLabel={t("app.create.dots")}
									options={(["square", "rounded", "dots"] as const).map(
										(value) => ({
											value,
											label: t(`app.create.dots_${value}`),
											leading: (color: string) => (
												<DotGlyph style={value} color={color} />
											),
										}),
									)}
								/>
							</View>
							<View style={styles.field}>
								<Eyebrow>{t("app.create.logo")}</Eyebrow>
								{logo ? (
									<View style={styles.logoRow}>
										<Image
											source={logo}
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
											onPress={() => setLogo(undefined)}
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

				<View style={styles.save}>
					<Button
						icon="check"
						label={t("app.create.save")}
						disabled={!payload}
						inert={saving}
						onPress={save}
					/>
				</View>
			</KeyboardAwareScrollView>
			{colorPicker.element}
		</View>
	);
}

function KindTile({
	icon,
	label,
	delay,
	onPress,
}: {
	icon: IconName;
	label: string;
	delay: number;
	onPress: () => void;
}) {
	const shared = useSharedStyles();
	const styles = useStyles();
	return (
		<Animated.View entering={enter.lift(delay)} style={styles.kindCell}>
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

const useStyles = makeStyles(({ colors }) => ({
	segmented: { marginTop: 16, marginHorizontal: 16 },
	prompt: { marginTop: 22, marginBottom: 14, marginHorizontal: 20 },
	kinds: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
		paddingHorizontal: 16,
	},
	kindCell: { width: "31%", flexGrow: 1 },
	kind: { aspectRatio: 1, borderRadius: 20, gap: 12 },
	kindIcon: { width: 46, height: 46, borderRadius: 14 },
	formats: { marginHorizontal: 16 },
	change: {
		height: 46,
		paddingHorizontal: 16,
		borderRadius: radii.pill,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	stage: {
		height: 300,
		alignItems: "center",
		justifyContent: "center",
	},
	previewShadow: { position: "absolute", bottom: 22 - 24 },
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
	fields: { marginHorizontal: 16 },
	field: { gap: 10 },
	personalise: {
		marginTop: 14,
		marginHorizontal: 16,
		paddingVertical: 20,
		paddingHorizontal: 18,
		borderRadius: radii.xl,
		gap: 22,
	},
	logoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
	logo: { width: 52, height: 52, borderRadius: radii.md },
	save: { paddingTop: 20, paddingHorizontal: 16 },
	glyphGrid: { width: 12, flexDirection: "row", flexWrap: "wrap", gap: 2 },
	glyphColumn: { gap: 2 },
	glyphCell: { width: 5, height: 5 },
	glyphPill: { width: 12, height: 5, borderRadius: 3 },
	round: { borderRadius: 3 },
}));
