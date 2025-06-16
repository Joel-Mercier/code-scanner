import { Button } from "@/components/ui/Button";
import { ThemedText } from "@/components/ui/ThemedText";
import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import { useQRCode } from "@/hooks/useQRCode";
import useScannerResults from "@/stores/scannerResultsStore";
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
import { useForm, useStore } from "@tanstack/react-form";
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

type CodeType =
	| "url"
	| "text"
	| "wifi"
	| "email"
	| "phone"
	| "sms"
	| "vcard"
	| "geoPoint"
	| "crypto";
export type EncryptionType = "WPA" | "WEP" | undefined;
export type CryptoType = "bitcoin" | "ethereum" | "litecoin";

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

const types: { value: CodeType; label: string }[] = [
	{ value: "url", label: "Lien" },
	{ value: "text", label: "Texte" },
	{ value: "wifi", label: "Wifi" },
	{ value: "email", label: "Email" },
	{ value: "phone", label: "Téléphone" },
	{ value: "sms", label: "SMS" },
	{ value: "vcard", label: "vCard" },
	{ value: "geoPoint", label: "Position" },
	{ value: "crypto", label: "Crypto" },
];

const chunkedTypes: (typeof types)[] = [];

for (let i = 0; i < types.length; i += 3) {
	const chunk = types.slice(i, i + 3);
	chunkedTypes.push(chunk);
}

const encryptions: { value: EncryptionType; label: string }[] = [
	{ value: undefined, label: "Aucune" },
	{ value: "WPA", label: "WPA/WPA2" },
	{ value: "WEP", label: "WEP" },
];

