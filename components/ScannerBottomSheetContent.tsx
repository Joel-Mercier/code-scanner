import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import type { BarcodeScanningResult, BarcodeType } from "expo-camera";
import { openBrowserAsync } from "expo-web-browser";
import { Barcode, Link, QrCode, Share2 } from "lucide-react-native";
import { Pressable, Share, StyleSheet, View } from "react-native";
import { ThemedText } from "./ui/ThemedText";

type ScannerResultProps = {
	currentBarcode: BarcodeScanningResult | null;
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
}: ScannerResultProps) {
	const handleOpenUrlPress = async () => {
		await openBrowserAsync(currentBarcode?.extra?.url);
	};

	const handleSharePress = async () => {
		await Share.share({
			message: currentBarcode?.data,
			url: currentBarcode?.extra?.url,
		});
	};

	const handleShowCodePress = () => {
		console.log(currentBarcode?.data);
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
			<View style={{ paddingHorizontal: 12 }}>
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
