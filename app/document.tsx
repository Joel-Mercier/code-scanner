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
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, Image, Pressable, StyleSheet, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import type { ICarouselInstance } from "react-native-reanimated-carousel";
import Carousel, { Pagination } from "react-native-reanimated-carousel";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";

const width = Dimensions.get("window").width;

export default function DocumentScreen() {
	const [enableCarousel, setEnableCarousel] = useState(false);
	const { t } = useTranslation();
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const currentDocument = useDocuments.use.currentDocument();
	const bottomSheetModalRef = useRef<BottomSheetModal>(null);
	const carouselRef = useRef<ICarouselInstance>(null);
	const progress = useSharedValue<number>(0);
	const { handleSheetPositionChange } =
		useBottomSheetBackHandler(bottomSheetModalRef);

	const onPressPagination = (index: number) => {
		carouselRef.current?.scrollTo({
			count: index - progress.value,
			animated: true,
		});
	};

	useEffect(() => {
		if (carouselRef.current) {
			setEnableCarousel(true);
		}
	}, []);

	console.log("carousel enable", enableCarousel);
	return (
		<SafeAreaView style={styles.container}>
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
			{currentDocument?.pages && (
				<View
					style={{
						flex: 1,
						width: "100%",
						height: "100%",
						paddingBottom: insets.bottom,
					}}
				>
					<Carousel
						key={currentDocument?.pages?.length}
						ref={carouselRef}
						data={currentDocument?.pages}
						loop
						pagingEnabled
						snapEnabled
						onProgressChange={progress}
						mode={"horizontal-stack"}
						// style={{ backgroundColor: "red" }}
						modeConfig={{
							snapDirection: "left",
							stackInterval: 18,
						}}
						renderItem={({ item, index }) => {
							return (
								<View style={styles.slideContainer} key={item}>
									<Image
										source={{ uri: item }}
										resizeMode="contain"
										style={styles.slideImage}
									/>
									{currentDocument?.pages?.length &&
										currentDocument?.pages?.length > 1 && (
											<ThemedText variant="default">
												Page {index + 1}/{currentDocument?.pages?.length}
											</ThemedText>
										)}
								</View>
							);
						}}
					/>
					<Pagination.Basic
						progress={progress}
						data={currentDocument?.pages}
						dotStyle={{
							backgroundColor: `${Colors.white}cc`,
							borderRadius: 50,
						}}
						activeDotStyle={{
							backgroundColor: Colors.white,
						}}
						containerStyle={{
							gap: Spacings.sm,
							marginTop: Spacings.md,
						}}
						onPress={onPressPagination}
					/>
				</View>
			)}
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
						currentDocument={currentDocument}
						bottomSheetModalRef={bottomSheetModalRef}
					/>
				</BottomSheetView>
			</BottomSheetModal>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingVertical: Spacings.md,
		paddingHorizontal: Spacings.md,
		backgroundColor: Colors.darkBackground,
	},
	headerContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: Spacings.lg,
	},
	bottomSheetContentContainer: {
		padding: 0,
	},
	slideContainer: {
		alignItems: "center",
		height: "100%",
		backgroundColor: "red",
	},
	slideImage: {
		width: "100%",
		height: "100%",
		backgroundColor: Colors.white,
	},
});
