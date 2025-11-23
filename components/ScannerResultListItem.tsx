import { ScannerBottomSheetContent } from "@/components/ScannerBottomSheetContent";
import { ThemedText } from "@/components/ui/ThemedText";
import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import { useBottomSheetBackHandler } from "@/hooks/useBottomSheetBackHandler";
import useScannerResults from "@/stores/scannerResultsStore";
import type { ScannerResult } from "@/types";
import { barcodeTypes } from "@/utils/data";
import {
	BottomSheetBackdrop,
	BottomSheetModal,
	BottomSheetView,
} from "@gorhom/bottom-sheet";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Barcode, ChevronRight, QrCode } from "lucide-react-native";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

type ScannerResultListItemProps = {
	scannerResult: ScannerResult;
	isLast: boolean;
};

export function ScannerResultListItem({
	scannerResult,
	isLast,
}: ScannerResultListItemProps) {
	const { t, i18n } = useTranslation();
	const bottomSheetModalRef = useRef<BottomSheetModal>(null);
	const { handleSheetPositionChange } =
		useBottomSheetBackHandler(bottomSheetModalRef);
	const setCurrentScannerResult =
		useScannerResults.use.setCurrentScannerResult();

	const handleShowBottomSheetPress = () => {
		bottomSheetModalRef.current?.present();
	};

	return (
		<Pressable
			onPress={handleShowBottomSheetPress}
			style={({ pressed }) => [
				styles.container,
				isLast && { borderBottomWidth: 0, marginBottom: 0 },
				pressed && { opacity: 0.65 },
			]}
		>
			<View style={styles.iconWrapper}>
				{scannerResult.type === "qr" ? (
					<QrCode size={24} color={Colors.primary} />
				) : (
					<Barcode size={24} color={Colors.primary} />
				)}
			</View>
			<View style={{ flex: 1 }}>
				<ThemedText numberOfLines={1} style={{ flex: 1 }}>
					{scannerResult.data}
				</ThemedText>
				<View style={{ flexDirection: "row", alignItems: "center" }}>
					<ThemedText
						numberOfLines={1}
						variant="small"
						style={{ color: Colors.mutedText }}
					>
						{`${scannerResult.source === "form" ? t("app.scanner_result.created") : t("app.scanner_result.scanned")} ${t("app.scanner_result.ago", { time: formatDistanceToNow(scannerResult.createdAt, { locale: i18n.language === "fr" ? fr : undefined }) })}`}
					</ThemedText>
					<ThemedText
						numberOfLines={1}
						variant="small"
						style={{ color: Colors.mutedText }}
					>
						{" · "}
						{scannerResult.type === "qr"
							? `QR ${t(`app.new_code.qr_code_form.type.options.${scannerResult?.extra?.type}`)}`
							: barcodeTypes.find((type) => type.value === scannerResult.type)
									?.label}
					</ThemedText>
				</View>
			</View>
			<ChevronRight size={24} color={Colors.mutedText} />
			{/* <Pressable onPress={handleShowBottomSheetPress}>
          <EllipsisVertical size={24} color="white" />
        </Pressable> */}
			<BottomSheetModal
				ref={bottomSheetModalRef}
				onChange={handleSheetPositionChange}
				backgroundStyle={{ backgroundColor: Colors.background }}
				handleIndicatorStyle={{
					backgroundColor: "#b3b3b3",
				}}
				backdropComponent={(props) => (
					<BottomSheetBackdrop
						{...props}
						appearsOnIndex={0}
						disappearsOnIndex={-1}
					/>
				)}
				onDismiss={() => setCurrentScannerResult(null)}
			>
				<BottomSheetView style={styles.bottomSheetContentContainer}>
					<ScannerBottomSheetContent
						currentBarcode={scannerResult}
						bottomSheetModalRef={bottomSheetModalRef}
					/>
				</BottomSheetView>
			</BottomSheetModal>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		padding: Spacings.md,
		borderBottomWidth: 1,
		borderBottomColor: Colors.slate["800"],
		backgroundColor: Colors.background,
		borderRadius: Spacings.md,
		marginBottom: Spacings.md,
	},
	bottomSheetContentContainer: {
		padding: 0,
	},
	iconWrapper: {
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: Colors.backgroundAccent,
		borderRadius: Spacings.sm,
		padding: Spacings.sm,
		marginRight: Spacings.md,
	},
});
