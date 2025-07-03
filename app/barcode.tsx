import { ThemedText } from "@/components/ui/ThemedText";
import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import { generateBarcode } from "@/services/barcodeapi";
import { useQuery } from "@tanstack/react-query";
import type { BarcodeType } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams } from "expo-router";
import { Download, Share2 } from "lucide-react-native";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	Image,
	Pressable,
	StyleSheet,
	View,
} from "react-native";
import Share from "react-native-share";
import ViewShot, { captureRef } from "react-native-view-shot";

export default function BarcodeScreen() {
	const { t } = useTranslation();
	const { content, type } = useLocalSearchParams<{
		content: string;
		type: BarcodeType;
	}>();
	const viewShotRef = useRef<ViewShot>(null);
	const [mediaLibraryPermission, requestMediaLibraryPermission] =
		MediaLibrary.usePermissions();
	const { data, isLoading, error } = useQuery({
		queryKey: ["barcode", type, content],
		queryFn: async () => {
			if (typeof content !== "string" || typeof type !== "string") {
				return undefined;
			}
			return await generateBarcode(content, type as BarcodeType);
		},
		enabled: typeof content === "string" && typeof type === "string",
	});

	const handleSavePress = async () => {
		if (!mediaLibraryPermission?.granted) {
			await requestMediaLibraryPermission();
		}
		try {
			const tmpFileUri = await captureRef(viewShotRef, {
				fileName: "barcode_",
				format: "png",
				quality: 1,
				result: "tmpfile",
			});
			await MediaLibrary.saveToLibraryAsync(tmpFileUri);
		} catch (error) {
			console.error(
				"An error occurred while saving the picture to the media library : ",
			);
			console.error(error);
		}
	};

	const handleSharePress = async () => {
		try {
			const tmpFileUri = await captureRef(viewShotRef, {
				fileName: "barcode_",
				format: "png",
				quality: 1,
				result: "tmpfile",
			});
			await Share.open({
				url: tmpFileUri,
				type: "image/png",
				failOnCancel: false,
			});
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<View style={styles.overlay}>
			<View style={styles.container}>
				<View>
					<ViewShot ref={viewShotRef}>
						{data && (
							<Image
								source={{ uri: data }}
								style={{ width: "100%", aspectRatio: 1 }}
								resizeMode="contain"
							/>
						)}
						{isLoading && (
							<ActivityIndicator size="large" color={Colors.primary} />
						)}
					</ViewShot>
				</View>
				<View style={styles.actionsContainer}>
					<Pressable
						onPress={handleSavePress}
						style={({ pressed }) => [
							pressed && { backgroundColor: Colors.slate[800] },
							styles.buttonContainer,
						]}
					>
						<Download
							size={16}
							color={Colors.white}
							style={{ marginRight: Spacings.md }}
						/>
						<ThemedText>{t("app.barcode.save")}</ThemedText>
					</Pressable>
					<Pressable
						onPress={handleSharePress}
						style={({ pressed }) => [
							pressed && { backgroundColor: Colors.slate[800] },
							styles.buttonContainer,
						]}
					>
						<Share2
							size={16}
							color={Colors.white}
							style={{ marginRight: Spacings.md }}
						/>
						<ThemedText>{t("app.barcode.share")}</ThemedText>
					</Pressable>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		alignItems: "center",
		justifyContent: "center",
	},
	container: {
		width: "80%",
		backgroundColor: Colors.darkBackgroundPressed,
		padding: 24,
		borderRadius: 24,
	},
	actionsContainer: {
		marginTop: Spacings.md,
	},
	buttonContainer: {
		paddingHorizontal: Spacings.lg,
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: Spacings.sm,
		marginBottom: Spacings.sm,
	},
});
