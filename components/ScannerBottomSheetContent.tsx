import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import useScannerResults, {
	type ScannerResult,
} from "@/stores/scannerResultsStore";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import type { BarcodeType } from "expo-camera";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import {
	Barcode,
	Copy,
	CopyCheck,
	Link,
	QrCode,
	Share2,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Linking, Pressable, Share, StyleSheet, View } from "react-native";
import { ThemedText } from "./ui/ThemedText";

type ScannerResultProps = {
	currentBarcode: ScannerResult | null;
	bottomSheetModalRef: React.RefObject<BottomSheetModal | null>;
};

const barcodeTypeLabels: Record<BarcodeType, string> = {
	aztec: "Aztec",
	ean13: "EAN-13",
	ean8: "EAN-8",
	qr: "Code QR",
	pdf417: "PDF417",
	upc_e: "UPC-E",
	datamatrix: "Datamatrix",
	code39: "Code 39",
	code93: "Code 93",
	itf14: "ITF-14",
	codabar: "Codabar",
	code128: "Code 128",
	upc_a: "UPC-A",
};

export function ScannerBottomSheetContent({
	currentBarcode,
	bottomSheetModalRef,
}: ScannerResultProps) {
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
		console.log(`DEBUG : Opening ${currentBarcode?.extra?.url} in email app`);
		await Linking.openURL(currentBarcode?.extra?.url);
	};

	const handleOpenSMSPress = async () => {
		console.log(`DEBUG : Opening ${currentBarcode?.extra?.url} in sms app`);
		await Linking.openURL(currentBarcode?.extra?.url);
	};

	const handleOpenLocationPress = async () => {
		console.log(`DEBUG : Opening ${currentBarcode?.extra?.url} in maps app`);
		await Linking.openURL(currentBarcode?.extra?.url);
	};

	const handleSharePress = async () => {
		await Share.share({
			message: currentBarcode?.data,
			url: currentBarcode?.extra?.url,
		});
	};

	const handleShowCodePress = () => {
		setCurrentScannerResult(currentBarcode);
		router.navigate("/code");
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
						{barcodeTypeLabels[currentBarcode?.type as BarcodeType]}
					</ThemedText>
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
						<ThemedText>Voir le site web</ThemedText>
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
						<Link
							size={16}
							color={Colors.white}
							style={{ marginRight: Spacings.md }}
						/>
						<ThemedText>Ouvrir le message</ThemedText>
					</Pressable>
				)}
				{currentBarcode?.extra && currentBarcode?.extra.type === "phone" && (
					<Pressable
						onPress={handleOpenSMSPress}
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
						<ThemedText>Ouvrir le message</ThemedText>
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
						<Link
							size={16}
							color={Colors.white}
							style={{ marginRight: Spacings.md }}
						/>
						<ThemedText>Ouvrir le message</ThemedText>
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
						<Link
							size={16}
							color={Colors.white}
							style={{ marginRight: Spacings.md }}
						/>
						<ThemedText>Ouvrir le message</ThemedText>
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

					<ThemedText>Copier le contenu du code</ThemedText>
				</Pressable>
				<Pressable
					onPress={handleSharePress}
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
					<ThemedText>Partager</ThemedText>
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
					<ThemedText>Afficher le code</ThemedText>
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
});
