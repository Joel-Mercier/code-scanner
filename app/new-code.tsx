import { Button } from "@/components/ui/Button";
import { ThemedText } from "@/components/ui/ThemedText";
import i18n from "@/config/i18n";
import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import { useQRCode } from "@/hooks/useQRCode";
import { generateBarcode } from "@/services/barcodeapi";
import useScannerResults from "@/stores/scannerResultsStore";
import type { CodeType, CryptoType, EncryptionType } from "@/types";
import { QRCodeTypes, barcodeTypes } from "@/utils/data";
import {
	generateCryptoQRCodeData,
	generateEmailQRCodeData,
	generateLocationQRCodeData,
	generatePhoneQRCodeData,
	generateSMSQRCodeData,
	generateVCardQRCodeData,
	generateWifiQRCodeData,
} from "@/utils/generateQRCodeData";
import * as AlertDialogPrimitive from "@rn-primitives/alert-dialog";
import * as CollapsiblePrimitive from "@rn-primitives/collapsible";
import * as TabsPrimitive from "@rn-primitives/tabs";
import { useForm, useStore } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import type { BarcodeType } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import {
	ArrowLeft,
	AtSign,
	ChevronDown,
	ChevronUp,
	Download,
	IdCard,
	Link,
	MapPin,
	MessageSquare,
	Phone,
	QrCode,
	Settings,
	Type,
	Wallet,
	Wifi,
} from "lucide-react-native";
import type { QRCodeErrorCorrectionLevel, QRCodeToStringOptions } from "qrcode";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, StyleSheet, TextInput, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";
import ViewShot, { captureRef } from "react-native-view-shot";
import z from "zod/v4";

z.config(z.locales.fr());

type NewQRCodeForm = {
	value: string;
	type: CodeType;
	errorCorrectionLevel?: QRCodeErrorCorrectionLevel;
	margin?: number;
	scale?: number;
	width?: number;
	logo?: string;
	ssid?: string;
	password?: string;
	hidden?: boolean;
	encryption?: "WPA" | "WEP";
	subject?: string;
	body?: string;
	cc?: string;
	bcc?: string;
	firstName?: string;
	email?: string;
	phone?: string;
	organization?: string;
	title?: string;
	url?: string;
	address?: string;
	longitude: number;
	altitude?: number;
	crypto: CryptoType;
	amount: number;
	label?: string;
	message?: string;
};

type NewBarcodeForm = {
	content: string;
	type: BarcodeType;
	correction?: number;
	size?: number;
	fg?: string;
	bg?: string;
	text?: "bottom" | "top";
	dpi?: number;
	font?: number;
	height?: number;
	module?: number;
	pattern?: string;
	qz?: number;
};

