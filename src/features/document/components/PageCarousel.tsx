import { Image } from "expo-image";
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
import { Pressable } from "@/components/ui/Pressable";
import { Text } from "@/components/ui/Text";
import { makeStyles, useTheme } from "@/theme";
import { enter } from "@/theme/motion";

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

/**
 * The pages side by side, snapping one at a time, with dots and a counter.
 * Fills the space it is given; pages shrink on short screens.
 */
export function PageCarousel({
	pages,
	paddingTop,
}: {
	pages: string[];
	paddingTop: number;
}) {
	const { colors } = useTheme();
	const styles = useStyles();
	const { width } = useWindowDimensions();
	const [area, setArea] = useState(0);
	const [current, setCurrent] = useState(0);
	const scroll = useSharedValue(0);
	const track = useAnimatedScrollHandler({
		onScroll: (event) => scroll.set(event.contentOffset.x),
	});
	const scroller = useRef<ComponentRef<typeof Animated.ScrollView>>(null);

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
		<View
			style={[styles.carousel, { paddingTop }]}
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
						style={styles.scroller}
						contentContainerStyle={{
							paddingHorizontal: inset,
							paddingVertical: 30,
							gap: GAP,
						}}
					>
						{pages.map((uri, index) => (
							<Page
								key={uri}
								uri={uri}
								index={index}
								count={pages.length}
								scroll={scroll}
								step={step}
								width={pageWidth}
								height={pageHeight}
								onPress={() => goTo(index)}
							/>
						))}
					</Animated.ScrollView>
					{pages.length > 1 && (
						<View style={styles.pager}>
							<View style={styles.dots}>
								{pages.map((uri, index) => (
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
								{current + 1} / {pages.length}
							</Text>
						</View>
					)}
				</>
			)}
		</View>
	);
}

const useStyles = makeStyles(({ colors, shadows }) => ({
	carousel: { flex: 1, justifyContent: "center" },
	scroller: { flexGrow: 0 },
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
}));
