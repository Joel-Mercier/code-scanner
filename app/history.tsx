import { ScannerResultListItem } from "@/components/ScannerResultListItem";
import { ThemedText } from "@/components/ui/ThemedText";
import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import useScannerResults from "@/stores/scannerResultsStore";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HistoryScreen() {
	const scannerResults = useScannerResults.use.scannerResults();
	const router = useRouter();
	return (
		<SafeAreaView style={styles.container}>
			<FlashList
				data={scannerResults}
				renderItem={({ item }) => (
					<ScannerResultListItem scannerResult={item} />
				)}
				keyExtractor={(item) => item.data}
				estimatedItemSize={50}
				ListHeaderComponent={
					<View style={styles.headerContainer}>
						<Pressable
							onPress={() => router.back()}
							style={{ marginRight: 24 }}
						>
							<ArrowLeft size={24} color="white" />
						</Pressable>
						<ThemedText variant="title">Historique</ThemedText>
						<View style={{ width: 24 }} />
					</View>
				}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingVertical: 24,
		paddingHorizontal: 24,
		backgroundColor: Colors.background,
	},
	headerContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: Spacings.lg,
	},
});