const newBarcodeFormSchema = z.discriminatedUnion("type", [
	z.object({
		content: z
			.string()
			.regex(/^[ !\"#$%&\'()*+,\-.\/0-9:;<=>?@A-Z\[\]^_`a-z{|}~]+$/)
			.trim(),
		type: z.literal("aztec"),
		size: z.number().positive().optional(),
		qz: z.number().positive().optional(),
		correction: z.number().positive().optional(),
	}),
	z.object({
		content: z
			.string()
			.regex(/^[0-9\-:$\/.+]{1,22}$/)
			.trim(),
		type: z.literal("codabar"),
		fg: z.string().optional(),
		bg: z.string().optional(),
		module: z.number().positive().optional(),
		pattern: z.string().optional(),
		qz: z.number().positive().optional(),
		text: z.enum(["bottom", "top"]).optional(),
		dpi: z.number().positive().optional(),
		height: z.number().positive().optional(),
		font: z.number().positive().optional(),
	}),
	z.object({
		content: z
			.string()
			.regex(/^[ !\"#$%&\'()*+,\-.\/0-9:;<=>?@A-Z\[\]^_`a-z{|}~]{1,48}$/)
			.trim(),
		type: z.literal("code128"),
		fg: z.string().optional(),
		bg: z.string().optional(),
		module: z.number().positive().optional(),
		pattern: z.string().optional(),
		qz: z.number().positive().optional(),
		text: z.enum(["bottom", "top"]).optional(),
		dpi: z.number().positive().optional(),
		height: z.number().positive().optional(),
		font: z.number().positive().optional(),
	}),
	z.object({
		content: z
			.string()
			.regex(/^[A-Z*0-9 \-$%.\/+]{1,30}$/)
			.trim(),
		type: z.literal("code39"),
		fg: z.string().optional(),
		bg: z.string().optional(),
		module: z.number().positive().optional(),
		pattern: z.string().optional(),
		qz: z.number().positive().optional(),
		text: z.enum(["bottom", "top"]).optional(),
		dpi: z.number().positive().optional(),
		height: z.number().positive().optional(),
		font: z.number().positive().optional(),
	}),
	z.object({
		content: z
			.string()
			.regex(/^[ !\"#$%&\'()*+,\-.\/0-9:;<=>?@A-Z\[\]^_`a-z{|}~]{1,2335}$/)
			.trim(),
		type: z.literal("datamatrix"),
		fg: z.string().optional(),
		bg: z.string().optional(),
		module: z.number().positive().optional(),
		qz: z.number().positive().optional(),
		dpi: z.number().positive().optional(),
	}),
	z.object({
		content: z
			.string()
			.regex(/^[0-9]{12,13}$/)
			.trim(),
		type: z.literal("ean13"),
		fg: z.string().optional(),
		bg: z.string().optional(),
		module: z.number().positive().optional(),
		pattern: z.string().optional(),
		qz: z.number().positive().optional(),
		text: z.enum(["bottom", "top"]).optional(),
		dpi: z.number().positive().optional(),
		height: z.number().positive().optional(),
		font: z.number().positive().optional(),
	}),
	z.object({
		content: z
			.string()
			.regex(/^[0-9]{7,8}$/)
			.trim(),
		type: z.literal("ean8"),
		fg: z.string().optional(),
		bg: z.string().optional(),
		module: z.number().positive().optional(),
		pattern: z.string().optional(),
		qz: z.number().positive().optional(),
		text: z.enum(["bottom", "top"]).optional(),
		dpi: z.number().positive().optional(),
		height: z.number().positive().optional(),
		font: z.number().positive().optional(),
	}),
	z.object({
		content: z
			.string()
			.regex(/^[0-9]{14}$/)
			.trim(),
		type: z.literal("itf14"),
		fg: z.string().optional(),
		bg: z.string().optional(),
		module: z.number().positive().optional(),
		pattern: z.string().optional(),
		qz: z.number().positive().optional(),
		text: z.enum(["bottom", "top"]).optional(),
		dpi: z.number().positive().optional(),
		height: z.number().positive().optional(),
		font: z.number().positive().optional(),
	}),
	z.object({
		content: z
			.string()
			.regex(/^[ !\"#$%&\'()*+,\-.\/0-9:;<=>?@A-Z\[\]^_`a-z{|}~]{1,2335}$/)
			.trim(),
		type: z.literal("pdf417"),
		fg: z.string().optional(),
		bg: z.string().optional(),
		module: z.number().positive().optional(),
		qz: z.number().positive().optional(),
		dpi: z.number().positive().optional(),
		height: z.number().positive().optional(),
	}),
	z.object({
		content: z
			.string()
			.regex(/^(?=.*0)[0-9]{11,12}$/)
			.trim(),
		type: z.literal("upc_a"),
		fg: z.string().optional(),
		bg: z.string().optional(),
		module: z.number().positive().optional(),
		pattern: z.string().optional(),
		qz: z.number().positive().optional(),
		text: z.enum(["bottom", "top"]).optional(),
		dpi: z.number().positive().optional(),
		height: z.number().positive().optional(),
		font: z.number().positive().optional(),
	}),
	z.object({
		content: z
			.string()
			.regex(/^(?=.*0)[0-9]{7,8}$/)
			.trim(),
		type: z.literal("upc_e"),
		fg: z.string().optional(),
		bg: z.string().optional(),
		module: z.number().positive().optional(),
		pattern: z.string().optional(),
		qz: z.number().positive().optional(),
		text: z.enum(["bottom", "top"]).optional(),
		dpi: z.number().positive().optional(),
		height: z.number().positive().optional(),
		font: z.number().positive().optional(),
	}),
]);

const newQRCodeFormSchema = z.discriminatedUnion("type", [
	z.object({
		value: z.url().trim(),
		type: z.literal("url"),
		errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).optional(),
		margin: z.number().positive().optional(),
		scale: z.number().positive().optional(),
		width: z.number().positive().optional(),
		logo: z.string().optional(),
	}),
	z.object({
		value: z.string().trim(),
		type: z.literal("text"),
		errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).optional(),
		margin: z.number().positive().optional(),
		scale: z.number().positive().optional(),
		width: z.number().positive().optional(),
		logo: z.string().optional(),
	}),
	z.object({
		value: z.string().trim(),
		password: z.string().trim().optional(),
		hidden: z.boolean(),
		encryption: z.enum(["WPA", "WEP"]).optional(),
		type: z.literal("wifi"),
		errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).optional(),
		margin: z.number().positive().optional(),
		scale: z.number().positive().optional(),
		width: z.number().positive().optional(),
		logo: z.string().optional(),
	}),
	z.object({
		value: z.email().trim(),
		subject: z.string().trim().optional(),
		body: z.string().trim().optional(),
		cc: z.email().trim().optional(),
		bcc: z.email().trim().optional(),
		type: z.literal("email"),
		errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).optional(),
		margin: z.number().positive().optional(),
		scale: z.number().positive().optional(),
		width: z.number().positive().optional(),
		logo: z.string().optional(),
	}),
	z.object({
		value: z.string().trim(),
		type: z.literal("phone"),
		errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).optional(),
		margin: z.number().positive().optional(),
		scale: z.number().positive().optional(),
		width: z.number().positive().optional(),
		logo: z.string().optional(),
	}),
	z.object({
		value: z.string().trim(),
		body: z.string().trim().optional(),
		type: z.literal("sms"),
		errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).optional(),
		margin: z.number().positive().optional(),
		scale: z.number().positive().optional(),
		width: z.number().positive().optional(),
		logo: z.string().optional(),
	}),
	z.object({
		value: z.string().trim(),
		type: z.literal("vcard"),
		errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).optional(),
		margin: z.number().positive().optional(),
		scale: z.number().positive().optional(),
		width: z.number().positive().optional(),
		logo: z.string().optional(),
		firstName: z.string().trim(),
		email: z.email().trim().optional(),
		phone: z.string().trim().optional(),
		organization: z.string().trim().optional(),
		title: z.string().trim().optional(),
		url: z.url().trim().optional(),
		address: z.string().trim().optional(),
	}),
	z.object({
		value: z.number(),
		type: z.literal("geoPoint"),
		errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).optional(),
		margin: z.number().positive().optional(),
		scale: z.number().positive().optional(),
		width: z.number().positive().optional(),
		logo: z.string().optional(),
		longitude: z.number(),
		altitude: z.number().optional(),
	}),
	z.object({
		value: z.string().trim(),
		type: z.literal("crypto"),
		errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).optional(),
		margin: z.number().positive().optional(),
		scale: z.number().positive().optional(),
		width: z.number().positive().optional(),
		logo: z.string().optional(),
		crypto: z.enum(["bitcoin", "ethereum", "litecoin"]),
		amount: z.number(),
		label: z.string().trim().optional(),
		message: z.string().trim().optional(),
	}),
]);

