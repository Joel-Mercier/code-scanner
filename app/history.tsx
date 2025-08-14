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
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function HistoryScreen() {
	const { t } = useTranslation();
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
					contentContainerStyle={styles.wrapper}
					keyExtractor={(item) => item.data}
					ListHeaderComponent={
						<View style={styles.headerContainer}>
							<Pressable
								onPress={() => router.back()}
								style={{ marginRight: Spacings.lg }}
							>
								<ArrowLeft size={24} color="white" />
							</Pressable>
							<ThemedText variant="title">{t("app.history.title")}</ThemedText>
							<AlertDialogPrimitive.Trigger style={{ marginLeft: Spacings.lg }}>
								<BrushCleaning size={24} color="white" />
							</AlertDialogPrimitive.Trigger>
						</View>
					}
					ListEmptyComponent={
						<ThemedText
							style={{ color: Colors.mutedText, textAlign: "center" }}
						>
							{t("app.history.no_history")}
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
								<ThemedText variant="title">
									{t("app.history.delete_title")}
								</ThemedText>
							</AlertDialogPrimitive.Title>
							<AlertDialogPrimitive.Description
								style={{ marginBottom: Spacings.lg }}
							>
								<ThemedText>{t("app.history.delete_content")}</ThemedText>
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
										title={t("app.shared.cancel")}
										reduceMotion="system"
									/>
								</AlertDialogPrimitive.Cancel>
								<AlertDialogPrimitive.Action asChild>
									<Button
										buttonColor={Colors.error}
										textColor={Colors.white}
										onPress={() => clearScannerResults()}
										title={t("app.history.delete_action")}
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
		backgroundColor: Colors.slate["950"],
	},
	wrapper: {
		paddingHorizontal: Spacings.lg,
		paddingVertical: Spacings.lg,
	},
	headerContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: Spacings.lg,
	},
});
