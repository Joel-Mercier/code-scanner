import { ScannerBottomSheetContent } from "@/components/ScannerBottomSheetContent";
import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import { useBottomSheetBackHandler } from "@/hooks/useBottomSheetBackHandler";
import useScannerResults from "@/stores/scannerResultsStore";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import {
	type BarcodeScanningResult,
	CameraView,
	useCameraPermissions,
} from "expo-camera";
import { useNavigation, useRouter } from "expo-router";
import { Flashlight, FlashlightOff, List, Scan } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
	const [currentBarcode, setCurrentBarcode] =
		useState<BarcodeScanningResult | null>(null);
	const [torchEnabled, setTorchEnabled] = useState(false);
	const [overlayVisible, setOverlayVisible] = useState(false);
	const [permission, requestPermission] = useCameraPermissions();
	const insets = useSafeAreaInsets();
	const bottomSheetModalRef = useRef<BottomSheetModal>(null);
	const { handleSheetPositionChange } =
		useBottomSheetBackHandler(bottomSheetModalRef);
	const scannerResults = useScannerResults.use.scannerResults();
	const addScannerResult = useScannerResults.use.addScannerResult();
	const router = useRouter();
	const navigation = useNavigation();
	const isFocused = navigation.isFocused();

	useEffect(() => {
		if (!permission?.granted) {
			requestPermission();
		}
	}, []);

	const handleBarcodeScanned = (scanningResult: BarcodeScanningResult) => {
		console.log(scanningResult);
		if (!currentBarcode) {
			setCurrentBarcode(scanningResult);
			bottomSheetModalRef.current?.present();
			addScannerResult(scanningResult);
		}
	};

	return (
		<View style={{ flex: 1 }}>
			{isFocused && (
				<CameraView
					active={true}
					animateShutter={false}
					autofocus="on"
					barcodeScannerSettings={{
						barcodeTypes: [
							"aztec",
							"ean13",
							"ean8",
							"qr",
							"pdf417",
							"upc_e",
							"datamatrix",
							"code39",
							"code93",
							"itf14",
							"codabar",
							"code128",
							"upc_a",
						],
					}}
					enableTorch={torchEnabled}
					facing="back"
					mute={true}
					onBarcodeScanned={handleBarcodeScanned}
					style={{ flex: 1 }}
					zoom={0}
				/>
			)}
			<View
				style={[
					styles.cameraOverlay,
					{
						top: insets.top,
						left: insets.left,
						right: insets.right,
						bottom: insets.bottom,
					},
				]}
			>
				<View>
					<Pressable
						style={({ pressed }) => [
							pressed && {
								backgroundColor: Colors.darkBackgroundPressed,
								opacity: 0.75,
							},
							styles.iconWrapper,
							{ marginBottom: Spacings.md },
						]}
						onPress={() => setTorchEnabled(!torchEnabled)}
					>
						{torchEnabled ? (
							<Flashlight color={Colors.white} size={24} />
						) : (
							<FlashlightOff color={Colors.white} size={24} />
						)}
					</Pressable>
					<Pressable
						style={({ pressed }) => [
							pressed && {
								backgroundColor: Colors.darkBackgroundPressed,
								opacity: 0.75,
							},
							styles.iconWrapper,
						]}
						onPress={() => setOverlayVisible(!overlayVisible)}
					>
						<Scan color={Colors.white} size={24} />
					</Pressable>
				</View>

				{scannerResults.length > 0 && (
					<Pressable
						style={({ pressed }) => [
							pressed && {
								backgroundColor: Colors.darkBackgroundPressed,
								opacity: 0.75,
							},
							styles.iconWrapper,
						]}
						onPress={() => router.navigate("/scanner-results")}
					>
						<List color={Colors.white} size={24} />
					</Pressable>
				)}
			</View>
			<BottomSheetModal
				ref={bottomSheetModalRef}
				onChange={handleSheetPositionChange}
				onDismiss={() => setCurrentBarcode(null)}
				backgroundStyle={{ backgroundColor: Colors.darkBackground }}
				handleIndicatorStyle={{
					backgroundColor: "#b3b3b3",
				}}
			>
				<BottomSheetView style={styles.bottomSheetContentContainer}>
					<ScannerBottomSheetContent currentBarcode={currentBarcode} />
				</BottomSheetView>
			</BottomSheetModal>
		</View>
	);
}

const styles = StyleSheet.create({
	cameraOverlay: {
		backgroundColor: "transparent",
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		padding: 24,
		flexDirection: "row",
		justifyContent: "space-between",
	},
	iconWrapper: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: Colors.darkBackground,
		alignItems: "center",
		justifyContent: "center",
	},
	bottomSheetContentContainer: {
		flex: 1,
		alignItems: "center",
		padding: 0,
	},
});
