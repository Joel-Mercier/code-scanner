import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";
import {
	prepareDocument,
	printDocument,
	saveDocumentToFiles,
	savePagesToGallery,
	shareDocument,
} from "@/components/documents/actions";
import { useMoveToFolder } from "@/components/library/FolderPicker";
import { useLibraryActions } from "@/components/library/useLibraryActions";
import { useRevealed } from "@/components/lock/hooks";
import { LockedItem } from "@/components/lock/LockedItem";
import { Button, ButtonGrid, gridCell } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { StatusBar } from "@/components/ui/StatusBar";
import { Text } from "@/components/ui/Text";
import { docTypeLabel } from "@/domain/library/documents";
import { catalogueNumber, isPinned } from "@/domain/library/items";
import { formatBytes } from "@/lib/bytes";
import { format } from "@/lib/date";
import { pageUris } from "@/services/documents";
import useLibrary from "@/stores/library";
import {
	makeStyles,
	useScreenInsets,
	useSharedStyles,
	useTheme,
} from "@/theme";
import { enter } from "@/theme/motion";
import {
	DocDetails,
	FoundCodes,
	RecognisedText,
} from "./components/DocContents";
import { PageCarousel } from "./components/PageCarousel";
import { useDocDetailsSheet } from "./hooks/useDocDetailsSheet";

function Chip({ label, icon }: { label: string; icon?: "pin" }) {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	return (
		<View style={[shared.chip, styles.chip]}>
			{icon && <Icon name={icon} size={12} color={colors.muted} />}
			<Text size={12} mono>
				{label}
			</Text>
		</View>
	);
}

/**
 * A document: its pages (tap to read one full screen), details and actions,
 * then its type and notes, the codes printed on it and the text read on it.
 */
export function DocumentScreen({ id }: { id: string }) {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const router = useRouter();
	const edges = useScreenInsets();
	const { height } = useWindowDimensions();
	const item = useLibrary((state) => state.items[id]);
	const actions = useLibraryActions({ onDeleted: () => router.back() });
	const mover = useMoveToFolder();
	const doc = item?.kind === "doc" ? item : undefined;
	const details = useDocDetailsSheet(doc);
	const revealed = useRevealed(doc);

	// Documents saved before PDFs and text recognition catch up here.
	useEffect(() => {
		prepareDocument(id);
	}, [id]);

	if (doc && !revealed) return <LockedItem item={doc} />;

	if (!doc) {
		return (
			<View style={shared.screen}>
				<Header />
				{actions.element}
			</View>
		);
	}

	const openPage = (page: number) =>
		router.push({
			pathname: "/document/[id]/view",
			params: { id: doc.id, page: String(page) },
		});

	return (
		<View style={shared.screen}>
			<StatusBar />
			<Header
				right={
					<IconButton
						icon="more"
						accessibilityLabel={t("app.common.more")}
						onPress={() => actions.openItem(doc)}
					/>
				}
			/>
			<ScrollView
				contentContainerStyle={{ paddingBottom: edges.bottom }}
				showsVerticalScrollIndicator={false}
			>
				<PageCarousel
					pages={pageUris(doc)}
					paddingTop={edges.header}
					height={Math.max(360, Math.min(height * 0.58, 640))}
					onOpen={openPage}
				/>

				<Animated.View entering={enter.up(200)} style={styles.titles}>
					<Text size={12} mono color={colors.muted}>
						{catalogueNumber(doc)} ·{" "}
						{(doc.docType
							? docTypeLabel(doc.docType)
							: t("app.library.document")
						).toUpperCase()}{" "}
						·{" "}
						{t("app.document.scanned_on", {
							date: format(doc.createdAt, "d MMM yyyy"),
						}).toUpperCase()}
					</Text>
					<Text
						size={26}
						weight="semibold"
						tracking={-0.02}
						numberOfLines={2}
						selectable
					>
						{doc.name}
					</Text>
					<View style={styles.chips}>
						{isPinned(doc) && (
							<Chip
								icon="pin"
								label={t("app.library.pinned_label").toUpperCase()}
							/>
						)}
						<Chip
							label={t("app.document.pages", {
								count: doc.pages.length,
							}).toUpperCase()}
						/>
						<Chip label={formatBytes(doc.size).toUpperCase()} />
						<Chip label={doc.pdf ? "PDF" : "JPG"} />
					</View>
				</Animated.View>

				<Animated.View entering={enter.up(280)} style={styles.actions}>
					<Button
						icon="share"
						label={t("app.document.share_pdf")}
						onPress={() => shareDocument(doc)}
					/>
					<ButtonGrid>
						<Button
							variant="secondary"
							icon="pages"
							label={t("app.document.edit_pages")}
							onPress={() =>
								router.push({
									pathname: "/document/[id]/pages",
									params: { id: doc.id },
								})
							}
							style={gridCell}
						/>
						<Button
							variant="secondary"
							icon="download"
							label={t("app.document.save_to_files")}
							onPress={() => saveDocumentToFiles(doc)}
							style={gridCell}
						/>
						<Button
							variant="secondary"
							icon="image"
							label={t("app.document.save_pages")}
							onPress={() => savePagesToGallery(doc)}
							style={gridCell}
						/>
						<Button
							variant="secondary"
							icon="printer"
							label={t("app.document.print")}
							onPress={() => printDocument(doc)}
							style={gridCell}
						/>
						<Button
							variant="secondary"
							icon="folder"
							label={t("app.library.move_to_folder")}
							onPress={() => mover.open(doc)}
							style={gridCell}
						/>
					</ButtonGrid>
				</Animated.View>

				<Animated.View entering={enter.up(360)} style={styles.blocks}>
					<DocDetails
						doc={doc}
						onEditType={details.openType}
						onEditNotes={details.openNotes}
					/>
					<FoundCodes doc={doc} />
					<RecognisedText doc={doc} />
				</Animated.View>
			</ScrollView>
			{actions.element}
			{mover.element}
			{details.element}
		</View>
	);
}

const useStyles = makeStyles(() => ({
	titles: { paddingTop: 8, paddingHorizontal: 20, gap: 6 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
	chip: { flexDirection: "row", alignItems: "center", gap: 6 },
	actions: { paddingTop: 18, paddingHorizontal: 16, gap: 10 },
	blocks: { marginTop: 22, marginHorizontal: 16, gap: 22 },
}));