const defaultValues: NewQRCodeForm = {
	value: "",
	type: "url",
	errorCorrectionLevel: "M",
	margin: 4,
	scale: 4,
	width: 300,
	logo: undefined,
	ssid: "",
	password: "",
	hidden: false,
	encryption: "WPA",
	subject: "",
	body: "",
	cc: undefined,
	bcc: undefined,
	firstName: "",
	email: undefined,
	phone: "",
	organization: "",
	title: "",
	url: "",
	address: "",
	longitude: 0,
	altitude: undefined,
	crypto: "bitcoin",
	amount: 0,
	label: "",
	message: "",
};

const barcodeDefaultValues: NewBarcodeForm = {
	content: "",
	type: "upc_e",
	correction: 0,
	size: 100,
	fg: undefined,
	bg: undefined,
	text: "bottom",
	dpi: 300,
	font: 1,
	height: 100,
	module: 1,
	pattern: undefined,
	qz: 1,
};

const chunkedQRCodeTypes: (typeof QRCodeTypes)[] = [];

for (let i = 0; i < QRCodeTypes.length; i += 3) {
	const chunk = QRCodeTypes.slice(i, i + 3);
	chunkedQRCodeTypes.push(chunk);
}

const chunkedBarcodeTypes: (typeof barcodeTypes)[] = [];

for (let i = 0; i < barcodeTypes.length; i += 3) {
	const chunk = barcodeTypes.slice(i, i + 3);
	chunkedBarcodeTypes.push(chunk);
}

const encryptions: { value: EncryptionType; label: string }[] = [
	{
		value: undefined,
		label: i18n.t("app.new_code.qr_code_form.encryption.options.none"),
	},
	{
		value: "WPA",
		label: i18n.t("app.new_code.qr_code_form.encryption.options.wpa"),
	},
	{
		value: "WEP",
		label: i18n.t("app.new_code.qr_code_form.encryption.options.wep"),
	},
];

const errorCorrectionLevels: {
	value: QRCodeErrorCorrectionLevel;
	label: string;
}[] = [
	{
		value: "L",
		label: i18n.t("app.new_code.qr_code_form.error_correction_level.options.l"),
	},
	{
		value: "M",
		label: i18n.t("app.new_code.qr_code_form.error_correction_level.options.m"),
	},
	{
		value: "Q",
		label: i18n.t("app.new_code.qr_code_form.error_correction_level.options.q"),
	},
	{
		value: "H",
		label: i18n.t("app.new_code.qr_code_form.error_correction_level.options.h"),
	},
];

const renderTypeIcon = (type: CodeType) => {
	switch (type) {
		case "url":
			return <Link size={18} color="white" />;
		case "text":
			return <Type size={18} color="white" />;
		case "wifi":
			return <Wifi size={18} color="white" />;
		case "email":
			return <AtSign size={18} color="white" />;
		case "phone":
			return <Phone size={18} color="white" />;
		case "sms":
			return <MessageSquare size={18} color="white" />;
		case "vcard":
			return <IdCard size={18} color="white" />;
		case "geoPoint":
			return <MapPin size={18} color="white" />;
		case "crypto":
			return <Wallet size={18} color="white" />;
		default:
			return <QrCode size={18} color="white" />;
	}
};

