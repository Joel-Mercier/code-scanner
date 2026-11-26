import {
	type BarcodeScanningResult,
	type BarcodeType,
	CameraView,
	scanFromURLAsync,
	useCameraPermissions,
} from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useIsFocused, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import {
	GestureDetector,
	usePanGesture,
	usePinchGesture,
} from "react-native-gesture-handler";
import Animated, {
	useAnimatedProps,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Pressable } from "@/components/ui/Pressable";
import { StatusBar } from "@/components/ui/StatusBar";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { ItemTile, isNew } from "@/features/library/ItemTile";
import {
	FeedBackdrop,
	FeedCorners,
	StatusPill,
} from "@/features/scan/FeedChrome";
import { PaperStack } from "@/features/scan/PaperStack";
import { type Quad, Viewfinder } from "@/features/scan/Viewfinder";
import useLibrary, { sortByRecent } from "@/stores/library";
import {
	makeStyles,
	radii,
	SCREEN_GAP,
	useSharedStyles,
	useTheme,
} from "@/theme";
import { ease, easeOut, enter } from "@/theme/motion";
import { attempt } from "@/utils/attempt";
import { normalizeBarcodeType } from "@/utils/barcodeType";
import { format } from "@/utils/date";
import { persistScan } from "@/utils/documentFiles";
import { haptics } from "@/utils/haptics";
import { createId } from "@/utils/id";

export { ErrorScreen as ErrorBoundary } from "@/components/ui/ErrorScreen";

const AnimatedCameraView = Animated.createAnimatedComponent(CameraView);

type Mode = "codes" | "docs";

const RESCAN_COOLDOWN = 2500;
/** A flick this fast (pt/s) switches modes, however short. */
const FLICK = 500;
const FEED_RADIUS = 32;
const GRID_GAP = 12;
const SIDE = 20;

const BARCODE_TYPES: BarcodeType[] = [
	"qr",
	"aztec",
	"codabar",
	"code128",
	"code39",
	"code93",
	"datamatrix",
	"ean13",
	"ean8",
	"itf14",
	"pdf417",
	"upc_a",
	"upc_e",
];

/** Opens the system document scanner and copies the result out of the cache. */
const captureDocument = async () => {
	const scan = await CameraView.scanDocumentAsync({
		requestPdf: true,
		quality: 0.9,
	});
	if (!scan?.pages.length) return null;
	const id = createId();
	return { id, files: await persistScan(id, scan) };
};