const errorCorrectionLevels: {
	value: QRCodeErrorCorrectionLevel;
	label: string;
}[] = [
	{ value: "L", label: "Bas (~7%)" },
	{ value: "M", label: "Moyen (~15%)" },
	{ value: "Q", label: "Quartile (~25%)" },
	{ value: "H", label: "Haut (~30%)" },
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
	const [collapsibleOpen, setCollapsibleOpen] = useState(false);
	const [data, setData] = useState<string | null>(null);
	const [options, setOptions] = useState<QRCodeToStringOptions | undefined>(
		undefined,
	);
	const [successAlert, setSuccessAlert] = useState<string | null>(null);
	const viewShotRef = useRef<ViewShot>(null);
	const router = useRouter();
	const [mediaLibraryPermission, requestMediaLibraryPermission] =
		MediaLibrary.usePermissions();
	const addScannerResult = useScannerResults.use.addScannerResult();
	const { svg } = useQRCode(data, options);
	const insets = useSafeAreaInsets();
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
					<Pressable onPress={() => router.back()} style={{ marginRight: 24 }}>
						<ArrowLeft size={24} color="white" />
					</Pressable>
					<ThemedText variant="title">Nouveau code QR</ThemedText>
					<View style={{ width: 24 }} />
				</View>
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: insets.bottom }}
				>
					<form.Field name="type">
						{(field) => (
							<View style={styles.fieldContainer}>
								<ThemedText style={styles.fieldLabel}>Type</ThemedText>
								{chunkedTypes.map((chunk, index) => (
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
																? Colors.slate["800"]
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
									<ThemedText style={styles.fieldLabel}>Lien</ThemedText>
									<View style={styles.textInputContainer}>
										<TextInput
											value={field.state.value}
											onBlur={field.handleBlur}
											onChangeText={field.handleChange}
											autoFocus
											autoCapitalize="none"
											placeholder="https://..."
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
									<ThemedText style={styles.fieldLabel}>Texte</ThemedText>
									<View style={styles.textInputContainer}>
										<TextInput
											value={field.state.value}
											onBlur={field.handleBlur}
											onChangeText={field.handleChange}
											autoFocus
											placeholder="Mon texte"
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
										<ThemedText style={styles.fieldLabel}>SSID</ThemedText>
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value}
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												autoFocus
												placeholder="Le nom de votre réseau Wifi"
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
											Mot de passe Wifi
										</ThemedText>
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value}
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												placeholder="Mon mot de passe Wifi"
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
											Type de sécurité réseau
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
																	? Colors.slate["800"]
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
											Réseau Wifi caché ?
										</ThemedText>
										<View style={styles.typeButtonWrapper}>
											<Pressable
												onPress={() => field.setValue(true)}
												style={[
													styles.typeButtonContainer,
													{
														backgroundColor:
															field.state.value === true
																? Colors.slate["800"]
																: "transparent",
													},
												]}
											>
												<ThemedText>Oui</ThemedText>
											</Pressable>
											<Pressable
												onPress={() => field.setValue(false)}
												style={[
													styles.typeButtonContainer,
													{
														backgroundColor:
															field.state.value === false
																? Colors.slate["800"]
																: "transparent",
													},
												]}
											>
												<ThemedText>Non</ThemedText>
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
										<ThemedText style={styles.fieldLabel}>Email</ThemedText>
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value}
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												autoFocus
												placeholder="L'adresse email du destinataire"
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
										<ThemedText style={styles.fieldLabel}>Sujet</ThemedText>
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value}
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												placeholder="Sujet de l'email"
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
											Corps du message
										</ThemedText>
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value}
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												placeholder="Corps du message"
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
											Adresse en copie
										</ThemedText>
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value}
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												placeholder="CC"
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
											Adresse en copie cachée
										</ThemedText>
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value}
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												placeholder="BCC"
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
										Numéro de téléphone
									</ThemedText>
									<View style={styles.textInputContainer}>
										<TextInput
											value={field.state.value}
											onBlur={field.handleBlur}
											onChangeText={field.handleChange}
											autoFocus
											placeholder="0612345678"
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
											Numéro de téléphone
										</ThemedText>
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value}
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												autoFocus
												placeholder="0612345678"
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
										<ThemedText style={styles.fieldLabel}>Message</ThemedText>
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value}
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												placeholder="Message"
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
										<ThemedText style={styles.fieldLabel}>Nom</ThemedText>
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value}
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												autoFocus
												placeholder="Jean Dupont"
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
										<ThemedText style={styles.fieldLabel}>Prénom</ThemedText>
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value}
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												autoFocus
												placeholder="Jean"
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
										<ThemedText style={styles.fieldLabel}>Nom</ThemedText>
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value}
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												autoFocus
												placeholder="Dupont"
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
										<ThemedText style={styles.fieldLabel}>Email</ThemedText>
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value}
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												autoFocus
												placeholder="jean.dupont@gmail.com"
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
										<ThemedText style={styles.fieldLabel}>Téléphone</ThemedText>
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value}
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												autoFocus
												placeholder="0612345678"
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
											Organisation
										</ThemedText>
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value}
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												autoFocus
												placeholder="Google"
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
										<ThemedText style={styles.fieldLabel}>Titre</ThemedText>
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value}
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												autoFocus
												placeholder="Développeur"
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
										<ThemedText style={styles.fieldLabel}>Adresse</ThemedText>
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value}
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												autoFocus
												placeholder="12 rue de la gare"
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
										<ThemedText style={styles.fieldLabel}>Site web</ThemedText>
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value}
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												autoFocus
												placeholder="https://jeandupont.com"
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
										<ThemedText style={styles.fieldLabel}>Latitude</ThemedText>
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value?.toString()}
												onBlur={field.handleBlur}
												onChangeText={(text) =>
													field.handleChange(Number.parseFloat(text))
												}
												autoFocus
												placeholder="46.528634"
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
										<ThemedText style={styles.fieldLabel}>Longitude</ThemedText>
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value?.toString()}
												onBlur={field.handleBlur}
												onChangeText={(text) =>
													field.handleChange(Number.parseFloat(text))
												}
												placeholder="5.377266"
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
										<ThemedText style={styles.fieldLabel}>Altitude</ThemedText>
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value?.toString()}
												onBlur={field.handleBlur}
												onChangeText={(text) =>
													field.handleChange(Number.parseInt(text, 10))
												}
												placeholder="123"
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
									Paramètres
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
											Niveau de correction d'erreur
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
																field.state.value === errorCorrectionLevel.value
																	? Colors.slate["800"]
																	: "transparent",
														},
													]}
												>
													<ThemedText>{errorCorrectionLevel.label}</ThemedText>
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
										<ThemedText style={styles.fieldLabel}>Marges</ThemedText>
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value?.toString()}
												onBlur={field.handleBlur}
												onChangeText={(text) =>
													field.handleChange(Number.parseInt(text, 10))
												}
												placeholder="Marge"
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
										<ThemedText style={styles.fieldLabel}>Echelle</ThemedText>
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value?.toString() || "0"}
												onBlur={field.handleBlur}
												onChangeText={(text) =>
													field.handleChange(
														text ? Number.parseInt(text, 10) : 0,
													)
												}
												placeholder="Echelle"
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
								<ThemedText style={styles.fieldLabel}>Logo</ThemedText>
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
									title="Choisir"
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
						title={"Générer"}
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
													transform: [{ translateX: -25 }, { translateY: -25 }],
												}}
												source={{ uri: logo }}
											/>
										)}
										<SvgXml width="100%" xml={svg} style={{ aspectRatio: 1 }} />
									</View>
								</ViewShot>
							</Animated.View>
							<View style={styles.QRCodeActionsContainer}>
								<Button
									buttonColor={Colors.slate["500"]}
									textColor={Colors.white}
									onPress={handleSavePress}
									title={"Enregistrer"}
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
							<ThemedText variant="title">Succès</ThemedText>
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
});
