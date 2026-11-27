import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { docTypeIcons } from "@/components/documents/docTypes";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ListCard, ListRow } from "@/components/ui/List";
import { Sheet } from "@/components/ui/Sheet";
import { Text } from "@/components/ui/Text";
import { TextField } from "@/components/ui/TextField";
import { docTypeLabel } from "@/domain/library/documents";
import { type DocItem, docTypes } from "@/domain/library/types";
import { haptics } from "@/lib/haptics";
import useLibrary from "@/stores/library";
import { useTheme } from "@/theme";
import { enter, stagger } from "@/theme/motion";

type Step = "type" | "notes";

/**
 * The sheet that edits a document's type or notes. Render `element` once in
 * the screen.
 */
export function useDocDetailsSheet(doc: DocItem | undefined) {
	const { colors } = useTheme();
	const { t } = useTranslation();
	const sheet = useRef<BottomSheetModal>(null);
	const [step, setStep] = useState<Step>("type");
	const [notes, setNotes] = useState("");
	const updateDocument = useLibrary((state) => state.updateDocument);

	const open = (next: Step) => {
		setStep(next);
		setNotes(doc?.notes ?? "");
		sheet.current?.present();
	};
	const close = () => sheet.current?.dismiss();

	const content = !doc ? null : step === "type" ? (
		<>
			<Text size={24} weight="semibold" tracking={-0.02}>
				{t("app.document.type")}
			</Text>
			<ListCard>
				{docTypes.map((type, index) => (
					<Animated.View key={type} entering={enter.up(stagger(index, 30))}>
						<ListRow
							icon={docTypeIcons[type]}
							label={docTypeLabel(type)}
							last={index === docTypes.length - 1}
							trailing={
								doc.docType === type ? (
									<Icon name="check" size={18} color={colors.accent} />
								) : undefined
							}
							onPress={() => {
								haptics.select();
								updateDocument(doc.id, {
									docType: doc.docType === type ? undefined : type,
								});
								close();
							}}
						/>
					</Animated.View>
				))}
			</ListCard>
		</>
	) : (
		<>
			<Text size={24} weight="semibold" tracking={-0.02}>
				{t("app.document.notes")}
			</Text>
			<TextField
				inSheet
				multiline
				value={notes}
				onChangeText={setNotes}
				placeholder={t("app.document.notes_placeholder")}
				autoFocus
				maxLength={2000}
				textAlignVertical="top"
			/>
			<View style={{ gap: 10 }}>
				<Button
					icon="check"
					label={t("app.common.save")}
					onPress={() => {
						updateDocument(doc.id, { notes: notes.trim() });
						close();
					}}
				/>
			</View>
		</>
	);

	return {
		openType: () => open("type"),
		openNotes: () => open("notes"),
		element: <Sheet ref={sheet}>{content}</Sheet>,
	};
}
