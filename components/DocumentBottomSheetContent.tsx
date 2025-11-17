import { Spacings } from "@/constants/Spacings";
import { type Document } from "@/stores/documents";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "./ui/ThemedText";

type ScannerResultProps = {
	currentDocument: Document | null;
	bottomSheetModalRef: React.RefObject<BottomSheetModal | null>;
};

export function DocumentBottomSheetContent({
	currentDocument,
	bottomSheetModalRef,
}: ScannerResultProps) {
	const { t } = useTranslation();
	const router = useRouter();

	return (
		<View style={{ marginVertical: Spacings.lg }}>
			<View style={{ paddingHorizontal: Spacings.md }}>
				<ThemedText
					variant="title"
					style={{ marginBottom: Spacings.sm }}
					numberOfLines={2}
				>
					{currentDocument?.name}
				</ThemedText>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	buttonContainer: {
		paddingHorizontal: Spacings.md,
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: Spacings.sm,
		marginBottom: Spacings.sm,
	},
	horizontalStack: {
		flexDirection: "row",
		alignItems: "center",
	},
});
