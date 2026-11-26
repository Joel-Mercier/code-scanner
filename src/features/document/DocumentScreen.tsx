import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { saveDocumentToFiles } from "@/components/documents/actions";
import { useMoveToFolder } from "@/components/library/FolderPicker";
import { useLibraryActions } from "@/components/library/useLibraryActions";
import { Button, ButtonGrid, gridCell } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { IconButton } from "@/components/ui/IconButton";
import { StatusBar } from "@/components/ui/StatusBar";
import { Text } from "@/components/ui/Text";
import { catalogueNumber } from "@/domain/library/items";
import { formatBytes } from "@/lib/bytes";
import { format } from "@/lib/date";
import { shareItem } from "@/services/share";
import useLibrary from "@/stores/library";
import {
	makeStyles,
	useScreenInsets,
	useSharedStyles,
	useTheme,
} from "@/theme";
import { enter } from "@/theme/motion";
import { PageCarousel } from "./components/PageCarousel";

function Chip({ label }: { label: string }) {
	const shared = useSharedStyles();
	return (
		<View style={shared.chip}>
			<Text size={12} mono>
				{label}
			</Text>
		</View>
	);
}

/** A scanned document: its pages, details and actions. */
export function DocumentScreen({ id }: { id: string }) {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const router = useRouter();
	const edges = useScreenInsets();
	const item = useLibrary((state) => state.items[id]);
	const actions = useLibraryActions({ onDeleted: () => router.back() });
	const mover = useMoveToFolder();

	if (item?.kind !== "doc") {
		return (
			<View style={shared.screen}>
				<Header />
				{actions.element}
			</View>
		);
	}
	const doc = item;

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

			<PageCarousel pages={doc.pages} paddingTop={edges.header} />

			<Animated.View entering={enter.up(200)} style={styles.titles}>
				<Text size={12} mono color={colors.muted}>
					{catalogueNumber(doc)} · {t("app.library.document").toUpperCase()} ·{" "}
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
					<Chip
						label={t("app.document.pages", {
							count: doc.pages.length,
						}).toUpperCase()}
					/>
					<Chip label={formatBytes(doc.size).toUpperCase()} />
					<Chip label={doc.pdfUri ? "PDF" : "JPG"} />
				</View>
			</Animated.View>

			<Animated.View
				entering={enter.up(280)}
				style={[styles.actions, { paddingBottom: edges.bottom }]}
			>
				<Button
					icon="share"
					label={t(doc.pdfUri ? "app.document.share_pdf" : "app.common.share")}
					onPress={() => shareItem(doc).catch(console.error)}
				/>
				<ButtonGrid>
					<Button
						variant="secondary"
						icon="download"
						label={t("app.document.save_to_files")}
						onPress={() => saveDocumentToFiles(doc)}
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
			{actions.element}
			{mover.element}
		</View>
	);
}

const useStyles = makeStyles(() => ({
	titles: { paddingTop: 8, paddingHorizontal: 20, gap: 6 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
	actions: { paddingTop: 18, paddingHorizontal: 16, gap: 10 },
}));
