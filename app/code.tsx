import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import { useQRCode } from "@/hooks/useQRCode";
import useScannerResults from "@/stores/scannerResultsStore";
import * as MediaLibrary from "expo-media-library";
import { Download } from "lucide-react-native";
import { useRef } from "react";
import { StyleSheet, View } from "react-native";
import { SvgXml } from "react-native-svg";
import ViewShot, { captureRef } from "react-native-view-shot";

export default function CodeScreen() {
	const currentScannerResult = useScannerResults.use.currentScannerResult();
	const { svg } = useQRCode(currentScannerResult?.data);
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
			console.log(
				"An error occurred while saving the picture to the media library : ",
			);
			console.log(error);
		}
	};

	return (
		<View style={styles.overlay}>
			<View style={styles.container}>
				<View>
					<ViewShot ref={viewShotRef}>
						<SvgXml
							width="100%"
							xml={svg}
							style={{ backgroundColor: "red", aspectRatio: 1 }}
						/>
					</ViewShot>
				</View>
				<View style={styles.actionsContainer}>
					<Button
						buttonColor={Colors.slate["500"]}
						textColor={Colors.white}
						onPress={handleSavePress}
						title={"Enregistrer"}
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
