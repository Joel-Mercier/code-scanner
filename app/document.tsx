import { DocumentBottomSheetContent } from "@/components/DocumentBottomSheetContent";
import { ThemedText } from "@/components/ui/ThemedText";
import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import { useBottomSheetBackHandler } from "@/hooks/useBottomSheetBackHandler";
import useDocuments from "@/stores/documents";
import {
	BottomSheetBackdrop,
	BottomSheetModal,
	BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { ArrowLeft, EllipsisVertical } from "lucide-react-native";
import React, { useRef } from "react";
import { Dimensions, Image, Pressable, StyleSheet, View } from "react-native";
import Animated, {
	Extrapolation,
	interpolate,
	type SharedValue,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const ITEM_WIDTH = width * 0.8;
const SPACER = (width - ITEM_WIDTH) / 2;

const Dot = ({
	index,
	animatedIndex,
}: { index: number; animatedIndex: SharedValue<number> }) => {
	const style = useAnimatedStyle(() => {
		const opacity = interpolate(
			animatedIndex.value,
			[index - 1, index, index + 1],
			[0.3, 1, 0.3],
			Extrapolation.CLAMP,
		);
		const scale = interpolate(
			animatedIndex.value,
			[index - 1, index, index + 1],
			[1, 1.4, 1],
			Extrapolation.CLAMP,
		);
		return { opacity, transform: [{ scale }] };
	});

	return (
		<Animated.View
			style={[
				{
					width: 10,
					height: 10,
					borderRadius: 5,
					marginHorizontal: 6,
					backgroundColor: Colors.white,
				},
				style,
			]}
		/>
	);
};

const RenderItem = ({
	item,
	index,
	animatedIndex,
	totalCount,
}: {
	item: string;
	index: number;
	animatedIndex: SharedValue<number>;
	totalCount: number;
}) => {
	const animatedStyle = useAnimatedStyle(() => {
		const scale = interpolate(
			animatedIndex.value,
			[index - 1, index, index + 1],
			[0.9, 1, 0.9],
			Extrapolation.CLAMP,
		);
		const translateY = interpolate(
			animatedIndex.value,
			[index - 1, index, index + 1],
			[10, 0, 10],
			Extrapolation.CLAMP,
		);
		return { transform: [{ scale }, { translateY }] };
	});

	return (
		<View
			style={{
				width: ITEM_WIDTH,
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<Animated.View
				style={[
					{
						width: ITEM_WIDTH,
						height: height * 0.72,
						borderRadius: Spacings.md,
						overflow: "hidden",
						backgroundColor: Colors.white,
					},
					animatedStyle,
				]}
			>
				<Image
					source={{ uri: item }}
					style={{ width: "100%", height: "100%" }}
					resizeMode="contain"
				/>
			</Animated.View>
			<ThemedText
				style={{
					marginTop: Spacings.md,
					textAlign: "center",
				}}
				numberOfLines={1}
			>
				Page {index + 1} / {totalCount}
			</ThemedText>
		</View>
	);
};

export default function Carousel() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const currentDocument = useDocuments.use.currentDocument();
	const pages = currentDocument?.pages ?? [];
	const hasMultiplePages = pages.length > 1;
	const bottomSheetModalRef = useRef<BottomSheetModal>(null);
	const { handleSheetPositionChange } =
		useBottomSheetBackHandler(bottomSheetModalRef);

	const scrollX = useSharedValue(0);
	const animatedIndex = useDerivedValue(() => scrollX.value / ITEM_WIDTH);

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			scrollX.value = event.contentOffset.x;
		},
	});

	return (
		<View
			style={[
				styles.container,
				{
					paddingTop: insets.top,
					paddingLeft: insets.left,
					paddingRight: insets.right,
				},
			]}
		>
			<View style={styles.headerContainer}>
				<Pressable
					onPress={() => router.back()}
					style={{ marginRight: Spacings.lg }}
				>
					<ArrowLeft size={24} color="white" />
				</Pressable>
				<ThemedText variant="title">{currentDocument?.name}</ThemedText>
				<Pressable
					onPress={() => {
						bottomSheetModalRef.current?.present();
					}}
					style={{ marginLeft: Spacings.lg }}
				>
					<EllipsisVertical size={24} color="white" />
				</Pressable>
			</View>
			<View style={{ flex: 1, justifyContent: "center" }}>
				<Animated.FlatList
					data={pages}
					horizontal
					showsHorizontalScrollIndicator={false}
					snapToInterval={ITEM_WIDTH}
					decelerationRate="fast"
					snapToAlignment="start"
					contentContainerStyle={{ paddingHorizontal: SPACER }}
					scrollEventThrottle={16}
					onScroll={scrollHandler}
					keyExtractor={(item) => item}
					renderItem={({ item, index }) => (
						<RenderItem
							item={item}
							index={index}
							animatedIndex={animatedIndex}
							totalCount={pages.length}
						/>
					)}
				/>
				<View
					style={{
						flexDirection: "row",
						justifyContent: "center",
						marginTop: Spacings.md,
						marginBottom: Spacings.md,
						paddingBottom: insets.bottom,
					}}
				>
					{pages.map((_, i) => (
						<Dot index={i} animatedIndex={animatedIndex} key={i} />
					))}
				</View>
			</View>
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
			>
				<BottomSheetView style={styles.bottomSheetContentContainer}>
					<DocumentBottomSheetContent
						bottomSheetModalRef={bottomSheetModalRef}
					/>
				</BottomSheetView>
			</BottomSheetModal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.darkBackground,
	},
	headerContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: Spacings.lg,
		paddingVertical: Spacings.md,
		paddingHorizontal: Spacings.md,
	},
	bottomSheetContentContainer: {
		padding: 0,
	},
});