export default function HomeScreen() {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { width, height } = useWindowDimensions();
	const focused = useIsFocused();
	const [permission, requestPermission] = useCameraPermissions();
	const [mode, setMode] = useState<Mode>("codes");
	/** Both modes stay drawn while swiping or sliding between them. */
	const [moving, setMoving] = useState(false);
	/** 0: codes, 1: docs. Follows the finger while swiping. */
	const progress = useSharedValue(0);
	const dragStart = useSharedValue(0);
	const [torch, setTorch] = useState(false);
	const [scanningDoc, setScanningDoc] = useState(false);
	const items = useLibrary((state) => state.items);
	const addCode = useLibrary((state) => state.addCode);
	const addDocument = useLibrary((state) => state.addDocument);

	const locked = useRef(false);
	const lastScan = useRef({ data: "", at: 0 });
	const lock = useSharedValue(0);
	const quad = useSharedValue<Quad>([0, 0, 0, 0, 0, 0, 0, 0]);
	const zoom = useSharedValue(0);

	const cameraProps = useAnimatedProps(() => ({ zoom: zoom.get() }));
	const pinch = usePinchGesture({
		onUpdate: (event) => {
			zoom.set(
				Math.min(1, Math.max(0, zoom.get() + (event.scaleChange - 1) * 0.7)),
			);
		},
	});

	// Back from a capture: release the reticle and accept new codes.
	useFocusEffect(
		useCallback(() => {
			lock.set(withTiming(0, ease));
			lastScan.current.at = Date.now();
			const timer = setTimeout(() => {
				locked.current = false;
			}, 400);
			return () => clearTimeout(timer);
		}, [lock]),
	);

	const all = sortByRecent(Object.values(items));
	const newestId = all[0] && isNew(all[0]) ? all[0].id : null;
	const recent = all
		.filter((item) =>
			mode === "codes" ? item.kind === "code" : item.kind === "doc",
		)
		.slice(0, 3);

	const tile = (width - SIDE * 2 - GRID_GAP * 2) / 3;
	const below =
		20 + 32 + 12 + tile + 8 + 14 + 16 + 74 + SCREEN_GAP + insets.bottom;
	const feedHeight = Math.max(360, height - below);

	const openCapture = (id: string) =>
		router.push({ pathname: "/capture/[id]", params: { id } });

	const capture = (scan: BarcodeScanningResult, delay: number) => {
		const item = addCode({
			source: "scanner",
			format: normalizeBarcodeType(scan.type),
			data: scan.data,
		});
		haptics.success();
		setTimeout(() => openCapture(item.id), delay);
	};

	const onBarcodeScanned = (scan: BarcodeScanningResult) => {
		if (locked.current || !scan.data) return;
		const now = Date.now();
		if (
			scan.data === lastScan.current.data &&
			now - lastScan.current.at < RESCAN_COOLDOWN
		) {
			return;
		}
		locked.current = true;
		lastScan.current = { data: scan.data, at: now };

		const points = scan.cornerPoints ?? [];
		const { origin, size } = scan.bounds;
		quad.set(
			points.length === 4
				? [
						points[0].x,
						points[0].y,
						points[1].x,
						points[1].y,
						points[2].x,
						points[2].y,
						points[3].x,
						points[3].y,
					]
				: [
						origin.x,
						origin.y,
						origin.x + size.width,
						origin.y,
						origin.x + size.width,
						origin.y + size.height,
						origin.x,
						origin.y + size.height,
					],
		);
		lock.set(withTiming(1, { duration: 320, easing: easeOut }));
		capture(scan, 420);
	};

	const scanFromGallery = async () => {
		const picked = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			quality: 1,
		});
		if (picked.canceled) return;
		const [found] = await scanFromURLAsync(picked.assets[0].uri);
		if (!found) {
			haptics.warning();
			toast(t("app.scan.no_code_in_image"), "warning");
			return;
		}
		locked.current = true;
		capture(found, 0);
	};

	const scanDocument = async () => {
		if (!CameraView.isDocumentScannerAvailable) {
			toast(t("app.scan.doc_scanner_unavailable"), "warning");
			return;
		}
		setScanningDoc(true);
		const result = await attempt(captureDocument);
		setScanningDoc(false);
		if (!result.ok) {
			toast(t("app.scan.doc_scan_failed"), "warning");
			return;
		}
		if (!result.value) return;
		const { id, files } = result.value;
		addDocument({
			id,
			name: t("app.scan.document_name", {
				date: format(Date.now(), "d MMM, HH:mm"),
			}),
			...files,
		});
		haptics.success();
		openCapture(id);
	};

	const settle = (next: Mode) => {
		if (next !== mode) {
			haptics.select();
			setMode(next);
			setTorch(false);
		}
	};

	const changeMode = (next: Mode) => {
		if (next === mode) return;
		setMoving(true);
		settle(next);
		progress.set(
			withTiming(next === "docs" ? 1 : 0, ease, (finished) => {
				if (finished) scheduleOnRN(setMoving, false);
			}),
		);
	};

	// Swipe left for documents, right for codes.
	const swipe = usePanGesture({
		activeOffsetX: [-14, 14],
		failOffsetY: [-14, 14],
		maxPointers: 1,
		onActivate: () => {
			dragStart.set(progress.get());
			scheduleOnRN(setMoving, true);
		},
		onUpdate: (event) => {
			progress.set(
				Math.min(1, Math.max(0, dragStart.get() - event.translationX / width)),
			);
		},
		onDeactivate: (event) => {
			const target =
				event.velocityX < -FLICK
					? 1
					: event.velocityX > FLICK
						? 0
						: Math.round(progress.get());
			scheduleOnRN(settle, target === 1 ? "docs" : "codes");
			progress.set(
				withTiming(target, ease, (finished) => {
					if (finished) scheduleOnRN(setMoving, false);
				}),
			);
		},
	});

	const docsLayer = useAnimatedStyle(() => ({
		transform: [{ translateX: (1 - progress.get()) * width }],
	}));
	const codesLine = useAnimatedStyle(() => ({ opacity: 1 - progress.get() }));
	const docsLine = useAnimatedStyle(() => ({ opacity: progress.get() }));

	const codes = mode === "codes";
	const cameraReady = !!permission?.granted;
	const onCamera = codes;
	const showCodes = codes || moving;
	const showDocs = !codes || moving;

	return (
		<View style={shared.screen}>
			<StatusBar style={onCamera ? "light" : undefined} />

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
							{focused && cameraReady && showCodes && (
								<GestureDetector gesture={pinch}>
									<View style={StyleSheet.absoluteFill}>
										<AnimatedCameraView
											style={StyleSheet.absoluteFill}
											active={!scanningDoc}
											facing="back"
											enableTorch={torch}
											animatedProps={cameraProps}
											barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
											onBarcodeScanned={onBarcodeScanned}
										/>
										<Viewfinder
											width={width}
											height={feedHeight}
											lock={lock}
											quad={quad}
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
									<Animated.View
										entering={enter.up(150)}
										style={[styles.permission, { top: insets.top + 90 }]}
									>
										<View style={styles.permissionIcon}>
											<Icon name="camera" size={22} color={colors.glassInk} />
										</View>
										<Text
											size={22}
											weight="semibold"
											tracking={-0.02}
											color={colors.white}
											align="center"
										>
											{t("app.scan.camera_permission_title")}
										</Text>
										<Text
											size={15}
											leading={1.45}
											color="rgba(255,255,255,0.78)"
											align="center"
										>
											{t("app.scan.camera_permission_body")}
										</Text>
										<Button
											label={t("app.scan.allow_camera")}
											onPress={requestPermission}
											style={styles.permissionButton}
										/>
									</Animated.View>
								)
							)}
						</>
					)}

					<Animated.View
						pointerEvents="none"
						style={[styles.docsLayer, docsLayer]}
					>
						{showDocs && (
							<>
								<View style={[styles.stack, { top: insets.top + 74 }]}>
									<PaperStack />
								</View>
								<View style={styles.docsCopy}>
									<Animated.View entering={enter.up(250)}>
										<Text
											size={28}
											weight="semibold"
											tracking={-0.025}
											align="center"
										>
											{t("app.scan.docs_title")}
										</Text>
									</Animated.View>
									<Animated.View entering={enter.up(320)}>
										<Text
											size={15}
											leading={1.45}
											color={colors.muted}
											align="center"
										>
											{t("app.scan.docs_subtitle")}
										</Text>
									</Animated.View>
								</View>
							</>
						)}
					</Animated.View>

					<View style={[styles.header, { paddingTop: insets.top + 6 }]}>
						<IconButton
							icon="settings"
							variant={codes ? "glass" : "solid"}
							accessibilityLabel={t("app.settings.title")}
							onPress={() => router.push("/settings")}
						/>
						<View accessibilityRole="tablist" style={styles.modes}>
							{(["codes", "docs"] as const).map((value) => {
								const active = value === mode;
								const color = codes
									? active
										? colors.white
										: "rgba(255,255,255,0.78)"
									: active
										? colors.ink
										: colors.muted;
								return (
									<Pressable
										key={value}
										accessibilityRole="tab"
										accessibilityState={{ selected: active }}
										onPress={() => changeMode(value)}
										style={styles.mode}
									>
										<Text
											size={16}
											weight={active ? "semibold" : "medium"}
											color={color}
										>
											{t(`app.scan.${value}`)}
										</Text>
										<Animated.View
											style={[
												styles.modeLine,
												{ backgroundColor: codes ? colors.white : colors.ink },
												value === "codes" ? codesLine : docsLine,
											]}
										/>
									</Pressable>
								);
							})}
						</View>
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

			<View style={styles.recent}>
				<View style={styles.recentHeader}>
					<Text size={15} weight="semibold">
						{t(codes ? "app.home.recent" : "app.home.recent_documents")}
					</Text>
					<Pressable
						accessibilityRole="link"
						onPress={() => router.push("/library")}
						style={styles.collectionLink}
					>
						<Text size={14} color={colors.muted}>
							{t("app.home.collection_count", { count: all.length })}
						</Text>
						<Icon name="chevronRight" size={16} color={colors.muted} />
					</Pressable>
				</View>
				<View style={styles.grid}>
					{recent.map((item, index) => (
						<ItemTile
							key={`${mode}-${item.id}`}
							item={item}
							size={tile}
							caption="short"
							showNew={item.id === newestId}
							delay={50 + index * 70}
							onPress={() =>
								router.push(
									item.kind === "doc"
										? { pathname: "/document/[id]", params: { id: item.id } }
										: { pathname: "/code/[id]", params: { id: item.id } },
								)
							}
						/>
					))}
					{Array.from({ length: 3 - recent.length }, (_, index) => (
						<Animated.View
							key={`empty-${mode}-${index}`}
							entering={enter.fade(80 * index)}
							style={[
								shared.dashed,
								shared.center,
								styles.placeholder,
								{ width: tile, height: tile },
							]}
						>
							{index === 0 && recent.length === 0 && (
								<Text size={11} mono color={colors.muted} align="center">
									{t(codes ? "app.home.empty_codes" : "app.home.empty_docs")}
								</Text>
							)}
						</Animated.View>
					))}
				</View>
			</View>

			<View
				style={[styles.nav, { paddingBottom: insets.bottom + SCREEN_GAP }]}
				accessibilityRole="toolbar"
			>
				<IconButton
					icon="grid"
					size={52}
					iconSize={21}
					accessibilityLabel={t("app.library.title")}
					onPress={() => router.push("/library")}
					style={styles.navStart}
				/>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={t(
						codes ? "app.scan.from_gallery" : "app.scan.scan_document",
					)}
					disabled={scanningDoc}
					haptic
					pressedScale={0.94}
					onPress={codes ? scanFromGallery : scanDocument}
					style={styles.shutter}
				>
					<View style={styles.shutterFace}>
						<Icon
							name={codes ? "imagePlus" : "scan"}
							size={24}
							color={colors.canvas}
						/>
					</View>
				</Pressable>
				<IconButton
					icon="plus"
					size={52}
					iconSize={21}
					accessibilityLabel={t("app.create.title")}
					onPress={() => router.push("/create")}
					style={styles.navEnd}
				/>
			</View>
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
	modes: { flexDirection: "row", gap: 6 },
	mode: {
		height: 44,
		paddingHorizontal: 12,
		alignItems: "center",
		justifyContent: "center",
		gap: 5,
	},
	modeLine: { width: 18, height: 2, borderRadius: 1 },
	status: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 22,
		alignItems: "center",
	},
	permission: {
		position: "absolute",
		left: 28,
		right: 28,
		alignItems: "center",
		gap: 10,
	},
	permissionIcon: {
		width: 46,
		height: 46,
		borderRadius: 23,
		backgroundColor: "rgba(255,255,255,0.9)",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 6,
	},
	permissionButton: { alignSelf: "stretch", marginTop: 10 },
	docsLayer: { ...StyleSheet.absoluteFill, backgroundColor: colors.sunken },
	stack: { position: "absolute", left: 0, right: 0, alignItems: "center" },
	docsCopy: {
		position: "absolute",
		left: 24,
		right: 24,
		bottom: 32,
		gap: 8,
		alignItems: "center",
	},
	recent: { paddingTop: 20, paddingHorizontal: SIDE, gap: 12 },
	recentHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	collectionLink: {
		height: 32,
		flexDirection: "row",
		alignItems: "center",
		gap: 2,
	},
	grid: { flexDirection: "row", gap: GRID_GAP },
	placeholder: { borderRadius: radii.lg, padding: 10 },
	nav: {
		marginTop: "auto",
		paddingHorizontal: 28,
		flexDirection: "row",
		alignItems: "center",
	},
	navStart: { marginRight: "auto" },
	navEnd: { marginLeft: "auto" },
	shutter: {
		width: 74,
		height: 74,
		borderRadius: 37,
		borderWidth: 1.5,
		borderColor: colors.ink,
		alignItems: "center",
		justifyContent: "center",
	},
	shutterFace: {
		width: 62,
		height: 62,
		borderRadius: 31,
		backgroundColor: colors.ink,
		alignItems: "center",
		justifyContent: "center",
	},
}));
