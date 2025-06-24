import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import { useQRCode } from "@/hooks/useQRCode";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams } from "expo-router";
import { Download } from "lucide-react-native";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
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

	return (
		<View style={styles.overlay}>
			<View style={styles.container}>
				<View>
					<ViewShot ref={viewShotRef}>
						<SvgXml width="100%" xml={svg} style={{ aspectRatio: 1 }} />
					</ViewShot>
				</View>
				<View style={styles.actionsContainer}>
					<Button
						buttonColor={Colors.slate["500"]}
						textColor={Colors.white}
						onPress={handleSavePress}
						title={t("app.qr_code.save")}
						reduceMotion="system"
						Icon={
							<Download
								size={16}
								color="white"
								style={{ marginRight: Spacings.sm }}
							/>
						}
					/>
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
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginTop: Spacings.md,
	},
});
