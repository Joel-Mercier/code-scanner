import { ScannerBottomSheetContent } from "@/components/ScannerBottomSheetContent";
import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import { useBottomSheetBackHandler } from "@/hooks/useBottomSheetBackHandler";
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
import * as MediaLibrary from "expo-media-library";
import { useNavigation, useRouter } from "expo-router";
import {
	Camera,
	Flashlight,
	FlashlightOff,
	List,
	PlusCircle,
	QrCode,
	RefreshCcw,
	Scan,
	Settings,
	Slash,
	ZoomIn,
	ZoomOut,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
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
	const screenWidth = Dimensions.get("window").width;
	const screenHeight = Dimensions.get("window").height;
	const sliderOffset = useSharedValue(0.0001);
	const cameraIconRotation = useSharedValue(0);
	const MAX_VALUE = screenWidth - Spacings.lg * 4 - 48;
	const THUMB_RADIUS = 16;

	useEffect(() => {
		if (!cameraPermission?.granted) {
			requestCameraPermission();
		}
		sliderOffset.value = 0;
	}, []);

	const handleBarcodeScanned = (scanningResult: BarcodeScanningResult) => {
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

	const sliderPanGesture = Gesture.Pan().onChange((event) => {
		sliderOffset.value = Math.max(
			0,
			Math.min(MAX_VALUE, sliderOffset.value + event.changeX),
		);
	});

	const rangeStyle = useAnimatedStyle(() => {
		return {
			width: `${(sliderOffset.value / MAX_VALUE) * 100}%`,
		};
	});

	const thumbStyle = useAnimatedStyle(() => {
		return {
			left: `${((sliderOffset.value - THUMB_RADIUS) / MAX_VALUE) * 100}%`,
		};
	});

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
										width={screenWidth}
										height={screenHeight}
										color="white"
									/>
									<RoundedRect
										x={screenWidth / 2 - screenWidth / 2 / 2}
										y={screenHeight / 2 - screenWidth / 2 / 2}
										width={screenWidth / 2}
										height={screenWidth / 2}
										r={24}
										color="black"
									/>
								</Group>
							}
						>
							<Rect
								x={0}
								y={0}
								width={screenWidth}
								height={screenHeight}
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
							<FlashlightOff color={Colors.white} size={24} />
						) : (
							<Flashlight color={Colors.white} size={24} />
						)}
					</Pressable>
					<Pressable
						style={({ pressed }) => [
							pressed && {
								backgroundColor: Colors.darkBackgroundPressed,
								opacity: 0.75,
							},
							styles.iconWrapper,
							{ marginBottom: Spacings.md },
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
				</View>
				<View
					style={{
						position: "absolute",
						left: Spacings.lg,
						right: Spacings.lg,
						bottom: Spacings.xl,
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<ZoomOut
						color={Colors.white}
						size={24}
						style={{ marginRight: Spacings.lg }}
					/>
					<View
						style={{
							height: 4,
							width: MAX_VALUE,
						}}
					>
						<View
							style={{
								height: "100%",
								backgroundColor: "rgba(255,255,255,0.5)",
							}}
						>
							<Animated.View
								style={[
									{
										// width: `${zoom}%`,
										backgroundColor: Colors.white,
										height: "100%",
									},
									rangeStyle,
								]}
							/>
							<GestureDetector gesture={sliderPanGesture}>
								<Animated.View
									style={[
										{
											width: 32,
											height: 32,
											borderRadius: 16,
											bottom: 18,
											// backgroundColor: "red",
											alignItems: "center",
											justifyContent: "center",
										},
										thumbStyle,
									]}
								>
									<View
										style={{
											width: 16,
											height: 16,
											borderRadius: 8,
											backgroundColor: Colors.white,
										}}
									/>
								</Animated.View>
							</GestureDetector>
						</View>
					</View>
					<ZoomIn
						color={Colors.white}
						size={24}
						style={{ marginLeft: Spacings.lg }}
					/>
				</View>
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
		padding: 24,
		flexDirection: "row",
		justifyContent: "space-between",
	},
	overlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		// backgroundColor: "rgba(0,0,0,0.65)",
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
		// backgroundColor: Colors.darkBackground,
		alignItems: "center",
		justifyContent: "center",
		// borderWidth: StyleSheet.hairlineWidth,
		// borderColor: Colors.white,
	},
	bottomSheetContentContainer: {
		padding: 0,
	},
});
