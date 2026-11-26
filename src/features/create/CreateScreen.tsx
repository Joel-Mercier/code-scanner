import type { BarcodeType } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useEffectEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { validateBarcode } from "@/components/codes/geometry/barcode";
import { kindIcons } from "@/components/codes/kindIcons";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { Icon } from "@/components/ui/Icon";
import { Pressable } from "@/components/ui/Pressable";
import { StatusBar } from "@/components/ui/StatusBar";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { useColorPicker } from "@/components/ui/useColorPicker";
import { barcodeLabels, type GeneratableBarcode } from "@/domain/codes/formats";
import type { QRKind } from "@/domain/codes/payload";
import type { CodeStyle, QRDotStyle } from "@/domain/codes/style";
import { attempt } from "@/lib/attempt";
import { haptics } from "@/lib/haptics";
import { persistLogo } from "@/services/logos";
import useLibrary from "@/stores/library";
import {
	makeStyles,
	radii,
	useScreenInsets,
	useSharedStyles,
	useTheme,
} from "@/theme";
import { sampleBarcodes } from "./barcodeOptions";
import { BarcodeContentField } from "./components/BarcodeContentField";
import { CodePreview } from "./components/CodePreview";
import { FormFields } from "./components/FormFields";
import { StylePanel } from "./components/StylePanel";
import { type CodeTab, TypePicker } from "./components/TypePicker";
import {
	type FieldValue,
	type FormState,
	qrForms,
	validateQR,
} from "./qrForms";

type Selection =
	| { tab: "qr"; kind: QRKind }
	| { tab: "barcode"; type: GeneratableBarcode };

const TEXT_MAX = 2000;

/**
 * The code workshop: pick a QR kind or a barcode format, fill it in, style
 * it, save it to the collection.
 */
export function CreateScreen() {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const router = useRouter();
	const edges = useScreenInsets();
	const addCode = useLibrary((state) => state.addCode);
	const colorPicker = useColorPicker();

	const [tab, setTab] = useState<CodeTab>("qr");
	const [selection, setSelection] = useState<Selection | null>(null);
	const [form, setForm] = useState<FormState>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});
	const [barcodeContent, setBarcodeContent] = useState("");
	const [ink, setInk] = useState<string>("ink");
	const [paper, setPaper] = useState<string>("white");
	const [dots, setDots] = useState<QRDotStyle>("rounded");
	const [logo, setLogo] = useState<string | undefined>();
	const [saving, setSaving] = useState(false);

	// Android's back button goes back to the type picker first.
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

	const save = async () => {
		if (!payload || !format || !selection) {
			// Reveal every error at once.
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

	if (!selection) {
		return (
			<View style={shared.screen}>
				<StatusBar />
				<Header />
				<KeyboardAwareScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={edges.content}
				>
					<TypePicker
						tab={tab}
						onTabChange={setTab}
						onPickQR={pickQR}
						onPickBarcode={pickBarcode}
					/>
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
					<CodePreview
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
						<BarcodeContentField
							type={selection.type}
							value={barcodeContent}
							onChange={setBarcodeContent}
							onBlur={() => setTouched({ content: true })}
							error={touched.content ? barcodeError : null}
						/>
					)}
				</View>

				<StylePanel
					style={style}
					qr={qr}
					onInkChange={setInk}
					onPaperChange={setPaper}
					onDotsChange={setDots}
					onLogoChange={setLogo}
					onPickColor={colorPicker.open}
				/>

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

const useStyles = makeStyles(({ colors }) => ({
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
	fields: { marginHorizontal: 16 },
	save: { paddingTop: 20, paddingHorizontal: 16 },
}));
