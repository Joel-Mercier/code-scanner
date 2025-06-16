import { ScannerResultListItem } from "@/components/ScannerResultListItem";
import { Button } from "@/components/ui/Button";
import { ThemedText } from "@/components/ui/ThemedText";
import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import useScannerResults from "@/stores/scannerResultsStore";
import * as AlertDialogPrimitive from "@rn-primitives/alert-dialog";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { ArrowLeft, BrushCleaning } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function HistoryScreen() {
	const scannerResults = useScannerResults.use.scannerResults();
	const clearScannerResults = useScannerResults.use.clearScannerResults();
	const insets = useSafeAreaInsets();
	const router = useRouter();
	return (
		<SafeAreaView style={styles.container}>
			<AlertDialogPrimitive.Root style={{ flex: 1 }}>
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
							<AlertDialogPrimitive.Trigger style={{ marginLeft: 24 }}>
								<BrushCleaning size={24} color="white" />
							</AlertDialogPrimitive.Trigger>
						</View>
					}
					ListEmptyComponent={
						<ThemedText
							style={{ color: Colors.mutedText, textAlign: "center" }}
						>
							Aucun historique
						</ThemedText>
					}
				/>
				<AlertDialogPrimitive.Portal>
					<AlertDialogPrimitive.Overlay
						style={{
							paddingBottom: insets.bottom,
							padding: Spacings.lg,
							backgroundColor: Colors.slate["800"],
						}}
					>
						<AlertDialogPrimitive.Content>
							<AlertDialogPrimitive.Title style={{ marginBottom: Spacings.lg }}>
								<ThemedText variant="title">Effacer l'historique ?</ThemedText>
							</AlertDialogPrimitive.Title>
							<AlertDialogPrimitive.Description
								style={{ marginBottom: Spacings.lg }}
							>
								<ThemedText>
									Cette action est irréversible et entrainera l'effacement de
									toutes les données de votre historique. Êtes-vous sûr de
									vouloir continuer ?
								</ThemedText>
							</AlertDialogPrimitive.Description>
							<View
								style={{
									flexDirection: "row",
									justifyContent: "space-between",
									gap: Spacings.lg,
									marginBottom: Spacings.lg,
								}}
							>
								<AlertDialogPrimitive.Cancel asChild>
									<Button
										buttonColor={Colors.slate["500"]}
										textColor={Colors.white}
										onPress={() => {}}
										title={"Annuler"}
										reduceMotion="system"
									/>
								</AlertDialogPrimitive.Cancel>
								<AlertDialogPrimitive.Action asChild>
									<Button
										buttonColor={Colors.error}
										textColor={Colors.white}
										onPress={() => clearScannerResults()}
										title={"Effacer"}
										reduceMotion="system"
									/>
								</AlertDialogPrimitive.Action>
							</View>
						</AlertDialogPrimitive.Content>
					</AlertDialogPrimitive.Overlay>
				</AlertDialogPrimitive.Portal>
			</AlertDialogPrimitive.Root>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingVertical: 24,
		paddingHorizontal: 24,
		backgroundColor: Colors.slate["950"],
	},
	headerContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: Spacings.lg,
	},
});
