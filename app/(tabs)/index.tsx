import { ScannerBottomSheetContent } from "@/components/ScannerBottomSheetContent";
import { ZoomSlider } from "@/components/ZoomSlider";
import { ThemedText } from "@/components/ui/ThemedText";
import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import { useBottomSheetBackHandler } from "@/hooks/useBottomSheetBackHandler";
import useApp from "@/stores/appStore";
import useScannerResults from "@/stores/scannerResultsStore";
import type { ScannerResult } from "@/types";
import { getQRCodeSubType } from "@/utils/getQRCodeSubType";
import {
	BottomSheetBackdrop,
	BottomSheetModal,
	BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
	Canvas,
	Group,
	Mask,
	Rect,
	RoundedRect,
} from "@shopify/react-native-skia";
import {
	type BarcodeScanningResult,
	CameraView,
	useCameraPermissions,
} from "expo-camera";
import { CameraType } from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library";
import { Link, useNavigation, useRouter } from "expo-router";
import { Orientation } from "expo-screen-orientation";
import {
	Flashlight,
	FlashlightOff,
	RefreshCcw,
	Scan,
	Slash,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
	FadeIn,
	FadeOut,
	useAnimatedProps,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedCameraView = Animated.createAnimatedComponent(CameraView);

export default function HomeScreen() {
	const { t } = useTranslation();
	const [torchEnabled, setTorchEnabled] = useState(false);
	const [overlayVisible, setOverlayVisible] = useState(false);
	const [cameraType, setCameraType] = useState(CameraType.back);
	const [cameraPermission, requestCameraPermission] = useCameraPermissions();
	const [mediaLibraryPermission, requestMediaLibraryPermission] =
		MediaLibrary.usePermissions();
	const insets = useSafeAreaInsets();
	const bottomSheetModalRef = useRef<BottomSheetModal>(null);
	const cameraRef = useRef<CameraView>(null);
	const { handleSheetPositionChange } =
		useBottomSheetBackHandler(bottomSheetModalRef);
	const scannerResults = useScannerResults.use.scannerResults();
	const addScannerResult = useScannerResults.use.addScannerResult();
	const currentScannerResult = useScannerResults.use.currentScannerResult();
	const setCurrentScannerResult =
		useScannerResults.use.setCurrentScannerResult();
	const router = useRouter();
	const navigation = useNavigation();
	const isFocused = navigation.isFocused();
	const { height, width } = useWindowDimensions();
	const sliderOffset = useSharedValue(0.0001);
	const cameraIconRotation = useSharedValue(0);
	const MAX_VALUE = width - Spacings.lg * 4 - 48;
	const isPortraitOrientation = useApp(
		(state) =>
			state.orientation ===
			(Orientation.PORTRAIT_UP ||
				state.orientation === Orientation.PORTRAIT_DOWN),
	);

	useEffect(() => {
		if (!cameraPermission?.granted) {
			requestCameraPermission();
		}
		sliderOffset.value = 0;
	}, []);

	const handleBarcodeScanned = (
		scanningResult: BarcodeScanningResult & { extra?: Record<string, string> },
	) => {
		if (!currentScannerResult) {
			console.log("scanningResult :", scanningResult);
			const extra = scanningResult.extra;
			const subType = getQRCodeSubType(scanningResult);
			const scannerResult: ScannerResult = {
				...scanningResult,
				createdAt: new Date(),
				source: "scanner",
				extra: {
					...extra,
					type: subType || "text",
				},
			};
			addScannerResult(scannerResult);
			setCurrentScannerResult(scannerResult);
			bottomSheetModalRef.current?.present();
		}
	};

	const handlePicturePress = async () => {
		if (!mediaLibraryPermission?.granted) {
			requestMediaLibraryPermission();
			return;
		}
		const picture = await cameraRef.current?.takePictureAsync();
		if (picture?.base64) {
			try {
				await MediaLibrary.saveToLibraryAsync(picture.uri);
			} catch (error) {
				console.log(
					"An error occurred while saving the picture to the media library : ",
				);
				console.log(error);
			}
		}
	};

	const handleToggleCamera = () => {
		cameraIconRotation.value = withSpring(
			cameraType === CameraType.back ? 0 : 180,
		);
		setCameraType(
			cameraType === CameraType.back ? CameraType.front : CameraType.back,
		);
	};

	const zoom = useDerivedValue(() => {
		return ((sliderOffset.value / MAX_VALUE) * 100) / 100;
	}, [sliderOffset, MAX_VALUE]);

	const zoomProps = useAnimatedProps(() => {
		return {
			zoom: zoom.value,
		};
	});

	const toggleCameraIconStyle = useAnimatedStyle(() => {
		return {
			transform: [{ rotate: `${cameraIconRotation.value}deg` }],
		};
	});

	return (
		<View style={{ flex: 1 }}>
			{isFocused && (
				<AnimatedCameraView
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
					facing={cameraType}
					mute={true}
					onBarcodeScanned={handleBarcodeScanned}
					style={{ flex: 1 }}
					ref={cameraRef}
					animatedProps={zoomProps}
				/>
			)}
			{overlayVisible && (
				<Animated.View
					entering={FadeIn}
					exiting={FadeOut}
					style={styles.overlay}
				>
					<Canvas style={{ width: "100%", height: "100%" }}>
						<Mask
							mode="luminance"
							mask={
								<Group>
									<Rect
										x={0}
										y={0}
										width={width}
										height={height}
										color="white"
									/>
									<RoundedRect
										x={
											width / 2 -
											width / 2 / 2 / (isPortraitOrientation ? 1 : 2)
										}
										y={
											height / 2 -
											width / 2 / 2 / (isPortraitOrientation ? 1 : 2)
										}
										width={(isPortraitOrientation ? width : height) / 2}
										height={(isPortraitOrientation ? width : height) / 2}
										r={24}
										color="black"
									/>
								</Group>
							}
						>
							<Rect
								x={0}
								y={0}
								width={width}
								height={height}
								color="black"
								opacity={0.85}
							/>
						</Mask>
					</Canvas>
				</Animated.View>
			)}
			<View
				style={[
					styles.cameraOverlay,
					{
						top: insets.top + Spacings.md,
						left: insets.left,
						right: insets.right,
					},
				]}
			>
				{/* <View>
					

					<Pressable
						style={({ pressed }) => [
							pressed && {
								backgroundColor: Colors.darkBackgroundPressed,
								opacity: 0.75,
							},
							styles.iconWrapper,
							{ marginBottom: Spacings.md },
						]}
						onPress={handlePicturePress}
					>
						<Camera color={Colors.white} size={24} />
					</Pressable>
					
				</View>
				<View>
					{scannerResults.length > 0 && (
						<Pressable
							style={({ pressed }) => [
								pressed && {
									backgroundColor: Colors.darkBackgroundPressed,
									opacity: 0.75,
								},
								styles.iconWrapper,
								{ marginBottom: Spacings.md },
							]}
							onPress={() => router.navigate("/history")}
						>
							<List color={Colors.white} size={24} />
						</Pressable>
					)}
					<Pressable
						onPress={() => router.navigate("/new-code")}
						style={({ pressed }) => [
							pressed && { backgroundColor: Colors.darkBackgroundPressed },
							styles.iconWrapper,
							{ marginBottom: Spacings.md },
						]}
					>
						<QrCode color={Colors.white} size={24} />
						<PlusCircle
							size={16}
							color={Colors.white}
							style={{ position: "absolute", bottom: 8, right: 8 }}
							fill={Colors.darkBackground}
						/>
					</Pressable>
					<Pressable
						onPress={() => router.navigate("/settings")}
						style={({ pressed }) => [
							pressed && { backgroundColor: Colors.darkBackgroundPressed },
							styles.iconWrapper,
						]}
					>
						<Settings color={Colors.white} size={24} />
					</Pressable>
					<Pressable
						onPress={() => router.navigate("/document-scanner")}
						style={({ pressed }) => [
							pressed && { backgroundColor: Colors.darkBackgroundPressed },
							styles.iconWrapper,
						]}
					>
						<File color={Colors.white} size={24} />
					</Pressable>
				</View> */}
				<View style={styles.headerWrapper}>
					<Pressable
						style={({ pressed }) => [
							pressed && {
								backgroundColor: Colors.darkBackgroundPressed,
								opacity: 0.75,
							},
							styles.iconWrapper,
						]}
						onPress={() => setTorchEnabled(!torchEnabled)}
					>
						{torchEnabled ? (
							<FlashlightOff color={Colors.white} size={24} />
						) : (
							<Flashlight color={Colors.white} size={24} />
						)}
					</Pressable>
					<View style={styles.tabsList}>
						<View style={[styles.tabsTrigger, styles.tabsTriggerSelected]}>
							<ThemedText
								variant="default"
								style={[styles.tabsTriggerText, styles.tabsTriggerSelectedText]}
							>
								{t("app.home.scan_code")}
							</ThemedText>
						</View>
						<View style={[styles.tabsTrigger]}>
							<Link href={"/document-scanner"} asChild>
								<ThemedText variant="default" style={styles.tabsTriggerText}>
									{t("app.home.scan_document")}
								</ThemedText>
							</Link>
						</View>
					</View>
					<Pressable
						style={({ pressed }) => [
							pressed && {
								backgroundColor: Colors.darkBackgroundPressed,
								opacity: 0.75,
							},
							styles.iconWrapper,
						]}
						onPress={handleToggleCamera}
					>
						<Animated.View style={[toggleCameraIconStyle]}>
							<RefreshCcw color={Colors.white} size={24} />
						</Animated.View>
					</Pressable>
				</View>
				<LinearGradient
					colors={["transparent", Colors.darkBackground, Colors.darkBackground]}
					locations={[0, 0.9, 1]}
					style={styles.zoomSliderWrapper}
				>
					<ZoomSlider offset={sliderOffset} />
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
						{overlayVisible ? (
							<>
								<Scan color={Colors.white} size={24} />
								<Slash
									size={24}
									color={Colors.white}
									style={{
										position: "absolute",
										transform: [{ rotate: "90deg" }],
									}}
								/>
							</>
						) : (
							<Scan color={Colors.white} size={24} />
						)}
					</Pressable>
				</LinearGradient>
			</View>
			<BottomSheetModal
				ref={bottomSheetModalRef}
				onChange={handleSheetPositionChange}
				onDismiss={() => setCurrentScannerResult(null)}
				backgroundStyle={{ backgroundColor: Colors.darkBackground }}
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
			>
				<BottomSheetView style={styles.bottomSheetContentContainer}>
					<ScannerBottomSheetContent
						currentBarcode={currentScannerResult}
						bottomSheetModalRef={bottomSheetModalRef}
					/>
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
		flexDirection: "column",
		justifyContent: "space-between",
	},
	overlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		alignItems: "center",
		justifyContent: "center",
	},
	overlayScanner: {
		width: 300,
		height: 300,
		borderRadius: 24,
		borderColor: "white",
		borderWidth: 2,
	},
	iconWrapper: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(0,0,0,0.5)",
	},
	bottomSheetContentContainer: {
		padding: 0,
	},
	zoomSliderWrapper: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: Spacings.md,
		paddingTop: Spacings.md,
	},
	headerWrapper: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		columnGap: Spacings.xs,
		width: "100%",
		paddingHorizontal: Spacings.md,
	},
	tabsList: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-around",
		backgroundColor: "rgba(0,0,0,0.5)",
		borderRadius: 24,
		padding: Spacings.xs,
		flex: 1,
		// borderWidth: 4,
		// borderColor: Colors.slate["800"],
	},
	tabsTrigger: {
		textAlign: "center",
		paddingHorizontal: Spacings.md,
		paddingVertical: Spacings.sm,
		// backgroundColor: "red",
	},
	tabsTriggerSelected: {
		borderRadius: 24,
		backgroundColor: Colors.white,
	},
	tabsTriggerText: {
		textAlign: "center",
		fontSize: 14,
	},
	tabsTriggerSelectedText: {
		color: Colors.black,
	},
});
