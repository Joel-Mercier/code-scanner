import { CameraView, useCameraPermissions } from "expo-camera";
import { useIsFocused, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { GestureDetector, usePinchGesture } from "react-native-gesture-handler";
import Animated, {
	useAnimatedProps,
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton } from "@/components/ui/IconButton";
import { StatusBar } from "@/components/ui/StatusBar";
import { scannableFormats } from "@/domain/codes/formats";
import { makeStyles, SCREEN_GAP, useSharedStyles, useTheme } from "@/theme";
import { enter } from "@/theme/motion";
import { BottomBar, SHUTTER } from "./components/BottomBar";
import { CameraPermission } from "./components/CameraPermission";
import { DocsIntro } from "./components/DocsIntro";
import { FeedBackdrop, FeedCorners, StatusPill } from "./components/FeedChrome";
import { ModeTabs } from "./components/ModeTabs";
import { RECENT_GAP, RecentItems } from "./components/RecentItems";
import { Viewfinder } from "./components/Viewfinder";
import { useCodeScanner } from "./hooks/useCodeScanner";
import { useDocumentScanner } from "./hooks/useDocumentScanner";
import { useModeSwitch } from "./hooks/useModeSwitch";

const AnimatedCameraView = Animated.createAnimatedComponent(CameraView);

const FEED_RADIUS = 32;
const SIDE = 20;

/**
 * Home: the camera feed (codes) or the document scanner (docs), the latest
 * captures, and the way to the collection and the workshop.
 */
export function ScannerScreen() {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { width, height } = useWindowDimensions();
	const focused = useIsFocused();
	const [permission, requestPermission] = useCameraPermissions();
	const [torch, setTorch] = useState(false);

	const openCapture = (id: string) =>
		router.push({ pathname: "/capture/[id]", params: { id } });
	const codeScanner = useCodeScanner(openCapture);
	const docScanner = useDocumentScanner(openCapture);
	const { mode, moving, progress, changeMode, swipe } = useModeSwitch(() =>
		setTorch(false),
	);

	const zoom = useSharedValue(0);
	const cameraProps = useAnimatedProps(() => ({ zoom: zoom.get() }));
	const pinch = usePinchGesture({
		onUpdate: (event) => {
			zoom.set(
				Math.min(1, Math.max(0, zoom.get() + (event.scaleChange - 1) * 0.7)),
			);
		},
	});

	const docsLayer = useAnimatedStyle(() => ({
		transform: [{ translateX: (1 - progress.get()) * width }],
	}));

	// The feed takes what the recent row and the bottom bar leave.
	const tile = (width - SIDE * 2 - RECENT_GAP * 2) / 3;
	const below =
		20 + 32 + 12 + tile + 8 + 14 + 16 + SHUTTER + SCREEN_GAP + insets.bottom;
	const feedHeight = Math.max(360, height - below);

	const codes = mode === "codes";
	const cameraReady = !!permission?.granted;
	// Both modes stay drawn while swiping or sliding between them.
	const showCodes = codes || moving;
	const showDocs = !codes || moving;

	return (
		<View style={shared.screen}>
			<StatusBar style={codes ? "light" : undefined} />

			<GestureDetector gesture={swipe}>
				<View
					style={[
						styles.feed,
						{ height: feedHeight, backgroundColor: colors.feed },
					]}
				>
					{showCodes && (
						<>
							<FeedBackdrop width={width} height={feedHeight} />
							{focused && cameraReady && (
								<GestureDetector gesture={pinch}>
									<View style={StyleSheet.absoluteFill}>
										<AnimatedCameraView
											style={StyleSheet.absoluteFill}
											active={!docScanner.scanning}
											facing="back"
											enableTorch={torch}
											animatedProps={cameraProps}
											barcodeScannerSettings={{
												barcodeTypes: scannableFormats,
											}}
											onBarcodeScanned={codeScanner.onBarcodeScanned}
										/>
										<Viewfinder
											width={width}
											height={feedHeight}
											lock={codeScanner.lock}
											quad={codeScanner.quad}
										/>
									</View>
								</GestureDetector>
							)}
							{cameraReady ? (
								<Animated.View
									entering={enter.up(200)}
									pointerEvents="none"
									style={styles.status}
								>
									<StatusPill label={t("app.scan.hint")} />
								</Animated.View>
							) : (
								permission && (
									<CameraPermission
										top={insets.top + 90}
										onRequest={requestPermission}
									/>
								)
							)}
						</>
					)}

					<Animated.View
						pointerEvents="none"
						style={[styles.docsLayer, docsLayer]}
					>
						{showDocs && <DocsIntro top={insets.top + 74} />}
					</Animated.View>

					<View style={[styles.header, { paddingTop: insets.top + 6 }]}>
						<IconButton
							icon="settings"
							variant={codes ? "glass" : "solid"}
							accessibilityLabel={t("app.settings.title")}
							onPress={() => router.push("/settings")}
						/>
						<ModeTabs mode={mode} progress={progress} onChange={changeMode} />
						{codes ? (
							<IconButton
								icon="torch"
								variant="glass"
								iconColor={torch ? colors.white : undefined}
								accessibilityLabel={t("app.scan.torch")}
								disabled={!cameraReady}
								onPress={() => setTorch((on) => !on)}
								style={torch && styles.torchOn}
							/>
						) : (
							<View style={styles.spacer} />
						)}
					</View>

					{showCodes && <FeedCorners width={width} radius={FEED_RADIUS} />}
				</View>
			</GestureDetector>

			<RecentItems mode={mode} tile={tile} />

			<BottomBar
				mode={mode}
				busy={docScanner.scanning}
				onShutter={codes ? codeScanner.scanFromGallery : docScanner.scan}
			/>
		</View>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	feed: {
		borderBottomLeftRadius: FEED_RADIUS,
		borderBottomRightRadius: FEED_RADIUS,
		overflow: "hidden",
	},
	header: {
		position: "absolute",
		left: 0,
		right: 0,
		top: 0,
		paddingHorizontal: 16,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	torchOn: { backgroundColor: colors.accent },
	spacer: { width: 46, height: 46 },
	status: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 22,
		alignItems: "center",
	},
	docsLayer: { ...StyleSheet.absoluteFill, backgroundColor: colors.sunken },
}));
