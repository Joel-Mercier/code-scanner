import { DocumentBottomSheetContent } from "@/components/DocumentBottomSheetContent";
import DocumentSlideItem from "@/components/DocumentSlideItem";
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
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { ArrowLeft, EllipsisVertical } from "lucide-react-native";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const height = Dimensions.get("window").height;

export default function DocumentScreen() {
	const { t } = useTranslation();
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const currentDocument = useDocuments.use.currentDocument();
	const pages = currentDocument?.pages ?? [];
	const hasMultiplePages = pages.length > 1;
	const bottomSheetModalRef = useRef<BottomSheetModal>(null);
	const { handleSheetPositionChange } =
		useBottomSheetBackHandler(bottomSheetModalRef);
	console.log("pages", pages);
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
			{/* <ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={{
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "red",
					height: "100%",
				}}
				horizontal
			>
				<DocumentSlideItem item={pages[0]} index={0} />
				<DocumentSlideItem item={pages[0]} index={0} />
			</ScrollView> */}
			<FlashList
				data={pages}
				renderItem={({ item, index }) => (
					<DocumentSlideItem item={item} index={index} />
				)}
				horizontal
				showsHorizontalScrollIndicator={false}
				pagingEnabled
				keyExtractor={(item) => item}
				contentContainerStyle={{
					backgroundColor: "red",
					height,
					flexGrow: 1,
					flex: 1,
				}}
				CellRendererComponent={({ style, index, ...props }) => {
					return (
						<View
							style={{
								...style,
								flexGrow: 1,
								flex: 1,
								backgroundColor: "red",
								height: "100%",
							}}
							{...props}
						/>
					);
				}}
			/>
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
	slideContainer: {
		alignItems: "center",
		height: "100%",
		width: "100%",
	},
	slideImage: {
		width: "100%",
		height: "100%",
		backgroundColor: Colors.white,
	},
});
