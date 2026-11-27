import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { CameraView } from "expo-camera";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Alert,
	ScrollView,
	StyleSheet,
	useWindowDimensions,
	View,
} from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { savePageEdits } from "@/components/documents/actions";
import { pickPhotos } from "@/components/documents/useDocumentImport";
import { useRevealed } from "@/components/lock/hooks";
import { LockedItem } from "@/components/lock/LockedItem";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { IconButton } from "@/components/ui/IconButton";
import { ListCard, ListRow } from "@/components/ui/List";
import { Sheet } from "@/components/ui/Sheet";
import { StatusBar } from "@/components/ui/StatusBar";
import { LargeTitle, Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import type { DocItem } from "@/domain/library/types";
import { attempt } from "@/lib/attempt";
import { createId } from "@/lib/id";
import { pageUri, preparePhoto, scanMorePages } from "@/services/documents";
import useLibrary from "@/stores/library";
import {
	makeStyles,
	radii,
	useScreenInsets,
	useSharedStyles,
	useTheme,
} from "@/theme";
import { enter, stagger } from "@/theme/motion";
import {
	append,
	type DraftPage,
	draftOf,
	hasChanges,
	move,
	remove,
	rotate,
	toEdits,
} from "./pageDraft";

const SIDE = 16;
const GAP = 12;
const COLUMNS = 2;

function PageCard({
	page,
	index,
	count,
	size,
	onRotate,
	onRemove,
	onMove,
}: {
	page: DraftPage;
	index: number;
	count: number;
	size: number;
	onRotate: () => void;
	onRemove: () => void;
	onMove: (by: number) => void;
}) {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	return (
		<Animated.View
			entering={enter.lift(stagger(index, 40))}
			layout={LinearTransition.duration(260)}
			style={[shared.card, styles.card, { width: size }]}
		>
			<View style={[styles.preview, { height: size * 1.1 }]}>
				<Image
					source={page.uri}
					style={[
						StyleSheet.absoluteFill,
						{ transform: [{ rotate: `${page.rotation}deg` }] },
					]}
					contentFit="contain"
					transition={120}
				/>
			</View>
			<Text size={12} mono color={colors.muted} align="center">
				{t("app.document.page_of", { page: index + 1, count })}
			</Text>
			<View style={styles.tools}>
				<IconButton
					icon="chevronLeft"
					size={36}
					iconSize={16}
					accessibilityLabel={t("app.document.move_earlier")}
					disabled={index === 0}
					onPress={() => onMove(-1)}
				/>
				<IconButton
					icon="rotate"
					size={36}
					iconSize={16}
					accessibilityLabel={t("app.document.rotate")}
					onPress={onRotate}
				/>
				<IconButton
					icon="trash"
					size={36}
					iconSize={16}
					accessibilityLabel={t("app.document.remove_page")}
					disabled={count <= 1}
					onPress={onRemove}
				/>
				<IconButton
					icon="chevronRight"
					size={36}
					iconSize={16}
					accessibilityLabel={t("app.document.move_later")}
					disabled={index === count - 1}
					onPress={() => onMove(1)}
				/>
			</View>
		</Animated.View>
	);
}

function Editor({ doc }: { doc: DocItem }) {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const router = useRouter();
	const edges = useScreenInsets();
	const { width } = useWindowDimensions();
	const addSheet = useRef<BottomSheetModal>(null);
	const [draft, setDraft] = useState(() =>
		draftOf(doc.pages.map((page) => ({ page, uri: pageUri(doc, page) }))),
	);
	const [busy, setBusy] = useState(false);
	const changed = hasChanges(draft, doc.pages);
	const size = (width - SIDE * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

	const leave = () => {
		if (!changed) {
			router.back();
			return;
		}
		Alert.alert(t("app.document.discard_title"), undefined, [
			{ text: t("app.common.cancel"), style: "cancel" },
			{
				text: t("app.document.discard"),
				style: "destructive",
				onPress: () => router.back(),
			},
		]);
	};

	const addUris = (uris: string[]) => {
		if (uris.length === 0) return;
		setDraft((current) => append(current, uris, () => createId()));
	};

	const scanMore = async () => {
		addSheet.current?.dismiss();
		if (!CameraView.isDocumentScannerAvailable) {
			toast(t("app.scan.doc_scanner_unavailable"), "warning");
			return;
		}
		const scanned = await attempt(scanMorePages);
		if (scanned.ok) addUris(scanned.value);
		else toast(t("app.scan.doc_scan_failed"), "warning");
	};

	const addPhotos = async () => {
		addSheet.current?.dismiss();
		const picked = await attempt(pickPhotos);
		if (!picked.ok || picked.value.length === 0) return;
		setBusy(true);
		const prepared = await attempt(() =>
			Promise.all(picked.value.map(preparePhoto)),
		);
		setBusy(false);
		if (prepared.ok) addUris(prepared.value);
		else toast(t("app.document.import_failed"), "warning");
	};

	const save = async () => {
		setBusy(true);
		const saved = await savePageEdits(doc, toEdits(draft));
		setBusy(false);
		if (saved) {
			toast(t("app.document.pages_updated"));
			router.back();
		}
	};

	return (
		<View style={shared.screen}>
			<StatusBar />
			<Header onBack={leave} />
			<ScrollView
				contentContainerStyle={[
					edges.content,
					{ paddingBottom: edges.bottom + 150 },
				]}
				showsVerticalScrollIndicator={false}
			>
				<Animated.View entering={enter.up()} style={styles.titles}>
					<LargeTitle>{t("app.document.edit_pages")}</LargeTitle>
					<Text size={14} leading={1.45} color={colors.muted}>
						{t("app.document.edit_pages_hint")}
					</Text>
				</Animated.View>
				<View style={styles.grid}>
					{draft.map((page, index) => (
						<PageCard
							key={page.key}
							page={page}
							index={index}
							count={draft.length}
							size={size}
							onRotate={() => setDraft((current) => rotate(current, page.key))}
							onRemove={() => setDraft((current) => remove(current, page.key))}
							onMove={(by) =>
								setDraft((current) => move(current, page.key, by))
							}
						/>
					))}
				</View>
			</ScrollView>
			<View style={[styles.footer, { paddingBottom: edges.bottom }]}>
				<Button
					variant="dashed"
					icon="plus"
					label={t("app.document.add_pages")}
					disabled={busy}
					onPress={() => addSheet.current?.present()}
				/>
				<Button
					icon="check"
					label={t(busy ? "app.document.saving" : "app.common.save")}
					disabled={!changed || busy}
					onPress={save}
				/>
			</View>
			<Sheet ref={addSheet}>
				<Text size={24} weight="semibold" tracking={-0.02}>
					{t("app.document.add_pages")}
				</Text>
				<ListCard>
					<ListRow
						icon="scan"
						label={t("app.document.add_scan")}
						onPress={scanMore}
					/>
					<ListRow
						icon="imagePlus"
						label={t("app.document.import_photos")}
						last
						onPress={addPhotos}
					/>
				</ListCard>
			</Sheet>
		</View>
	);
}

/** Reorders, turns, removes and adds a document's pages, then saves them all. */
export function PagesScreen({ id }: { id: string }) {
	const shared = useSharedStyles();
	const item = useLibrary((state) => state.items[id]);
	const revealed = useRevealed(item);
	if (item?.kind === "doc" && !revealed) return <LockedItem item={item} />;
	if (item?.kind !== "doc") {
		return (
			<View style={shared.screen}>
				<Header />
			</View>
		);
	}
	return <Editor doc={item} />;
}

const useStyles = makeStyles(({ colors }) => ({
	titles: { paddingHorizontal: 20, gap: 6 },
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: GAP,
		paddingTop: 18,
		paddingHorizontal: SIDE,
	},
	card: { padding: 10, gap: 8 },
	preview: {
		borderRadius: radii.sm,
		backgroundColor: colors.sunken,
		overflow: "hidden",
	},
	tools: { flexDirection: "row", justifyContent: "space-between" },
	footer: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		paddingTop: 12,
		paddingHorizontal: 16,
		gap: 10,
		backgroundColor: colors.canvas,
		borderTopWidth: 1,
		borderTopColor: colors.divider,
	},
}));
