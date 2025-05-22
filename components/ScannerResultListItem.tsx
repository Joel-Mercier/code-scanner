import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import { useBottomSheetBackHandler } from "@/hooks/useBottomSheetBackHandler";
import type { ScannerResult } from "@/stores/scannerResultsStore";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Barcode, EllipsisVertical, QrCode } from "lucide-react-native";
import { useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ScannerBottomSheetContent } from "./ScannerBottomSheetContent";
import { ThemedText } from "./ui/ThemedText";

type ScannerResultListItemProps = {
	scannerResult: ScannerResult;
};

export function ScannerResultListItem({
	scannerResult,
}: ScannerResultListItemProps) {
	const bottomSheetModalRef = useRef<BottomSheetModal>(null);
	const { handleSheetPositionChange } =
		useBottomSheetBackHandler(bottomSheetModalRef);

	const handleShowBottomSheetPress = () => {
		bottomSheetModalRef.current?.present();
	};

	return (
		<View style={styles.container}>
			{scannerResult.type === "qr" ? (
				<QrCode size={24} color="white" style={{ marginRight: Spacings.md }} />
			) : (
				<Barcode size={24} color="white" style={{ marginRight: Spacings.md }} />
			)}
			<View style={{ flex: 1 }}>
				<ThemedText numberOfLines={1} style={{ flex: 1 }}>
					{scannerResult.data}
				</ThemedText>
				<ThemedText variant="small" style={{ color: Colors.mutedText }}>
					{`Il y a ${formatDistanceToNow(scannerResult.createdAt, { locale: fr })}`}
				</ThemedText>
			</View>
			<Pressable onPress={handleShowBottomSheetPress}>
				<EllipsisVertical size={24} color="white" />
			</Pressable>
			<BottomSheetModal
				ref={bottomSheetModalRef}
				onChange={handleSheetPositionChange}
				backgroundStyle={{ backgroundColor: Colors.darkBackground }}
				handleIndicatorStyle={{
					backgroundColor: "#b3b3b3",
				}}
			>
				<BottomSheetView style={styles.bottomSheetContentContainer}>
					<ScannerBottomSheetContent currentBarcode={scannerResult} />
				</BottomSheetView>
			</BottomSheetModal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: Spacings.md,
	},
	bottomSheetContentContainer: {
		flex: 1,
		alignItems: "center",
		padding: 0,
	},
});
