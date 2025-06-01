import { ThemedText } from "@/components/ui/ThemedText";
import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import { useQRCode } from "@/hooks/useQRCode";
import useScannerResults from "@/stores/scannerResultsStore";
import {
	generateCryptoQRCodeData,
	generateEmailQRCodeData,
	generateLocationQRCodeData,
	generateSMSQRCodeData,
	generateVCardQRCodeData,
	generateWifiQRCodeData,
} from "@/utils/generateQRCodeData";
import * as CollapsiblePrimitive from "@rn-primitives/collapsible";
import { useForm, useStore } from "@tanstack/react-form";
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
	QrCode,
	Settings,
	Type,
	Wallet,
	Wifi,
} from "lucide-react-native";
import type { QRCodeErrorCorrectionLevel, QRCodeToStringOptions } from "qrcode";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";
import { z } from "zod/v4";

z.config(z.locales.fr());

type CodeType =
	| "url"
	| "text"
	| "wifi"
	| "email"
	| "sms"
	| "vcard"
	| "location"
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
		value: z.url(),
		type: z.literal("url"),
		errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).optional(),
		margin: z.number().positive().optional(),
		scale: z.number().positive().optional(),
		width: z.number().positive().optional(),
	}),
	z.object({
		value: z.string(),
		type: z.literal("text"),
		errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).optional(),
		margin: z.number().positive().optional(),
		scale: z.number().positive().optional(),
		width: z.number().positive().optional(),
	}),
	z.object({
		value: z.string(),
		password: z.string().optional(),
		hidden: z.boolean(),
		encryption: z.enum(["WPA", "WEP"]).optional(),
		type: z.literal("wifi"),
		errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).optional(),
		margin: z.number().positive().optional(),
		scale: z.number().positive().optional(),
		width: z.number().positive().optional(),
	}),
	z.object({
		value: z.email(),
		subject: z.string().optional(),
		body: z.string().optional(),
		cc: z.email().optional(),
		bcc: z.email().optional(),
		type: z.literal("email"),
		errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).optional(),
		margin: z.number().positive().optional(),
		scale: z.number().positive().optional(),
		width: z.number().positive().optional(),
	}),
	z.object({
		value: z.string(),
		body: z.string().optional(),
		type: z.literal("sms"),
		errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).optional(),
		margin: z.number().positive().optional(),
		scale: z.number().positive().optional(),
		width: z.number().positive().optional(),
	}),
	z.object({
		value: z.string(),
		type: z.literal("vcard"),
		errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).optional(),
		margin: z.number().positive().optional(),
		scale: z.number().positive().optional(),
		width: z.number().positive().optional(),
		firstName: z.string(),
		email: z.email().optional(),
		phone: z.string().optional(),
		organization: z.string().optional(),
		title: z.string().optional(),
		url: z.url().optional(),
		address: z.string().optional(),
	}),
	z.object({
		value: z.number(),
		type: z.literal("location"),
		errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).optional(),
		margin: z.number().positive().optional(),
		scale: z.number().positive().optional(),
		width: z.number().positive().optional(),
		longitude: z.number(),
		altitude: z.number().optional(),
	}),
	z.object({
		value: z.string(),
		type: z.literal("crypto"),
		errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).optional(),
		margin: z.number().positive().optional(),
		scale: z.number().positive().optional(),
		width: z.number().positive().optional(),
		crypto: z.enum(["bitcoin", "ethereum", "litecoin"]),
		amount: z.number(),
		label: z.string().optional(),
		message: z.string().optional(),
	}),
]);

const defaultValues: NewQRCodeForm = {
	value: "",
	type: "url",
	errorCorrectionLevel: "M",
	margin: 4,
	scale: 4,
	width: 300,
	ssid: "",
	password: "",
	hidden: false,
	encryption: "WPA",
	subject: "",
	body: "",
	cc: "",
	bcc: "",
	firstName: "",
	email: "",
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
	{ value: "sms", label: "SMS" },
	{ value: "vcard", label: "vCard" },
	{ value: "location", label: "Localisation" },
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
		case "sms":
			return <MessageSquare size={18} color="white" />;
		case "vcard":
			return <IdCard size={18} color="white" />;
		case "location":
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
	const router = useRouter();
	const addScannerResult = useScannerResults.use.addScannerResult();
	const { svg } = useQRCode(data, options);
	const form = useForm({
		defaultValues,
		validators: {
			onBlur: newQRCodeFormSchema,
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
			} else if (value.type === "location") {
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
							},
				cornerPoints: [{ x: 0, y: 0 }],
				bounds: { origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } },
			});
		},
	});

	const type = useStore(form.store, (state) => state.values.type);
	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.headerContainer}>
				<Pressable onPress={() => router.back()} style={{ marginRight: 24 }}>
					<ArrowLeft size={24} color="white" />
				</Pressable>
				<ThemedText variant="title">Nouveau code QR</ThemedText>
				<View style={{ width: 24 }} />
			</View>
			<ScrollView showsVerticalScrollIndicator={false}>
				<form.Field name="type">
					{(field) => (
						<View style={styles.fieldContainer}>
							<ThemedText style={styles.fieldLabel}>Type</ThemedText>
							{chunkedTypes.map((chunk, index) => (
								<View
									style={styles.typeButtonWrapper}
									key={`types-wrapper-${index}`}
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
						<form.Field name="lastName">
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
				{type === "location" && (
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
												field.handleChange(Number.parseInt(text, 10))
											}
											autoFocus
											placeholder="46.528634"
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
						<form.Field name="longitude">
							{(field) => (
								<View style={styles.fieldContainer}>
									<ThemedText style={styles.fieldLabel}>Longitude</ThemedText>
									<View style={styles.textInputContainer}>
										<TextInput
											value={field.state.value?.toString()}
											onBlur={field.handleBlur}
											onChangeText={(text) =>
												field.handleChange(Number.parseInt(text, 10))
											}
											placeholder="5.377266"
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
					<CollapsiblePrimitive.Content style={{ marginVertical: Spacings.md }}>
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
												field.handleChange(text ? Number.parseInt(text, 10) : 0)
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
					</CollapsiblePrimitive.Content>
				</CollapsiblePrimitive.Root>
				<Pressable
					onPress={() => form.handleSubmit()}
					style={({ pressed }) => [
						styles.submitButton,
						pressed && { backgroundColor: Colors.primaryPressed },
					]}
				>
					<ThemedText>Générer</ThemedText>
				</Pressable>
				{svg && (
					<View>
						<Animated.View
							style={styles.codeContainer}
							entering={FadeInDown}
							exiting={FadeOutUp}
						>
							<SvgXml width="80%" xml={svg} style={{ aspectRatio: 1 }} />
						</Animated.View>
						<View style={styles.QRCodeActionsContainer}>
							<Pressable
								onPress={() => form.handleSubmit()}
								style={({ pressed }) => [
									styles.button,
									pressed && { backgroundColor: Colors.primaryPressed },
								]}
							>
								<Download
									size={16}
									color="white"
									style={{ marginRight: Spacings.sm }}
								/>
								<ThemedText>Enregistrer</ThemedText>
							</Pressable>
						</View>
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
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
	submitButton: {
		marginVertical: Spacings.md,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 24,
		padding: Spacings.sm,
		backgroundColor: Colors.primary,
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
		justifyContent: "space-between",
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
