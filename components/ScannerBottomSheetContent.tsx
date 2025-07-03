import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import useScannerResults from "@/stores/scannerResultsStore";
import type { ScannerResult } from "@/types";
import { barcodeTypes, scannerResultTypeToEncryption } from "@/utils/data";
import {
	convertMATMSGToMailto,
	convertSMSTOToSMS,
} from "@/utils/generateQRCodeData";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import {
	AtSign,
	Barcode,
	Copy,
	CopyCheck,
	Link,
	MapPin,
	MessageSquare,
	Phone,
	QrCode,
	Share2,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, Share, StyleSheet, View } from "react-native";
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
		console.log(`DEBUG : Opening ${currentBarcode?.extra?.url} in maps app`);
		await Linking.openURL(currentBarcode?.extra?.url);
	};

	const handleShareContentPress = async () => {
		await Share.share({
			message: currentBarcode?.data,
			url: currentBarcode?.extra?.url,
		});
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
					{currentBarcode?.data}
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
							<ThemedText>Nom du réseau : </ThemedText>
							<ThemedText>{currentBarcode?.extra?.ssid}</ThemedText>
						</View>
						{currentBarcode?.extra?.password && (
							<View style={styles.horizontalStack}>
								<ThemedText>Mot de passe : </ThemedText>
								<ThemedText>{currentBarcode?.extra?.password}</ThemedText>
							</View>
						)}
						{currentBarcode?.extra?.type && (
							<View style={styles.horizontalStack}>
								<ThemedText>Sécurité : </ThemedText>
								<ThemedText>
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
