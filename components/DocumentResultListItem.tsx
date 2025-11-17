import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import { useBottomSheetBackHandler } from "@/hooks/useBottomSheetBackHandler";
import type { Document } from "@/stores/documents";
import useDocuments from "@/stores/documents";
import { formatDistanceToNow } from "@/utils/date";
import {
	BottomSheetBackdrop,
	BottomSheetModal,
	BottomSheetView,
} from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { ImageBackground, Pressable, StyleSheet } from "react-native";
import { DocumentBottomSheetContent } from "./DocumentBottomSheetContent";
import { ThemedText } from "./ui/ThemedText";

interface DocumentResultListItemProps {
	document: Document;
}

export default function DocumentResultListItem({
	document,
}: DocumentResultListItemProps) {
	const { t } = useTranslation();
	const router = useRouter();
	const bottomSheetModalRef = useRef<BottomSheetModal>(null);
	const { handleSheetPositionChange } =
		useBottomSheetBackHandler(bottomSheetModalRef);
	const setCurrentDocument = useDocuments.use.setCurrentDocument();

	const handleDocumentPress = () => {
		setCurrentDocument(document);
		router.navigate("/document");
	};

	const handleDocumentLongPress = () => {
		bottomSheetModalRef.current?.present();
	};

	return (
		<Pressable
			style={styles.container}
			onPress={handleDocumentPress}
			onLongPress={handleDocumentLongPress}
		>
			<ImageBackground
				source={{ uri: document.pages?.[0] ? document.pages[0] : "" }}
				style={{ width: "100%", height: "100%" }}
				resizeMode="contain"
			>
				<LinearGradient
					colors={["transparent", `${Colors.black}cc`]}
					locations={[0, 1]}
					style={styles.contentContainer}
				>
					<ThemedText variant="title" numberOfLines={1} style={styles.title}>
						{document.name}
					</ThemedText>
					<ThemedText style={styles.createdAt} numberOfLines={1}>
						{t("app.shared.timeAgo", {
							time: formatDistanceToNow(document.createdAt),
						})}
					</ThemedText>
				</LinearGradient>
			</ImageBackground>
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
				onDismiss={() => setCurrentDocument(null)}
			>
				<BottomSheetView style={styles.bottomSheetContentContainer}>
					<DocumentBottomSheetContent
						currentDocument={document}
						bottomSheetModalRef={bottomSheetModalRef}
					/>
				</BottomSheetView>
			</BottomSheetModal>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		height: 180,
		backgroundColor: Colors.white,
		borderRadius: Spacings.md,
		overflow: "hidden",
	},
	contentContainer: {
		position: "absolute",
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		paddingHorizontal: Spacings.sm,
		paddingVertical: Spacings.sm,
		justifyContent: "flex-end",
	},
	title: {
		fontSize: 16,
		color: Colors.white,
	},
	createdAt: {
		fontSize: 12,
		color: `${Colors.white}a6`,
	},
	bottomSheetContentContainer: {
		padding: 0,
	},
});
