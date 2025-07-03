import { ThemedText } from "@/components/ui/ThemedText";
import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import { useQRCode } from "@/hooks/useQRCode";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams } from "expo-router";
import { Download, Share2 } from "lucide-react-native";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import Share from "react-native-share";
import { SvgXml } from "react-native-svg";
import ViewShot, { captureRef } from "react-native-view-shot";

export default function CodeScreen() {
	const { t } = useTranslation();
	const { content } = useLocalSearchParams<{ content: string }>();
	const { svg } = useQRCode(content);
	const viewShotRef = useRef<ViewShot>(null);
	const [mediaLibraryPermission, requestMediaLibraryPermission] =
		MediaLibrary.usePermissions();

	const handleSavePress = async () => {
		if (!mediaLibraryPermission?.granted) {
			await requestMediaLibraryPermission();
		}
		try {
			const tmpFileUri = await captureRef(viewShotRef, {
				fileName: "qr_code_",
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
				fileName: "qr_code_",
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
						<SvgXml width="100%" xml={svg} style={{ aspectRatio: 1 }} />
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
						<ThemedText>{t("app.qr_code.save")}</ThemedText>
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
						<ThemedText>{t("app.qr_code.share")}</ThemedText>
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
