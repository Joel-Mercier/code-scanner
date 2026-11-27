import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { kindIcons } from "@/components/codes/kindIcons";
import { copyDocumentText } from "@/components/documents/actions";
import { docTypeIcons } from "@/components/documents/docTypes";
import { Button } from "@/components/ui/Button";
import { ListCard, ListRow } from "@/components/ui/List";
import { Eyebrow, Text } from "@/components/ui/Text";
import { describeItem } from "@/domain/codes/describe";
import {
	docCodes,
	docText,
	docTypeLabel,
	unreadPages,
} from "@/domain/library/documents";
import type { DocItem, FoundCode } from "@/domain/library/types";
import { haptics } from "@/lib/haptics";
import useLibrary from "@/stores/library";
import { makeStyles, useSharedStyles, useTheme } from "@/theme";

/** Lines of recognised text shown before "Copy text". */
const TEXT_LINES = 10;

/** Type and notes, each a row that opens its editor. */
export function DocDetails({
	doc,
	onEditType,
	onEditNotes,
}: {
	doc: DocItem;
	onEditType: () => void;
	onEditNotes: () => void;
}) {
	const { colors } = useTheme();
	const { t } = useTranslation();
	return (
		<ListCard>
			<ListRow
				icon={doc.docType ? docTypeIcons[doc.docType] : "tag"}
				label={t("app.document.type")}
				trailing={
					<Text size={15} color={colors.muted}>
						{doc.docType ? docTypeLabel(doc.docType) : t("app.document.add")}
					</Text>
				}
				chevron
				onPress={onEditType}
			/>
			<ListRow
				icon="text"
				label={t("app.document.notes")}
				description={doc.notes || t("app.document.notes_empty")}
				height={64}
				chevron
				last
				onPress={onEditNotes}
			/>
		</ListCard>
	);
}

/**
 * The codes printed on the pages: tapping one saves it to the collection
 * (if it isn't there yet) and opens it.
 */
export function FoundCodes({ doc }: { doc: DocItem }) {
	const styles = useStyles();
	const { t } = useTranslation();
	const router = useRouter();
	const addCode = useLibrary((state) => state.addCode);
	const codes = docCodes(doc);
	if (codes.length === 0) return null;

	const open = (code: FoundCode) => {
		haptics.pop();
		const item = addCode({ source: "scanner", ...code });
		router.push({ pathname: "/code/[id]", params: { id: item.id } });
	};

	return (
		<View style={styles.section}>
			<Eyebrow style={styles.label}>
				{t("app.document.codes_found", { count: codes.length })}
			</Eyebrow>
			<ListCard>
				{codes.map((code, index) => {
					const described = describeItem({
						kind: "code",
						id: "",
						seq: 0,
						folderId: null,
						createdAt: doc.createdAt,
						source: "scanner",
						...code,
					});
					return (
						<ListRow
							key={`${code.format}-${code.data}`}
							icon={kindIcons[described.kind]}
							iconTile={36}
							label={described.title}
							description={described.subtitle}
							height={64}
							chevron
							last={index === codes.length - 1}
							onPress={() => open(code)}
						/>
					);
				})}
			</ListCard>
		</View>
	);
}

/** The text read on the pages, with a way to copy it all. */
export function RecognisedText({ doc }: { doc: DocItem }) {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const text = docText(doc);
	const reading = unreadPages(doc).length > 0;
	if (!text && !reading) return null;
	return (
		<View style={styles.section}>
			<View style={shared.well}>
				<Eyebrow>{t("app.document.text")}</Eyebrow>
				{text ? (
					<Text size={14} leading={1.5} numberOfLines={TEXT_LINES} selectable>
						{text}
					</Text>
				) : (
					<Text size={14} color={colors.muted}>
						{t("app.document.reading")}
					</Text>
				)}
			</View>
			{text.length > 0 && (
				<Button
					variant="secondary"
					icon="copy"
					label={t("app.document.copy_text")}
					onPress={() => copyDocumentText(doc)}
				/>
			)}
		</View>
	);
}

const useStyles = makeStyles(() => ({
	section: { gap: 10 },
	label: { paddingHorizontal: 4 },
}));
