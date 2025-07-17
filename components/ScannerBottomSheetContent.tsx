import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import useScannerResults from "@/stores/scannerResultsStore";
import type { ScannerResult } from "@/types";
import { barcodeTypes, scannerResultTypeToEncryption } from "@/utils/data";
import {
	convertMATMSGToMailto,
	convertSMSTOToSMS,
} from "@/utils/generateQRCodeData";
import { truncate } from "@/utils/truncate";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as Calendar from "expo-calendar";
import * as Clipboard from "expo-clipboard";
import * as Contacts from "expo-contacts";
import { useRouter } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import {
	AtSign,
	Barcode,
	CalendarPlus,
	Copy,
	CopyCheck,
	Link,
	MapPin,
	MessageSquare,
	Phone,
	QrCode,
	Share2,
	UserPlus,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Linking,
	Platform,
	Pressable,
	Share,
	StyleSheet,
	View,
} from "react-native";
import { ThemedText } from "./ui/ThemedText";

type ScannerResultProps = {
	currentBarcode: ScannerResult | null;
	bottomSheetModalRef: React.RefObject<BottomSheetModal | null>;
};

export function ScannerBottomSheetContent({
	currentBarcode,
	bottomSheetModalRef,
}: ScannerResultProps) {
	const { t } = useTranslation();
	const [isCopied, setIsCopied] = useState(false);
	const router = useRouter();
	const setCurrentScannerResult =
		useScannerResults.use.setCurrentScannerResult();

	useEffect(() => {
		if (isCopied) {
			setTimeout(() => {
				setIsCopied(false);
			}, 2000);
		}
	}, [isCopied]);

	const handleOpenUrlPress = async () => {
		console.log(`DEBUG : Opening ${currentBarcode?.extra?.url} in browser`);
		await openBrowserAsync(currentBarcode?.extra?.url);
	};

	const handleOpenEmailPress = async () => {
		console.log(`DEBUG : Opening ${currentBarcode?.raw} in email app`);
		await Linking.openURL(
			convertMATMSGToMailto(currentBarcode) || currentBarcode?.extra?.url,
		);
	};

	const handleOpenPhonePress = async () => {
		console.log(`DEBUG : Opening ${currentBarcode?.raw} in phone app`);
		await Linking.openURL(currentBarcode?.raw || currentBarcode?.data || "");
	};

	const handleOpenSMSPress = async () => {
		console.log(`DEBUG : Opening ${currentBarcode?.raw} in sms app`);
		await Linking.openURL(
			convertSMSTOToSMS(currentBarcode) || currentBarcode?.extra?.url,
		);
	};

	const handleOpenLocationPress = async () => {
		const url = Platform.select({
			ios: `maps://${currentBarcode?.extra?.lat},${currentBarcode?.extra?.lng}`,
			android: `geo:${currentBarcode?.extra?.lat},${currentBarcode?.extra?.lng}`,
		});
		console.log(`DEBUG : Opening ${url} in maps app`);
		await Linking.openURL(url);
	};

	const handleShareContentPress = async () => {
		await Share.share({
			message: currentBarcode?.data,
			url: currentBarcode?.extra?.url,
		});
	};

	const handleAddToContactsPress = async () => {
		const { status } = await Contacts.requestPermissionsAsync();
		if (status === "granted") {
			try {
				const contact = {
					[Contacts.Fields.Name]:
						`${currentBarcode?.extra?.firstName} ${currentBarcode?.extra?.lastName}`,
					[Contacts.Fields.ContactType]: Contacts.ContactTypes.Person,
					[Contacts.Fields.FirstName]: currentBarcode?.extra?.firstName,
					[Contacts.Fields.LastName]: currentBarcode?.extra?.lastName,
					[Contacts.Fields.MiddleName]: currentBarcode?.extra?.middleName,
					[Contacts.Fields.Company]: currentBarcode?.extra?.organization,
					[Contacts.Fields.Emails]: [
						{
							email: currentBarcode?.extra?.email,
							label: currentBarcode?.extra?.email,
						},
					],
					[Contacts.Fields.PhoneNumbers]: [
						{
							label: currentBarcode?.extra?.phone,
							number: currentBarcode?.extra?.phone,
						},
					],
					[Contacts.Fields.UrlAddresses]: [
						{
							label: currentBarcode?.extra?.url,
							url: currentBarcode?.extra?.url,
						},
					],
					[Contacts.Fields.Addresses]: [
						{
							label: currentBarcode?.extra?.address,
							street: currentBarcode?.extra?.address,
						},
					],
					[Contacts.Fields.JobTitle]: currentBarcode?.extra?.title,
				};
				await Contacts.addContactAsync(contact);
			} catch (error) {
				console.error(error);
			}
		}
	};

	const handleAddToCalendarPress = async () => {
		const { status } = await Calendar.requestCalendarPermissionsAsync();
		if (status === "granted") {
			try {
				const eventData = {
					location: currentBarcode?.extra?.location,
					title: currentBarcode?.extra?.summary,
					notes: currentBarcode?.extra?.description,
				};
				await Calendar.createEventInCalendarAsync(eventData, {});
			} catch (error) {
				console.error(error);
			}
		}
	};

	const handleShowCodePress = () => {
		setCurrentScannerResult(currentBarcode);
		currentBarcode?.type === "qr"
			? router.navigate({
					pathname: "/qr-code",
					params: { content: currentBarcode?.raw || currentBarcode.data },
				})
			: router.navigate({
					pathname: "/barcode",
					params: {
						content: currentBarcode?.raw || currentBarcode?.data,
						type: currentBarcode?.type,
					},
				});
		bottomSheetModalRef.current?.dismiss();
	};

	const handleCopyPress = async () => {
		if (currentBarcode?.data) {
			await Clipboard.setStringAsync(currentBarcode?.data);
			setIsCopied(true);
		}
	};

	return (
		<View style={{ marginVertical: 24 }}>
			<View style={{ paddingHorizontal: 36 }}>
				<ThemedText variant="title" style={{ marginBottom: Spacings.sm }}>
					{truncate(currentBarcode?.data || "", 60)}
				</ThemedText>
				{currentBarcode?.type && (
					<ThemedText
						style={{ color: Colors.mutedText, marginBottom: Spacings.sm }}
					>
						{/* {barcodeTypeLabels[currentBarcode?.type as BarcodeType]} */}
						{currentBarcode.type === "qr"
							? `QR ${t(`app.new_code.qr_code_form.type.options.${currentBarcode?.extra?.type}`)}`
							: barcodeTypes.find((type) => type.value === currentBarcode.type)
									?.label}
					</ThemedText>
				)}
				{currentBarcode?.extra?.type === "wifi" && (
					<View style={{ marginBottom: Spacings.sm }}>
						<View style={styles.horizontalStack}>
							<ThemedText numberOfLines={1}>
								{t("app.scanner_bottom_sheet.ssid")}
							</ThemedText>
							<ThemedText numberOfLines={1}>
								{currentBarcode?.extra?.ssid}
							</ThemedText>
						</View>
						{currentBarcode?.extra?.password && (
							<View style={styles.horizontalStack}>
								<ThemedText numberOfLines={1}>
									{t("app.scanner_bottom_sheet.password")}
								</ThemedText>
								<ThemedText numberOfLines={1}>
									{currentBarcode?.extra?.password}
								</ThemedText>
							</View>
						)}
						{currentBarcode?.extra?.type && (
							<View style={styles.horizontalStack}>
								<ThemedText numberOfLines={1}>
									{t("app.scanner_bottom_sheet.encryption")}
								</ThemedText>
								<ThemedText numberOfLines={1}>
									{
										scannerResultTypeToEncryption.find(
											(e) => e.value === currentBarcode?.extra?.type,
										)?.label
									}
								</ThemedText>
							</View>
						)}
					</View>
				)}
				{currentBarcode?.extra?.type === "email" && (
					<View style={{ marginBottom: Spacings.sm }}>
						<View style={styles.horizontalStack}>
							<ThemedText numberOfLines={1}>
								{t("app.scanner_bottom_sheet.email")}
							</ThemedText>
							<ThemedText numberOfLines={1}>
								{currentBarcode?.extra?.address}
							</ThemedText>
						</View>
						{currentBarcode?.extra?.subject && (
							<View style={styles.horizontalStack}>
								<ThemedText numberOfLines={1}>
									{t("app.scanner_bottom_sheet.subject")}
								</ThemedText>
								<ThemedText numberOfLines={1}>
									{currentBarcode?.extra?.subject}
								</ThemedText>
							</View>
						)}
						{currentBarcode?.extra?.body && (
							<View style={styles.horizontalStack}>
								<ThemedText numberOfLines={1}>
									{t("app.scanner_bottom_sheet.body")}
								</ThemedText>
								<ThemedText numberOfLines={1}>
									{currentBarcode?.extra?.body}
								</ThemedText>
							</View>
						)}
					</View>
				)}
				{currentBarcode?.extra?.type === "sms" && (
					<View style={{ marginBottom: Spacings.sm }}>
						<View style={styles.horizontalStack}>
							<ThemedText numberOfLines={1}>
								{t("app.scanner_bottom_sheet.phone_number")}
							</ThemedText>
							<ThemedText numberOfLines={1}>
								{currentBarcode?.extra?.phoneNumber}
							</ThemedText>
						</View>
						{currentBarcode?.extra?.message && (
							<View style={styles.horizontalStack}>
								<ThemedText numberOfLines={1}>
									{t("app.scanner_bottom_sheet.message")}
								</ThemedText>
								<ThemedText numberOfLines={1}>
									{truncate(currentBarcode?.extra?.message, 26)}
								</ThemedText>
							</View>
						)}
					</View>
				)}
				{currentBarcode?.extra &&
					(currentBarcode?.extra.type === "contactInfo" || "vcard") && (
						<View style={{ marginBottom: Spacings.sm }}>
							{currentBarcode?.extra?.firstName && (
								<View style={styles.horizontalStack}>
									<ThemedText numberOfLines={1}>
										{t("app.scanner_bottom_sheet.first_name")}
									</ThemedText>
									<ThemedText numberOfLines={1}>
										{currentBarcode?.extra?.firstName}
									</ThemedText>
								</View>
							)}
							{currentBarcode?.extra?.lastName && (
								<View style={styles.horizontalStack}>
									<ThemedText numberOfLines={1}>
										{t("app.scanner_bottom_sheet.last_name")}
									</ThemedText>
									<ThemedText numberOfLines={1}>
										{currentBarcode?.extra?.lastName}
									</ThemedText>
								</View>
							)}
							{currentBarcode?.extra?.email && (
								<View style={styles.horizontalStack}>
									<ThemedText numberOfLines={1}>
										{t("app.scanner_bottom_sheet.email")}
									</ThemedText>
									<ThemedText numberOfLines={1}>
										{currentBarcode?.extra?.email}
									</ThemedText>
								</View>
							)}
							{currentBarcode?.extra?.title && (
								<View style={styles.horizontalStack}>
									<ThemedText numberOfLines={1}>
										{t("app.scanner_bottom_sheet.title")}
									</ThemedText>
									<ThemedText numberOfLines={1}>
										{currentBarcode?.extra?.title}
									</ThemedText>
								</View>
							)}
							{currentBarcode?.extra?.organization && (
								<View style={styles.horizontalStack}>
									<ThemedText numberOfLines={1}>
										{t("app.scanner_bottom_sheet.organization")}
									</ThemedText>
									<ThemedText numberOfLines={1}>
										{currentBarcode?.extra?.organization}
									</ThemedText>
								</View>
							)}
							{currentBarcode?.extra?.phone && (
								<View style={styles.horizontalStack}>
									<ThemedText numberOfLines={1}>
										{t("app.scanner_bottom_sheet.phone")}
									</ThemedText>
									<ThemedText numberOfLines={1}>
										{currentBarcode?.extra?.phone}
									</ThemedText>
								</View>
							)}
							{currentBarcode?.extra?.address && (
								<View style={styles.horizontalStack}>
									<ThemedText numberOfLines={1}>
										{t("app.scanner_bottom_sheet.address")}
									</ThemedText>
									<ThemedText numberOfLines={1}>
										{currentBarcode?.extra?.address}
									</ThemedText>
								</View>
							)}
							{currentBarcode?.extra?.url && (
								<View style={styles.horizontalStack}>
									<ThemedText numberOfLines={1}>
										{t("app.scanner_bottom_sheet.url")}
									</ThemedText>
									<ThemedText numberOfLines={1}>
										{currentBarcode?.extra?.url}
									</ThemedText>
								</View>
							)}
						</View>
					)}
				{(currentBarcode?.extra?.type === "calendarEvent" ||
					currentBarcode?.extra?.type === "event") && (
					<View style={{ marginBottom: Spacings.sm }}>
						{currentBarcode?.extra?.summary && (
							<View style={styles.horizontalStack}>
								<ThemedText numberOfLines={1}>
									{t("app.scanner_bottom_sheet.summary")}
								</ThemedText>
								<ThemedText numberOfLines={1}>
									{currentBarcode?.extra?.summary}
								</ThemedText>
							</View>
						)}
						{currentBarcode?.extra?.location && (
							<View style={styles.horizontalStack}>
								<ThemedText numberOfLines={1}>
									{t("app.scanner_bottom_sheet.location")}
								</ThemedText>
								<ThemedText numberOfLines={1}>
									{currentBarcode?.extra?.location}
								</ThemedText>
							</View>
						)}
						{currentBarcode?.extra?.description && (
							<View style={styles.horizontalStack}>
								<ThemedText numberOfLines={1}>
									{t("app.scanner_bottom_sheet.description")}
								</ThemedText>
								<ThemedText numberOfLines={1}>
									{currentBarcode?.extra?.description}
								</ThemedText>
							</View>
						)}
						{currentBarcode?.extra?.start && (
							<View style={styles.horizontalStack}>
								<ThemedText numberOfLines={1}>
									{t("app.scanner_bottom_sheet.start_date")}
								</ThemedText>
								<ThemedText numberOfLines={1}>
									{currentBarcode?.extra?.start}
								</ThemedText>
							</View>
						)}
						{currentBarcode?.extra?.end && (
							<View style={styles.horizontalStack}>
								<ThemedText numberOfLines={1}>
									{t("app.scanner_bottom_sheet.end_date")}
								</ThemedText>
								<ThemedText numberOfLines={1}>
									{currentBarcode?.extra?.end}
								</ThemedText>
							</View>
						)}
					</View>
				)}
			</View>
			<View style={{ paddingHorizontal: 12, marginBottom: Spacings.lg }}>
				{currentBarcode?.extra && currentBarcode?.extra.type === "url" && (
					<Pressable
						onPress={handleOpenUrlPress}
						style={({ pressed }) => [
							pressed && { backgroundColor: Colors.darkBackgroundPressed },
							styles.buttonContainer,
						]}
					>
						<Link
							size={16}
							color={Colors.white}
							style={{ marginRight: Spacings.md }}
						/>
						<ThemedText>{t("app.scanner_bottom_sheet.see_website")}</ThemedText>
					</Pressable>
				)}
				{currentBarcode?.extra && currentBarcode?.extra.type === "email" && (
					<Pressable
						onPress={handleOpenEmailPress}
						style={({ pressed }) => [
							pressed && { backgroundColor: Colors.darkBackgroundPressed },
							styles.buttonContainer,
						]}
					>
						<AtSign
							size={16}
							color={Colors.white}
							style={{ marginRight: Spacings.md }}
						/>
						<ThemedText>{t("app.scanner_bottom_sheet.send_email")}</ThemedText>
					</Pressable>
				)}
				{currentBarcode?.extra && currentBarcode?.extra.type === "phone" && (
					<Pressable
						onPress={handleOpenPhonePress}
						style={({ pressed }) => [
							pressed && { backgroundColor: Colors.darkBackgroundPressed },
							styles.buttonContainer,
						]}
					>
						<Phone
							size={16}
							color={Colors.white}
							style={{ marginRight: Spacings.md }}
						/>
						<ThemedText>{t("app.scanner_bottom_sheet.call")}</ThemedText>
					</Pressable>
				)}
				{currentBarcode?.extra && currentBarcode?.extra.type === "sms" && (
					<Pressable
						onPress={handleOpenSMSPress}
						style={({ pressed }) => [
							pressed && { backgroundColor: Colors.darkBackgroundPressed },
							styles.buttonContainer,
						]}
					>
						<MessageSquare
							size={16}
							color={Colors.white}
							style={{ marginRight: Spacings.md }}
						/>
						<ThemedText>{t("app.scanner_bottom_sheet.send_sms")}</ThemedText>
					</Pressable>
				)}
				{currentBarcode?.extra && currentBarcode?.extra.type === "geoPoint" && (
					<Pressable
						onPress={handleOpenLocationPress}
						style={({ pressed }) => [
							pressed && { backgroundColor: Colors.darkBackgroundPressed },
							styles.buttonContainer,
						]}
					>
						<MapPin
							size={16}
							color={Colors.white}
							style={{ marginRight: Spacings.md }}
						/>
						<ThemedText>{t("app.scanner_bottom_sheet.open_map")}</ThemedText>
					</Pressable>
				)}
				{currentBarcode?.extra &&
					(currentBarcode?.extra.type === "contactInfo" ||
						currentBarcode?.extra?.type === "vcard") && (
						<Pressable
							onPress={handleAddToContactsPress}
							style={({ pressed }) => [
								pressed && { backgroundColor: Colors.darkBackgroundPressed },
								styles.buttonContainer,
							]}
						>
							<UserPlus
								size={16}
								color={Colors.white}
								style={{ marginRight: Spacings.md }}
							/>
							<ThemedText>
								{t("app.scanner_bottom_sheet.add_to_contacts")}
							</ThemedText>
						</Pressable>
					)}
				{currentBarcode?.extra &&
					(currentBarcode?.extra.type === "calendarEvent" ||
						currentBarcode?.extra?.type === "event") && (
						<Pressable
							onPress={handleAddToCalendarPress}
							style={({ pressed }) => [
								pressed && { backgroundColor: Colors.darkBackgroundPressed },
								styles.buttonContainer,
							]}
						>
							<CalendarPlus
								size={16}
								color={Colors.white}
								style={{ marginRight: Spacings.md }}
							/>
							<ThemedText>
								{t("app.scanner_bottom_sheet.add_to_calendar")}
							</ThemedText>
						</Pressable>
					)}
				<Pressable
					onPress={handleCopyPress}
					style={({ pressed }) => [
						pressed && { backgroundColor: Colors.darkBackgroundPressed },
						styles.buttonContainer,
					]}
				>
					{isCopied ? (
						<CopyCheck
							size={16}
							color={Colors.white}
							style={{ marginRight: Spacings.md }}
						/>
					) : (
						<Copy
							size={16}
							color={Colors.white}
							style={{ marginRight: Spacings.md }}
						/>
					)}

					<ThemedText>{t("app.scanner_bottom_sheet.copy")}</ThemedText>
				</Pressable>
				<Pressable
					onPress={handleShareContentPress}
					style={({ pressed }) => [
						pressed && { backgroundColor: Colors.darkBackgroundPressed },
						styles.buttonContainer,
					]}
				>
					<Share2
						size={16}
						color={Colors.white}
						style={{ marginRight: Spacings.md }}
					/>
					<ThemedText>{t("app.scanner_bottom_sheet.share_content")}</ThemedText>
				</Pressable>
				<Pressable
					onPress={handleShowCodePress}
					style={({ pressed }) => [
						pressed && { backgroundColor: Colors.darkBackgroundPressed },
						styles.buttonContainer,
					]}
				>
					{currentBarcode?.type === "qr" ? (
						<QrCode
							size={16}
							color={Colors.white}
							style={{ marginRight: Spacings.md }}
						/>
					) : (
						<Barcode
							size={16}
							color={Colors.white}
							style={{ marginRight: Spacings.md }}
						/>
					)}
					<ThemedText>{t("app.scanner_bottom_sheet.show_code")}</ThemedText>
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	buttonContainer: {
		paddingHorizontal: 24,
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: Spacings.sm,
		marginBottom: Spacings.sm,
	},
	horizontalStack: {
		flexDirection: "row",
		alignItems: "center",
	},
});
