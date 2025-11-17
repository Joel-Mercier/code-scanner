import DocumentResultListItem from "@/components/DocumentResultListItem";
import { ThemedText } from "@/components/ui/ThemedText";
import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import useDocuments, { type Document } from "@/stores/documents";
import {
	ResultFormatOptions,
	ScannerModeOptions,
	launchDocumentScannerAsync,
} from "@infinitered/react-native-mlkit-document-scanner";
import { FlashList } from "@shopify/flash-list";
import { File } from "expo-file-system";
import { Link, useRouter } from "expo-router";
import { FileText, Scan } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function DocumentScannerScreen() {
	const router = useRouter();
	const { t } = useTranslation();
	const insets = useSafeAreaInsets();
	const documents = useDocuments.use.documents();
	const setCurrentDocument = useDocuments.use.setCurrentDocument();
	const addDocument = useDocuments.use.addDocument();

	const handleScanDocumentPress = async () => {
		try {
			console.log("launchDocumentScannerAsync");
			const result = await launchDocumentScannerAsync({
				scannerMode: ScannerModeOptions.FULL,
				galleryImportAllowed: true,
				resultFormats: ResultFormatOptions.ALL,
			});
			console.log("RESULT", result);
			if (result.canceled) {
				return;
			}
			const { pages, pdf } = result;
			if (pdf?.uri) {
				const pdfFile = new File(pdf?.uri);
				const newDocument = {
					id: new Date().getTime(),
					name: pdfFile.name,
					createdAt: new Date(),
					pdf,
					pages: pages,
					size: pdfFile.info().size,
				};
				addDocument(newDocument);
				setCurrentDocument(newDocument);
			}
		} catch (error) {
			console.log("ERROR", error);
		}
	};

	console.log("DOCUMENTS", documents);
	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.headerContainer}>
				<View style={{ width: 24, marginLeft: Spacings.lg }} />
				<View style={styles.tabsList}>
					<View style={[styles.tabsTrigger]}>
						<Link href={"/(tabs)"} asChild>
							<ThemedText variant="default" style={[styles.tabsTriggerText]}>
								{t("app.home.scan_code")}
							</ThemedText>
						</Link>
					</View>
					<View style={[styles.tabsTrigger, styles.tabsTriggerSelected]}>
						<ThemedText
							variant="default"
							style={[styles.tabsTriggerText, styles.tabsTriggerSelectedText]}
						>
							{t("app.home.scan_document")}
						</ThemedText>
					</View>
				</View>
				<View style={{ width: 24, marginLeft: Spacings.lg }} />
			</View>
			<FlashList
				data={documents}
				keyExtractor={(item: Document) => item.id}
				renderItem={({ item, index }) => {
					return <DocumentResultListItem document={item} />;
				}}
				numColumns={3}
				ListHeaderComponent={() => (
					<ThemedText variant="title" style={styles.listTitle}>
						{t("app.document_scanner.recent_documents")}
					</ThemedText>
				)}
			/>
			<Pressable
				onPress={handleScanDocumentPress}
				style={({ pressed }) => [
					pressed && { backgroundColor: Colors.darkBackgroundPressed },
					styles.buttonContainer,
					{ bottom: insets.bottom },
				]}
			>
				<Scan color={Colors.white} size={40} />
				<FileText
					color={Colors.white}
					size={24}
					style={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: [{ translateX: "-50%" }, { translateY: "-50%" }],
					}}
				/>
			</Pressable>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingVertical: Spacings.md,
		paddingHorizontal: Spacings.md,
		backgroundColor: Colors.darkBackground,
	},
	headerContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: Spacings.lg,
	},
	tabsList: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-around",
		backgroundColor: "rgba(0,0,0,0.5)",
		borderRadius: 24,
		padding: Spacings.xs,
		flex: 1,
		// borderWidth: 4,
		// borderColor: Colors.slate["800"],
	},
	tabsTrigger: {
		textAlign: "center",
		paddingHorizontal: Spacings.md,
		paddingVertical: Spacings.sm,
		// backgroundColor: "red",
	},
	tabsTriggerSelected: {
		borderRadius: 24,
		backgroundColor: Colors.white,
	},
	tabsTriggerText: {
		textAlign: "center",
		fontSize: 14,
	},
	tabsTriggerSelectedText: {
		color: Colors.black,
	},
	buttonContainer: {
		position: "absolute",
		bottom: 0,
		left: "50%",
		transform: [{ translateX: -16 }],
		right: 0,
		width: 64,
		height: 64,
		borderRadius: 32,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: Colors.primary,
	},
	listTitle: {
		marginBottom: Spacings.md,
	},
});
