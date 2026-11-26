import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { type ComponentRef, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
	Extrapolation,
	interpolate,
	interpolateColor,
	type SharedValue,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";
import { Button, ButtonGrid, gridCell } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { IconButton } from "@/components/ui/IconButton";
import { Pressable } from "@/components/ui/Pressable";
import { StatusBar } from "@/components/ui/StatusBar";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { useFolderPicker } from "@/features/library/useFolderPicker";
import {
	shareItem,
	useLibraryActions,
} from "@/features/library/useLibraryActions";
import useLibrary, { catalogueNumber, type DocItem } from "@/stores/library";
import {
	makeStyles,
	useScreenInsets,
	useSharedStyles,
	useTheme,
} from "@/theme";
import { enter } from "@/theme/motion";
import { attempt } from "@/utils/attempt";
import { format } from "@/utils/date";
import { exportDocument } from "@/utils/documentFiles";
import { niceBytes } from "@/utils/fileSize";

export { ErrorScreen as ErrorBoundary } from "@/components/ui/ErrorScreen";

const GAP = 16;
const RATIO = 400 / 283;

function Page({
	uri,
	index,
	count,
	scroll,
	step,
	width,
	height,
	onPress,
}: {
	uri: string;
	index: number;
	count: number;
	scroll: SharedValue<number>;
	step: number;
	width: number;
	height: number;
	onPress: () => void;
}) {
	const styles = useStyles();
	const { t } = useTranslation();
	// `.d-page`: the current page is full size, the others shrink and fade.
	const style = useAnimatedStyle(() => {
		const distance = Math.min(1, Math.abs(scroll.get() / step - index));
		return {
			opacity: interpolate(distance, [0, 1], [1, 0.55], Extrapolation.CLAMP),
			transform: [
				{ scale: interpolate(distance, [0, 1], [1, 0.9], Extrapolation.CLAMP) },
			],
		};
	});
	return (
		<Animated.View entering={enter.lift(index * 60)}>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={t("app.document.page_of", {
					page: index + 1,
					count,
				})}
				pressedScale={1}
				onPress={onPress}
			>
				<Animated.View style={[styles.page, { width, height }, style]}>
					<View style={styles.pageClip}>
						<Image
							source={uri}
							style={StyleSheet.absoluteFill}
							contentFit="cover"
							transition={150}
						/>
					</View>
				</Animated.View>
			</Pressable>
		</Animated.View>
	);
}

function Dot({
	index,
	scroll,
	step,
	onPress,
}: {
	index: number;
	scroll: SharedValue<number>;
	step: number;
	onPress: () => void;
}) {
	const { colors } = useTheme();
	const styles = useStyles();
	const style = useAnimatedStyle(() => {
		const distance = Math.min(1, Math.abs(scroll.get() / step - index));
		return {
			width: interpolate(distance, [0, 1], [18, 6], Extrapolation.CLAMP),
			backgroundColor: interpolateColor(
				distance,
				[0, 1],
				[colors.ink, colors.dashed],
			),
		};
	});
	return (
		<Pressable onPress={onPress} pressedScale={1} style={styles.dotHit}>
			<Animated.View style={[styles.dot, style]} />
		</Pressable>
	);
}

function Chip({ label }: { label: string }) {
	const shared = useSharedStyles();
	return (
		<View style={shared.chip}>
			<Text size={12} mono>
				{label}
			</Text>
		</View>
	);
}

export default function DocumentScreen() {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { id } = useLocalSearchParams<{ id: string }>();
	const { t } = useTranslation();
	const router = useRouter();
	const edges = useScreenInsets();
	const { width } = useWindowDimensions();
	const item = useLibrary((state) => state.items[id]);
	const moveItem = useLibrary((state) => state.moveItem);
	const actions = useLibraryActions({ onDeleted: () => router.back() });
	const folderPicker = useFolderPicker();
	const [area, setArea] = useState(0);
	const [current, setCurrent] = useState(0);
	const scroll = useSharedValue(0);
	const track = useAnimatedScrollHandler({
		onScroll: (event) => scroll.set(event.contentOffset.x),
	});
	const scroller = useRef<ComponentRef<typeof Animated.ScrollView>>(null);

	if (item?.kind !== "doc") {
		return (
			<View style={shared.screen}>
				<Header />
				{actions.element}
			</View>
		);
	}
	const doc: DocItem = item;

	// Pages are 283×400 on a 390pt screen; shrink them if the screen is short.
	const pageHeight = Math.min(width * 0.726 * RATIO, Math.max(area - 70, 200));
	const pageWidth = pageHeight / RATIO;
	const step = pageWidth + GAP;
	const inset = (width - pageWidth) / 2;

	const goTo = (index: number) => {
		scroller.current?.scrollTo({ x: index * step, animated: true });
		setCurrent(index);
	};

	return (
		<View style={shared.screen}>
			<StatusBar />
			<Header
				right={
					<IconButton
						icon="more"
						accessibilityLabel={t("app.common.more")}
						onPress={() => actions.openItem(doc)}
					/>
				}
			/>

			<View
				style={[styles.carousel, { paddingTop: edges.header }]}
				onLayout={(event) => setArea(event.nativeEvent.layout.height)}
			>
				{area > 0 && (
					<>
						<Animated.ScrollView
							ref={scroller}
							horizontal
							showsHorizontalScrollIndicator={false}
							decelerationRate="fast"
							snapToInterval={step}
							onScroll={track}
							scrollEventThrottle={16}
							onMomentumScrollEnd={(event) =>
								setCurrent(Math.round(event.nativeEvent.contentOffset.x / step))
							}
							style={{ flexGrow: 0 }}
							contentContainerStyle={{
								paddingHorizontal: inset,
								paddingVertical: 30,
								gap: GAP,
							}}
						>
							{doc.pages.map((uri, index) => (
								<Page
									key={uri}
									uri={uri}
									index={index}
									count={doc.pages.length}
									scroll={scroll}
									step={step}
									width={pageWidth}
									height={pageHeight}
									onPress={() => goTo(index)}
								/>
							))}
						</Animated.ScrollView>
						{doc.pages.length > 1 && (
							<View style={styles.pager}>
								<View style={styles.dots}>
									{doc.pages.map((uri, index) => (
										<Dot
											key={uri}
											index={index}
											scroll={scroll}
											step={step}
											onPress={() => goTo(index)}
										/>
									))}
								</View>
								<Text size={12} mono color={colors.muted}>
									{current + 1} / {doc.pages.length}
								</Text>
							</View>
						)}
					</>
				)}
			</View>

			<Animated.View entering={enter.up(200)} style={styles.titles}>
				<Text size={12} mono color={colors.muted}>
					{catalogueNumber(doc)} · {t("app.library.document").toUpperCase()} ·{" "}
					{t("app.document.scanned_on", {
						date: format(doc.createdAt, "d MMM yyyy"),
					}).toUpperCase()}
				</Text>
				<Text
					size={26}
					weight="semibold"
					tracking={-0.02}
					numberOfLines={2}
					selectable
				>
					{doc.name}
				</Text>
				<View style={styles.chips}>
					<Chip
						label={t("app.document.pages", {
							count: doc.pages.length,
						}).toUpperCase()}
					/>
					<Chip label={niceBytes(doc.size).toUpperCase()} />
					<Chip label={doc.pdfUri ? "PDF" : "JPG"} />
				</View>
			</Animated.View>

			<Animated.View
				entering={enter.up(280)}
				style={[styles.actions, { paddingBottom: edges.bottom }]}
			>
				<Button
					icon="share"
					label={t(doc.pdfUri ? "app.document.share_pdf" : "app.common.share")}
					onPress={() => shareItem(doc).catch(console.error)}
				/>
				<ButtonGrid>
					<Button
						variant="secondary"
						icon="download"
						label={t("app.document.save_to_files")}
						onPress={async () => {
							const result = await attempt(() => exportDocument(doc));
							if (result.ok) toast(t("app.document.saved"));
						}}
						style={gridCell}
					/>
					<Button
						variant="secondary"
						icon="folder"
						label={t("app.library.move_to_folder")}
						onPress={() =>
							folderPicker.open({
								current: doc.folderId,
								onPick: (folderId) => {
									moveItem(doc.id, folderId);
									toast(t("app.library.moved"));
								},
							})
						}
						style={gridCell}
					/>
				</ButtonGrid>
			</Animated.View>
			{actions.element}
			{folderPicker.element}
		</View>
	);
}

const useStyles = makeStyles(({ colors, shadows }) => ({
	carousel: { flex: 1, justifyContent: "center" },
	page: {
		borderRadius: 6,
		backgroundColor: colors.surface,
		boxShadow: shadows.raised,
	},
	pageClip: { flex: 1, borderRadius: 6, overflow: "hidden" },
	pager: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 12,
		marginTop: -16,
	},
	dots: { flexDirection: "row", gap: 2 },
	dotHit: {
		width: 22,
		height: 44,
		alignItems: "center",
		justifyContent: "center",
	},
	dot: { height: 6, borderRadius: 3 },
	titles: { paddingTop: 8, paddingHorizontal: 20, gap: 6 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
	actions: { paddingTop: 18, paddingHorizontal: 16, gap: 10 },
}));
