import { useRouter } from "expo-router";
import { type ComponentRef, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton } from "@/components/ui/IconButton";
import { StatusBar } from "@/components/ui/StatusBar";
import { Text } from "@/components/ui/Text";
import { pageUris } from "@/services/documents";
import useLibrary from "@/stores/library";
import { makeStyles, useTheme } from "@/theme";
import { ZoomablePage } from "./components/ZoomablePage";

/**
 * A document's pages full screen, one at a time: swipe between them, pinch
 * or double tap to zoom in.
 */
export function PageViewerScreen({ id, page }: { id: string; page: number }) {
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { width, height } = useWindowDimensions();
	const item = useLibrary((state) => state.items[id]);
	const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
	const [current, setCurrent] = useState(page);
	const [zoomed, setZoomed] = useState(false);

	const pages = item?.kind === "doc" ? pageUris(item) : [];
	const close = () =>
		router.canGoBack() ? router.back() : router.replace("/");

	return (
		<View style={styles.screen}>
			<StatusBar style="light" />
			<ScrollView
				ref={scroller}
				horizontal
				pagingEnabled
				scrollEnabled={!zoomed && pages.length > 1}
				showsHorizontalScrollIndicator={false}
				onLayout={() =>
					// The page it opened on, then whichever is showing (after a turn).
					scroller.current?.scrollTo({ x: current * width, animated: false })
				}
				onMomentumScrollEnd={(event) =>
					setCurrent(Math.round(event.nativeEvent.contentOffset.x / width))
				}
			>
				{pages.map((uri, index) => (
					<ZoomablePage
						key={uri}
						uri={uri}
						width={width}
						height={height}
						zoomed={zoomed && index === current}
						onZoomChange={setZoomed}
						accessibilityLabel={t("app.document.page_of", {
							page: index + 1,
							count: pages.length,
						})}
					/>
				))}
			</ScrollView>
			<View
				pointerEvents="box-none"
				style={[styles.bar, { paddingTop: insets.top + 6 }]}
			>
				<IconButton
					icon="close"
					variant="glass"
					accessibilityLabel={t("app.common.close")}
					onPress={close}
				/>
				{pages.length > 1 && (
					<View style={styles.counter}>
						<Text size={13} mono color={colors.white}>
							{Math.min(current, pages.length - 1) + 1} / {pages.length}
						</Text>
					</View>
				)}
			</View>
		</View>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	screen: { flex: 1, backgroundColor: colors.feed },
	bar: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
	},
	counter: {
		height: 32,
		paddingHorizontal: 12,
		borderRadius: 16,
		justifyContent: "center",
		backgroundColor: colors.scrim,
	},
}));
