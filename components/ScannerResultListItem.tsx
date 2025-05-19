import { Spacings } from "@/constants/Spacings";
import type { BarcodeScanningResult } from "expo-camera";
import { Barcode, QrCode } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "./ui/ThemedText";

type ScannerResultListItemProps = {
	scannerResult: BarcodeScanningResult;
};

export function ScannerResultListItem({
	scannerResult,
}: ScannerResultListItemProps) {
	return (
		<View style={styles.container}>
			{scannerResult.type === "qr" ? (
				<QrCode size={24} color="white" />
			) : (
				<Barcode size={24} color="white" />
			)}
			<ThemedText>{scannerResult.data}</ThemedText>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: Spacings.sm,
		marginBottom: Spacings.sm,
	},
});
