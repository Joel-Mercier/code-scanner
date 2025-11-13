import {
	ResultFormatOptions,
	ScannerModeOptions,
	launchDocumentScannerAsync,
} from "@infinitered/react-native-mlkit-document-scanner";
import { Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DocumentScannerScreen() {
	const handleScanDocumentPress = async () => {
		// result will contain an object with the result information
		try {
			console.log("launchDocumentScannerAsync");
			const result = await launchDocumentScannerAsync({
				scannerMode: ScannerModeOptions.FULL,
				galleryImportAllowed: true,
				resultFormats: ResultFormatOptions.ALL,
			});
			console.log("RESULT", result);
		} catch (error) {
			console.log("ERROR", error);
		}
	};

	return (
		<SafeAreaView>
			<Button onPress={handleScanDocumentPress} title="Scan Document" />
		</SafeAreaView>
	);
}
