import { Colors } from "@/constants/Colors";
import { useQRCode } from "@/hooks/useQRCode";
import useScannerResults from "@/stores/scannerResultsStore";
import { View } from "react-native";
import { SvgXml } from "react-native-svg";

export default function CodeScreen() {
	const currentScannerResult = useScannerResults.use.currentScannerResult();
	const { svg } = useQRCode(currentScannerResult?.data);
	return (
		<View
			style={{
				flex: 1,
				backgroundColor: "rgba(0,0,0,0.5)",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<View
				style={{
					width: "80%",
					backgroundColor: Colors.darkBackgroundPressed,
					padding: 24,
					borderRadius: 24,
				}}
			>
				<View>
					<SvgXml
						width="100%"
						xml={svg}
						style={{ backgroundColor: "red", aspectRatio: 1 }}
					/>
				</View>
			</View>
		</View>
	);
}