export default function NewCodeScreen() {
	const { t } = useTranslation();
	const [tab, setTab] = useState("qr");
	const [collapsibleOpen, setCollapsibleOpen] = useState(false);
	const [data, setData] = useState<string | null>(null);
	const [options, setOptions] = useState<QRCodeToStringOptions | undefined>(
		undefined,
	);
	const [barcodeData, setBarcodeData] = useState<string | undefined>(undefined);
	const [successAlert, setSuccessAlert] = useState<string | null>(null);
	const viewShotRef = useRef<ViewShot>(null);
	const router = useRouter();
	const [mediaLibraryPermission, requestMediaLibraryPermission] =
		MediaLibrary.usePermissions();
	const addScannerResult = useScannerResults.use.addScannerResult();
	const { svg } = useQRCode(data, options);
	const insets = useSafeAreaInsets();
	const doGenerateBarcode = useMutation({
		mutationFn: async ({
			content,
			type,
		}: { content: string; type: BarcodeType }) => {
			if (typeof content !== "string" || typeof type !== "string") {
				return undefined;
			}
			return await generateBarcode(content, type as BarcodeType);
		},
	});

	const form = useForm({
		defaultValues,
		validators: {
			onChange: newQRCodeFormSchema,
		},
		onSubmit: async ({ value }) => {
			console.log("FORM SUBMIT", value);
			let data = value.value;
			if (value.type === "email") {
				data = generateEmailQRCodeData(
					value.value,
					value.subject,
					value.body,
					value.cc,
					value.bcc,
				);
			} else if (value.type === "wifi") {
				data = generateWifiQRCodeData(
					value.value,
					value.password,
					value.encryption,
				);
			} else if (value.type === "phone") {
				data = generatePhoneQRCodeData(value.value);
			} else if (value.type === "sms") {
				data = generateSMSQRCodeData(value.value, value.body);
			} else if (value.type === "vcard") {
				data = generateVCardQRCodeData(
					value.value,
					value.firstName,
					value.email,
					value.phone,
					value.organization,
					value.title,
					value.url,
					value.address,
				);
			} else if (value.type === "geoPoint") {
				data = generateLocationQRCodeData(
					value.value,
					value.longitude,
					value.altitude,
				);
			} else if (value.type === "crypto") {
				data = generateCryptoQRCodeData(
					value.value,
					value.crypto,
					value.amount,
					value.label,
					value.message,
				);
			}
			setData(data);
			setOptions({
				errorCorrectionLevel: value.errorCorrectionLevel,
				margin: value.margin,
				scale: value.scale,
				width: value.width,
			});
			addScannerResult({
				type: "qr",
				data,
				source: "form",
				createdAt: new Date(),
				extra:
					value.type === "text"
						? undefined
						: {
								type: value.type,
								url: encodeURI(data),
							},
				cornerPoints: [{ x: 0, y: 0 }],
				bounds: { origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } },
			});
			setSuccessAlert("Code QR généré");
		},
	});

	const barcodeForm = useForm({
		defaultValues: barcodeDefaultValues,
		validators: {
			onChange: newBarcodeFormSchema,
		},
		onSubmit: async ({ value }) => {
			console.log("FORM SUBMIT", value);
			const { type, content, ...extra } = value;
			doGenerateBarcode.mutate(
				{
					content,
					type,
				},
				{
					onSuccess: (data) => {
						setBarcodeData(data);
						addScannerResult({
							type,
							data: content,
							source: "form",
							createdAt: new Date(),
							extra,
							cornerPoints: [{ x: 0, y: 0 }],
							bounds: { origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } },
						});
						setSuccessAlert("Code barre généré");
					},
				},
			);
		},
	});

	const type = useStore(form.store, (state) => state.values.type);
	const logo = useStore(form.store, (state) => state.values.logo);

	const handleSavePress = async () => {
		if (data) {
			if (!mediaLibraryPermission?.granted) {
				await requestMediaLibraryPermission();
			}
			try {
				const tmpFileUri = await captureRef(viewShotRef, {
					fileName: "qr_code_",
					format: "png",
					quality: 1,
					result: "tmpfile",
				});
				await MediaLibrary.saveToLibraryAsync(tmpFileUri);
				setSuccessAlert("Code QR sauvegardé dans la galerie d'images");
			} catch (error) {
				console.log(
					"An error occurred while saving the picture to the media library : ",
				);
				console.log(error);
			}
		}
	};

	const handleLogoPickPress = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 1,
			allowsMultipleSelection: false,
		});
		if (!result.canceled) {
			form.setFieldValue("logo", result.assets[0].uri);
		}
	};

	useEffect(() => {
		let timeout = null;
		if (successAlert) {
			timeout = setTimeout(() => {
				setSuccessAlert(null);
			}, 3000);
		}
		return () => {
			if (timeout) {
				clearTimeout(timeout);
			}
		};
	}, [successAlert]);

	return (
		<AlertDialogPrimitive.Root style={{ flex: 1 }} open={!!successAlert}>
			<SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
				<View style={styles.headerContainer}>
					<Pressable
						onPress={() => router.back()}
						style={{ marginRight: Spacings.lg }}
					>
						<ArrowLeft size={24} color="white" />
					</Pressable>
					<ThemedText variant="title">{t("app.new_code.title")}</ThemedText>
					<View style={{ width: 24, marginLeft: Spacings.lg }} />
				</View>
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: insets.bottom }}
				>
					<TabsPrimitive.Root value={tab} onValueChange={setTab}>
						<TabsPrimitive.List style={styles.tabsList}>
							<TabsPrimitive.Trigger
								value="qr"
								style={[
									styles.tabsTrigger,
									tab === "qr" && styles.tabsTriggerSelected,
									tab === "qr" && {
										borderTopLeftRadius: 24,
										borderBottomLeftRadius: 24,
									},
								]}
							>
								<ThemedText style={styles.tabsTriggerText}>
									{t("app.new_code.tabs.qr")}
								</ThemedText>
							</TabsPrimitive.Trigger>
							<TabsPrimitive.Trigger
								value="barcode"
								style={[
									styles.tabsTrigger,
									tab === "barcode" && styles.tabsTriggerSelected,
									tab === "barcode" && {
										borderTopRightRadius: 24,
										borderBottomRightRadius: 24,
									},
								]}
							>
								<ThemedText style={styles.tabsTriggerText}>
									{t("app.new_code.tabs.barcode")}
								</ThemedText>
							</TabsPrimitive.Trigger>
						</TabsPrimitive.List>
						<TabsPrimitive.Content value="qr">
							<form.Field name="type">
								{(field) => (
									<View style={styles.fieldContainer}>
										<ThemedText style={styles.fieldLabel}>Type</ThemedText>
										{chunkedQRCodeTypes.map((chunk, index) => (
											<View
												style={styles.typeButtonWrapper}
												key={`types-wrapper-${chunk[0].value}`}
											>
												{chunk.map((type) => (
													<Pressable
														key={type.value}
														onPress={() => field.setValue(type.value)}
														style={[
															styles.typeButtonContainer,
															{
																backgroundColor:
																	field.state.value === type.value
																		? Colors.slate["700"]
																		: "transparent",
															},
														]}
													>
														{renderTypeIcon(type.value)}
														<ThemedText>{type.label}</ThemedText>
													</Pressable>
												))}
											</View>
										))}
										{!field.state.meta.isValid && (
											<ThemedText
												style={styles.errorText}
												variant="small"
												role="alert"
											>
												{field.state.meta.errors
													.map((error) => error?.message)
													.join(", ")}
											</ThemedText>
										)}
									</View>
								)}
							</form.Field>
							{type === "url" && (
								<form.Field name="value">
									{(field) => (
										<View style={styles.fieldContainer}>
											<ThemedText style={styles.fieldLabel}>
												{t("app.new_code.qr_code_form.url.label")}
											</ThemedText>
											<View style={styles.textInputContainer}>
												<TextInput
													value={field.state.value}
													onBlur={field.handleBlur}
													onChangeText={field.handleChange}
													autoFocus
													autoCapitalize="none"
													placeholder={t(
														"app.new_code.qr_code_form.url.placeholder",
													)}
													style={styles.textInput}
													keyboardType="url"
													textContentType="URL"
												/>
											</View>
											{!field.state.meta.isValid && (
												<ThemedText
													style={styles.errorText}
													variant="small"
													role="alert"
												>
													{field.state.meta.errors
														.map((error) => error?.message)
														.join(", ")}
												</ThemedText>
											)}
										</View>
									)}
								</form.Field>
							)}
							{type === "text" && (
								<form.Field name="value">
									{(field) => (
										<View style={styles.fieldContainer}>
											<ThemedText style={styles.fieldLabel}>
												{t("app.new_code.qr_code_form.text.label")}
											</ThemedText>
											<View style={styles.textInputContainer}>
												<TextInput
													value={field.state.value}
													onBlur={field.handleBlur}
													onChangeText={field.handleChange}
													autoFocus
													placeholder={t(
														"app.new_code.qr_code_form.text.placeholder",
													)}
													style={styles.textInput}
												/>
											</View>
											{!field.state.meta.isValid && (
												<ThemedText
													style={styles.errorText}
													variant="small"
													role="alert"
												>
													{field.state.meta.errors
														.map((error) => error?.message)
														.join(", ")}
												</ThemedText>
											)}
										</View>
									)}
								</form.Field>
							)}
							{type === "wifi" && (
								<>
									<form.Field name="value">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t("app.new_code.qr_code_form.ssid.label")}
												</ThemedText>
												<View style={styles.textInputContainer}>
													<TextInput
														value={field.state.value}
														onBlur={field.handleBlur}
														onChangeText={field.handleChange}
														autoFocus
														placeholder={t(
															"app.new_code.qr_code_form.ssid.placeholder",
														)}
														style={styles.textInput}
													/>
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
									<form.Field name="password">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t("app.new_code.qr_code_form.password.label")}
												</ThemedText>
												<View style={styles.textInputContainer}>
													<TextInput
														value={field.state.value}
														onBlur={field.handleBlur}
														onChangeText={field.handleChange}
														placeholder={t(
															"app.new_code.qr_code_form.password.placeholder",
														)}
														style={styles.textInput}
														textContentType="password"
													/>
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
									<form.Field name="encryption">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t("app.new_code.qr_code_form.encryption.label")}
												</ThemedText>
												<View style={styles.typeButtonWrapper}>
													{encryptions.map((encryption) => (
														<Pressable
															key={encryption.value?.toString()}
															onPress={() => field.setValue(encryption.value)}
															style={[
																styles.typeButtonContainer,
																{
																	backgroundColor:
																		field.state.value === encryption.value
																			? Colors.slate["700"]
																			: "transparent",
																},
															]}
														>
															<ThemedText>{encryption.label}</ThemedText>
														</Pressable>
													))}
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
									<form.Field name="hidden">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t("app.new_code.qr_code_form.hidden.label")}
												</ThemedText>
												<View style={styles.typeButtonWrapper}>
													<Pressable
														onPress={() => field.setValue(true)}
														style={[
															styles.typeButtonContainer,
															{
																backgroundColor:
																	field.state.value === true
																		? Colors.slate["700"]
																		: "transparent",
															},
														]}
													>
														<ThemedText>{t("app.shared.yes")}</ThemedText>
													</Pressable>
													<Pressable
														onPress={() => field.setValue(false)}
														style={[
															styles.typeButtonContainer,
															{
																backgroundColor:
																	field.state.value === false
																		? Colors.slate["700"]
																		: "transparent",
															},
														]}
													>
														<ThemedText>{t("app.shared.no")}</ThemedText>
													</Pressable>
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
								</>
							)}
							{type === "email" && (
								<>
									<form.Field name="value">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t("app.new_code.qr_code_form.email.label")}
												</ThemedText>
												<View style={styles.textInputContainer}>
													<TextInput
														value={field.state.value}
														onBlur={field.handleBlur}
														onChangeText={field.handleChange}
														autoFocus
														placeholder={t(
															"app.new_code.qr_code_form.email.placeholder",
														)}
														style={styles.textInput}
														keyboardType="email-address"
													/>
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
									<form.Field name="subject">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t("app.new_code.qr_code_form.subject.label")}
												</ThemedText>
												<View style={styles.textInputContainer}>
													<TextInput
														value={field.state.value}
														onBlur={field.handleBlur}
														onChangeText={field.handleChange}
														placeholder={t(
															"app.new_code.qr_code_form.subject.placeholder",
														)}
														style={styles.textInput}
													/>
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
									<form.Field name="body">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t("app.new_code.qr_code_form.body.label")}
												</ThemedText>
												<View style={styles.textInputContainer}>
													<TextInput
														value={field.state.value}
														onBlur={field.handleBlur}
														onChangeText={field.handleChange}
														placeholder={t(
															"app.new_code.qr_code_form.body.placeholder",
														)}
														style={styles.textInput}
													/>
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
									<form.Field name="cc">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t("app.new_code.qr_code_form.cc.label")}
												</ThemedText>
												<View style={styles.textInputContainer}>
													<TextInput
														value={field.state.value}
														onBlur={field.handleBlur}
														onChangeText={field.handleChange}
														placeholder={t(
															"app.new_code.qr_code_form.cc.placeholder",
														)}
														style={styles.textInput}
														keyboardType="email-address"
													/>
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
									<form.Field name="bcc">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t("app.new_code.qr_code_form.bcc.label")}
												</ThemedText>
												<View style={styles.textInputContainer}>
													<TextInput
														value={field.state.value}
														onBlur={field.handleBlur}
														onChangeText={field.handleChange}
														placeholder={t(
															"app.new_code.qr_code_form.bcc.placeholder",
														)}
														style={styles.textInput}
														keyboardType="email-address"
													/>
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
								</>
							)}
							{type === "phone" && (
								<form.Field name="value">
									{(field) => (
										<View style={styles.fieldContainer}>
											<ThemedText style={styles.fieldLabel}>
												{t("app.new_code.qr_code_form.phone.label")}
											</ThemedText>
											<View style={styles.textInputContainer}>
												<TextInput
													value={field.state.value}
													onBlur={field.handleBlur}
													onChangeText={field.handleChange}
													autoFocus
													placeholder={t(
														"app.new_code.qr_code_form.phone.placeholder",
													)}
													keyboardType="phone-pad"
													style={styles.textInput}
												/>
											</View>
											{!field.state.meta.isValid && (
												<ThemedText
													style={styles.errorText}
													variant="small"
													role="alert"
												>
													{field.state.meta.errors
														.map((error) => error?.message)
														.join(", ")}
												</ThemedText>
											)}
										</View>
									)}
								</form.Field>
							)}
							{type === "sms" && (
								<>
									<form.Field name="value">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t("app.new_code.qr_code_form.phone.label")}
												</ThemedText>
												<View style={styles.textInputContainer}>
													<TextInput
														value={field.state.value}
														onBlur={field.handleBlur}
														onChangeText={field.handleChange}
														autoFocus
														placeholder={t(
															"app.new_code.qr_code_form.phone.placeholder",
														)}
														keyboardType="phone-pad"
														style={styles.textInput}
													/>
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
									<form.Field name="body">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t("app.new_code.qr_code_form.message.label")}
												</ThemedText>
												<View style={styles.textInputContainer}>
													<TextInput
														value={field.state.value}
														onBlur={field.handleBlur}
														onChangeText={field.handleChange}
														placeholder={t(
															"app.new_code.qr_code_form.message.placeholder",
														)}
														style={styles.textInput}
													/>
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
								</>
							)}
							{type === "vcard" && (
								<>
									<form.Field name="value">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t("app.new_code.qr_code_form.name.label")}
												</ThemedText>
												<View style={styles.textInputContainer}>
													<TextInput
														value={field.state.value}
														onBlur={field.handleBlur}
														onChangeText={field.handleChange}
														autoFocus
														placeholder={t(
															"app.new_code.qr_code_form.name.placeholder",
														)}
														style={styles.textInput}
													/>
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
									<form.Field name="firstName">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t("app.new_code.qr_code_form.first_name.label")}
												</ThemedText>
												<View style={styles.textInputContainer}>
													<TextInput
														value={field.state.value}
														onBlur={field.handleBlur}
														onChangeText={field.handleChange}
														autoFocus
														placeholder={t(
															"app.new_code.qr_code_form.first_name.placeholder",
														)}
														style={styles.textInput}
													/>
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
									<form.Field name="value">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t("app.new_code.qr_code_form.last_name.label")}
												</ThemedText>
												<View style={styles.textInputContainer}>
													<TextInput
														value={field.state.value}
														onBlur={field.handleBlur}
														onChangeText={field.handleChange}
														autoFocus
														placeholder={t(
															"app.new_code.qr_code_form.last_name.placeholder",
														)}
														style={styles.textInput}
													/>
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
									<form.Field name="email">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t("app.new_code.qr_code_form.vcard_email.label")}
												</ThemedText>
												<View style={styles.textInputContainer}>
													<TextInput
														value={field.state.value}
														onBlur={field.handleBlur}
														onChangeText={field.handleChange}
														autoFocus
														placeholder={t(
															"app.new_code.qr_code_form.vcard_email.placeholder",
														)}
														style={styles.textInput}
													/>
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
									<form.Field name="phone">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t("app.new_code.qr_code_form.phone.label")}
												</ThemedText>
												<View style={styles.textInputContainer}>
													<TextInput
														value={field.state.value}
														onBlur={field.handleBlur}
														onChangeText={field.handleChange}
														autoFocus
														placeholder={t(
															"app.new_code.qr_code_form.phone.placeholder",
														)}
														style={styles.textInput}
													/>
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
									<form.Field name="organization">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t("app.new_code.qr_code_form.organization.label")}
												</ThemedText>
												<View style={styles.textInputContainer}>
													<TextInput
														value={field.state.value}
														onBlur={field.handleBlur}
														onChangeText={field.handleChange}
														autoFocus
														placeholder={t(
															"app.new_code.qr_code_form.organization.placeholder",
														)}
														style={styles.textInput}
													/>
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
									<form.Field name="title">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t("app.new_code.qr_code_form.title.label")}
												</ThemedText>
												<View style={styles.textInputContainer}>
													<TextInput
														value={field.state.value}
														onBlur={field.handleBlur}
														onChangeText={field.handleChange}
														autoFocus
														placeholder={t(
															"app.new_code.qr_code_form.title.placeholder",
														)}
														style={styles.textInput}
													/>
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
									<form.Field name="address">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t("app.new_code.qr_code_form.address.label")}
												</ThemedText>
												<View style={styles.textInputContainer}>
													<TextInput
														value={field.state.value}
														onBlur={field.handleBlur}
														onChangeText={field.handleChange}
														autoFocus
														placeholder={t(
															"app.new_code.qr_code_form.address.placeholder",
														)}
														style={styles.textInput}
													/>
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
									<form.Field name="url">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t("app.new_code.qr_code_form.website.label")}
												</ThemedText>
												<View style={styles.textInputContainer}>
													<TextInput
														value={field.state.value}
														onBlur={field.handleBlur}
														onChangeText={field.handleChange}
														autoFocus
														placeholder={t(
															"app.new_code.qr_code_form.website.placeholder",
														)}
														style={styles.textInput}
													/>
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
								</>
							)}
							{type === "geoPoint" && (
								<>
									<form.Field name="value">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t("app.new_code.qr_code_form.latitude.label")}
												</ThemedText>
												<View style={styles.textInputContainer}>
													<TextInput
														value={field.state.value?.toString()}
														onBlur={field.handleBlur}
														onChangeText={(text) =>
															field.handleChange(Number.parseFloat(text))
														}
														autoFocus
														placeholder={t(
															"app.new_code.qr_code_form.latitude.placeholder",
														)}
														style={styles.textInput}
														keyboardType="decimal-pad"
													/>
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
									<form.Field name="longitude">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t("app.new_code.qr_code_form.longitude.label")}
												</ThemedText>
												<View style={styles.textInputContainer}>
													<TextInput
														value={field.state.value?.toString()}
														onBlur={field.handleBlur}
														onChangeText={(text) =>
															field.handleChange(Number.parseFloat(text))
														}
														placeholder={t(
															"app.new_code.qr_code_form.longitude.placeholder",
														)}
														style={styles.textInput}
														keyboardType="decimal-pad"
													/>
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
									<form.Field name="altitude">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t("app.new_code.qr_code_form.altitude.label")}
												</ThemedText>
												<View style={styles.textInputContainer}>
													<TextInput
														value={field.state.value?.toString()}
														onBlur={field.handleBlur}
														onChangeText={(text) =>
															field.handleChange(Number.parseInt(text, 10))
														}
														placeholder={t(
															"app.new_code.qr_code_form.altitude.placeholder",
														)}
														style={styles.textInput}
													/>
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
								</>
							)}
							<CollapsiblePrimitive.Root onOpenChange={setCollapsibleOpen}>
								<CollapsiblePrimitive.Trigger
									style={({ pressed }) => [
										styles.collapsibleTrigger,
										pressed && { opacity: 0.5 },
									]}
								>
									<View style={{ flexDirection: "row", alignItems: "center" }}>
										<Settings
											size={16}
											color="white"
											style={{ marginRight: Spacings.sm }}
										/>
										<ThemedText style={{ fontFamily: "Inter_700Bold" }}>
											{t("app.new_code.settings")}
										</ThemedText>
									</View>
									{collapsibleOpen ? (
										<ChevronUp size={16} color="white" />
									) : (
										<ChevronDown size={16} color="white" />
									)}
								</CollapsiblePrimitive.Trigger>
								<CollapsiblePrimitive.Content
									style={{ marginVertical: Spacings.md }}
								>
									<form.Field name="errorCorrectionLevel">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t(
														"app.new_code.qr_code_form.error_correction_level.label",
													)}
												</ThemedText>
												<View style={styles.typeButtonWrapper}>
													{errorCorrectionLevels.map((errorCorrectionLevel) => (
														<Pressable
															key={errorCorrectionLevel.value?.toString()}
															onPress={() =>
																field.setValue(errorCorrectionLevel.value)
															}
															style={[
																styles.typeButtonContainer,
																{
																	backgroundColor:
																		field.state.value ===
																		errorCorrectionLevel.value
																			? Colors.slate["700"]
																			: "transparent",
																},
															]}
														>
															<ThemedText>
																{errorCorrectionLevel.label}
															</ThemedText>
														</Pressable>
													))}
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
									<form.Field name="margin">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t("app.new_code.qr_code_form.margin.label")}
												</ThemedText>
												<View style={styles.textInputContainer}>
													<TextInput
														value={field.state.value?.toString()}
														onBlur={field.handleBlur}
														onChangeText={(text) =>
															field.handleChange(Number.parseInt(text, 10))
														}
														placeholder={t(
															"app.new_code.qr_code_form.margin.placeholder",
														)}
														style={styles.textInput}
														keyboardType="decimal-pad"
													/>
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
									<form.Field name="scale">
										{(field) => (
											<View style={styles.fieldContainer}>
												<ThemedText style={styles.fieldLabel}>
													{t("app.new_code.qr_code_form.scale.label")}
												</ThemedText>
												<View style={styles.textInputContainer}>
													<TextInput
														value={field.state.value?.toString() || "0"}
														onBlur={field.handleBlur}
														onChangeText={(text) =>
															field.handleChange(
																text ? Number.parseInt(text, 10) : 0,
															)
														}
														placeholder={t(
															"app.new_code.qr_code_form.scale.placeholder",
														)}
														style={styles.textInput}
														keyboardType="decimal-pad"
													/>
												</View>
												{!field.state.meta.isValid && (
													<ThemedText
														style={styles.errorText}
														variant="small"
														role="alert"
													>
														{field.state.meta.errors
															.map((error) => error?.message)
															.join(", ")}
													</ThemedText>
												)}
											</View>
										)}
									</form.Field>
									<View style={styles.fieldContainer}>
										<ThemedText style={styles.fieldLabel}>
											{t("app.new_code.qr_code_form.logo.label")}
										</ThemedText>
										{logo && (
											<View
											// style={{ width: "100%", height: "100%", aspectRatio: 1 }}
											>
												<Image
													style={{ width: "100%", aspectRatio: 1 }}
													source={{ uri: logo }}
												/>
											</View>
										)}
										<Button
											buttonColor={Colors.slate["500"]}
											textColor={Colors.white}
											title={t("app.new_code.qr_code_form.logo.action")}
											onPress={handleLogoPickPress}
											style={{ marginTop: Spacings.sm }}
										/>
									</View>
								</CollapsiblePrimitive.Content>
							</CollapsiblePrimitive.Root>
							<Button
								buttonColor={Colors.primary}
								textColor={Colors.white}
								onPress={() => form.handleSubmit()}
								title={t("app.new_code.generate")}
								reduceMotion="system"
								style={{ marginVertical: Spacings.md }}
							/>
							{svg && (
								<View>
									<Animated.View
										style={styles.codeContainer}
										entering={FadeInDown}
										exiting={FadeOutUp}
									>
										<ViewShot ref={viewShotRef}>
											<View>
												{logo && (
													<Image
														style={{
															position: "absolute",
															top: "50%",
															left: "50%",
															bottom: 0,
															right: 0,
															zIndex: 999,
															width: 50,
															height: 50,
															aspectRatio: 1,
															transform: [
																{ translateX: -25 },
																{ translateY: -25 },
															],
														}}
														source={{ uri: logo }}
													/>
												)}
												<SvgXml
													width="100%"
													xml={svg}
													style={{ aspectRatio: 1 }}
												/>
											</View>
										</ViewShot>
									</Animated.View>
									<View style={styles.QRCodeActionsContainer}>
										<Button
											buttonColor={Colors.slate["500"]}
											textColor={Colors.white}
											onPress={handleSavePress}
											title={t("app.new_code.save")}
											reduceMotion="system"
											Icon={
												<Download
													size={16}
													color="white"
													style={{ marginRight: Spacings.sm }}
												/>
											}
										/>
									</View>
								</View>
							)}
						</TabsPrimitive.Content>
						<TabsPrimitive.Content value="barcode">
							<barcodeForm.Field name="type">
								{(field) => (
									<View style={styles.fieldContainer}>
										<ThemedText style={styles.fieldLabel}>
											{t("app.new_code.barcode_form.type.label")}
										</ThemedText>
										{chunkedBarcodeTypes.map((chunk, index) => (
											<View
												style={styles.typeButtonWrapper}
												key={`types-wrapper-${chunk[0].value}`}
											>
												{chunk.map((type) => (
													<Pressable
														key={type.value}
														onPress={() => field.setValue(type.value)}
														style={[
															styles.typeButtonContainer,
															{
																backgroundColor:
																	field.state.value === type.value
																		? Colors.slate["700"]
																		: "transparent",
															},
														]}
													>
														<ThemedText>{type.label}</ThemedText>
													</Pressable>
												))}
											</View>
										))}
										{!field.state.meta.isValid && (
											<ThemedText
												style={styles.errorText}
												variant="small"
												role="alert"
											>
												{field.state.meta.errors
													.map((error) => error?.message)
													.join(", ")}
											</ThemedText>
										)}
									</View>
								)}
							</barcodeForm.Field>
							<barcodeForm.Field name="content">
								{(field) => (
									<View style={styles.fieldContainer}>
										<ThemedText style={styles.fieldLabel}>
											{t("app.new_code.barcode_form.content.label")}
										</ThemedText>
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value}
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												autoFocus
												autoCapitalize="none"
												placeholder={t(
													"app.new_code.barcode_form.content.placeholder",
												)}
												style={styles.textInput}
											/>
										</View>
										{!field.state.meta.isValid && (
											<ThemedText
												style={styles.errorText}
												variant="small"
												role="alert"
											>
												{field.state.meta.errors
													.map((error) => error?.message)
													.join(", ")}
											</ThemedText>
										)}
									</View>
								)}
							</barcodeForm.Field>
							<Button
								buttonColor={Colors.primary}
								textColor={Colors.white}
								onPress={() => barcodeForm.handleSubmit()}
								title={t("app.new_code.generate")}
								reduceMotion="system"
								style={{ marginVertical: Spacings.md }}
							/>
							{barcodeData && (
								<View>
									<Animated.View
										style={styles.codeContainer}
										entering={FadeInDown}
										exiting={FadeOutUp}
									>
										<ViewShot ref={viewShotRef}>
											<View>
												<Image
													source={{ uri: barcodeData }}
													style={{ width: "100%", aspectRatio: 1 }}
													resizeMode="contain"
												/>
											</View>
										</ViewShot>
									</Animated.View>
									<View style={styles.QRCodeActionsContainer}>
										<Button
											buttonColor={Colors.slate["500"]}
											textColor={Colors.white}
											onPress={handleSavePress}
											title={t("app.new_code.save")}
											reduceMotion="system"
											Icon={
												<Download
													size={16}
													color="white"
													style={{ marginRight: Spacings.sm }}
												/>
											}
										/>
									</View>
								</View>
							)}
						</TabsPrimitive.Content>
					</TabsPrimitive.Root>
				</ScrollView>
			</SafeAreaView>
			<AlertDialogPrimitive.Portal>
				<AlertDialogPrimitive.Overlay
					style={{
						paddingBottom: insets.bottom,
						padding: Spacings.lg,
						backgroundColor: Colors.green["500"],
					}}
				>
					<AlertDialogPrimitive.Content>
						<AlertDialogPrimitive.Title style={{ marginBottom: Spacings.lg }}>
							<ThemedText variant="title">{t("app.shared.success")}</ThemedText>
						</AlertDialogPrimitive.Title>
						<AlertDialogPrimitive.Description
							style={{ marginBottom: Spacings.lg }}
						>
							<ThemedText>{successAlert}</ThemedText>
						</AlertDialogPrimitive.Description>
					</AlertDialogPrimitive.Content>
				</AlertDialogPrimitive.Overlay>
			</AlertDialogPrimitive.Portal>
		</AlertDialogPrimitive.Root>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingVertical: 24,
		paddingHorizontal: 24,
		backgroundColor: Colors.slate["950"],
	},
	headerContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: Spacings.lg,
	},
	fieldContainer: {
		paddingVertical: Spacings.md,
	},
	fieldLabel: {
		marginBottom: Spacings.md,
		fontFamily: "Inter_700Bold",
		fontSize: 14,
	},
	typeButtonWrapper: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: Spacings.md,
	},
	typeButtonContainer: {
		flex: 0.333,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 24,
		padding: Spacings.sm,
		gap: Spacings.sm,
	},
	textInputContainer: {},
	textInput: {
		borderWidth: 1,
		borderColor: Colors.slate["700"],
		padding: Spacings.sm,
		color: Colors.white,
		fontSize: 16,
		fontFamily: "Inter_400Regular",
	},
	errorText: {
		color: Colors.error,
		marginVertical: Spacings.sm,
	},
	codeContainer: {
		alignItems: "center",
		justifyContent: "center",
	},
	collapsibleTrigger: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderBottomWidth: 1,
		borderBottomColor: Colors.slate["700"],
		paddingVertical: Spacings.sm,
		transitionDuration: "200",
		transitionProperty: "opacity",
	},
	QRCodeActionsContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginTop: Spacings.md,
	},
	button: {
		marginVertical: Spacings.sm,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 24,
		paddingHorizontal: Spacings.md,
		paddingVertical: Spacings.sm,
		borderColor: Colors.primaryPressed,
		borderWidth: 1,
	},
	tabsList: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-around",
		backgroundColor: Colors.slate["800"],
		borderRadius: 24,
		borderWidth: 4,
		borderColor: Colors.slate["800"],
	},
	tabsTrigger: {
		flex: 0.5,
		textAlign: "center",
		paddingHorizontal: Spacings.md,
		paddingVertical: Spacings.sm,
		// backgroundColor: "red",
	},
	tabsTriggerSelected: {
		backgroundColor: Colors.slate["700"],
	},
	tabsTriggerText: {
		fontFamily: "Inter_700Bold",
		textAlign: "center",
	},
});
