import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { LegendList } from "@legendapp/list/react-native";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";
import { NewFolderForm } from "@/components/library/FolderPicker";
import { folderHref, itemHref } from "@/components/library/hrefs";
import { fullTileHeight, ItemTile } from "@/components/library/ItemTile";
import { useLibraryActions } from "@/components/library/useLibraryActions";
import { Header } from "@/components/ui/Header";
import { IconButton } from "@/components/ui/IconButton";
import { Pressable } from "@/components/ui/Pressable";
import {
	SELECTION_BAR_GAP,
	SELECTION_BAR_HEIGHT,
	SelectionBar,
} from "@/components/ui/SelectionBar";
import { Sheet } from "@/components/ui/Sheet";
import { StatusBar } from "@/components/ui/StatusBar";
import { Tabs } from "@/components/ui/Tabs";
import { Eyebrow, LargeTitle, Text } from "@/components/ui/Text";
import { folderAncestors } from "@/domain/library/folders";
import { countInFolder, sortByRecent } from "@/domain/library/items";
import type { LibraryItem } from "@/domain/library/types";
import { haptics } from "@/lib/haptics";
import useLibrary from "@/stores/library";
import {
	makeStyles,
	radii,
	useScreenInsets,
	useSharedStyles,
	useTheme,
} from "@/theme";
import { enter, stagger } from "@/theme/motion";
import { Breadcrumbs } from "./components/Breadcrumbs";
import { FolderCard } from "./components/FolderCard";
import { KindStrip } from "./components/KindStrip";
import { SearchField } from "./components/SearchField";
import { useBulkActions } from "./hooks/useBulkActions";
import {
	COLUMNS,
	type Filter,
	type Kind,
	kindOf,
	matchesFilter,
	matchesFolder,
	matchesQuery,
	stripKinds,
	toRows,
} from "./rows";
import {
	allSelected,
	emptySelection,
	type Selection,
	selectedIn,
	toggleSelected,
} from "./selection";

const SIDE = 16;
const COLUMN_GAP = 12;
const ROW_GAP = 18;
// A month label: space above, one line, space below.
const HEADING = { above: 22, size: 11, leading: 1.4, below: 12 };

/**
 * The collection (`folderId` null) or one folder: its subfolders, then its
 * items by month. Filter by tab or by kind, or search everything. A long
 * press on an item starts a multi-select, with bulk actions in a bar at the
 * bottom; a long press on a folder opens its actions.
 */
export function LibraryScreen({ folderId }: { folderId: string | null }) {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const router = useRouter();
	const navigation = useNavigation();
	const edges = useScreenInsets();
	const { width, fontScale } = useWindowDimensions();
	const [filter, setFilter] = useState<Filter>("all");
	const [kind, setKind] = useState<Kind | null>(null);
	const [searching, setSearching] = useState(false);
	const [query, setQuery] = useState("");
	const [selection, setSelection] = useState<Selection>(emptySelection);
	const items = useLibrary((state) => state.items);
	const folders = useLibrary((state) => state.folders);
	const newFolderSheet = useRef<BottomSheetModal>(null);
	const actions = useLibraryActions({
		onDeleted: (target) => {
			if (target.type === "folder" && target.id === folderId) router.back();
		},
	});

	const clearSelection = () => setSelection(emptySelection);
	const bulk = useBulkActions({
		onDone: clearSelection,
		onMerged: (id) =>
			router.push({ pathname: "/document/[id]", params: { id } }),
	});

	const openSearch = () => {
		setSearching(true);
		clearSelection();
	};

	const closeSearch = () => {
		setSearching(false);
		setQuery("");
		clearSelection();
	};

	const hasSelection = selection.size > 0;
	// Android's back button leaves the selection, then the search, before
	// leaving the screen.
	useFocusEffect(
		useCallback(() => {
			if (!searching && !hasSelection) return;
			const subscription = BackHandler.addEventListener(
				"hardwareBackPress",
				() => {
					if (hasSelection) {
						setSelection(emptySelection);
					} else {
						setSearching(false);
						setQuery("");
					}
					return true;
				},
			);
			return () => subscription.remove();
		}, [searching, hasSelection]),
	);

	const folder = folderId ? folders[folderId] : undefined;
	const allItems = Object.values(items);
	const scope = folderId
		? allItems.filter((item) => item.folderId === folderId)
		: allItems;
	const found = new Set(scope.map(kindOf));
	const needle = query.trim();
	const filtering = searching && needle.length > 0;
	// A search looks through everything, whatever the tabs and kinds say.
	const activeFilter: Filter = searching ? "all" : filter;
	const activeKind = searching ? null : kind;

	const visibleItems =
		activeFilter === "folders"
			? []
			: sortByRecent(
					allItems.filter(
						(item) =>
							matchesFilter(item, activeFilter) &&
							(!activeKind || kindOf(item) === activeKind) &&
							(filtering
								? matchesQuery(item, needle)
								: item.folderId === folderId),
					),
				);
	// Folders show on All and Folders, unless a kind narrows things down. A
	// search looks through every folder, like it does through every item.
	const showFolders =
		!activeKind && (activeFilter === "all" || activeFilter === "folders");
	const childFolders = showFolders
		? Object.values(folders)
				.filter((candidate) =>
					filtering
						? matchesFolder(candidate, needle)
						: candidate.parentId === folderId,
				)
				.sort((a, b) => a.name.localeCompare(b.name))
		: [];

	// "Collection / Travel /": the folders above this one, from the root down.
	const trail = folder
		? [
				{ id: null, name: t("app.library.title") },
				...folderAncestors(folders, folder).map(({ id, name }) => ({
					id,
					name,
				})),
			]
		: [];

	const tile = (width - SIDE * 2 - COLUMN_GAP * (COLUMNS - 1)) / COLUMNS;
	// Rows have exact heights, so the list never places one from a guess
	// (a guessed month label left a gap above its tiles).
	const headingHeight =
		HEADING.above + HEADING.size * HEADING.leading * fontScale + HEADING.below;
	const itemRowHeight = fullTileHeight(tile, fontScale) + ROW_GAP;
	const rows = toRows(
		visibleItems,
		t("app.library.this_month"),
		t("app.library.pinned"),
	);

	// Only what's on screen counts as picked (items deleted meanwhile drop out).
	const picked = selectedIn(visibleItems, selection);
	const selecting = picked.length > 0;
	const everythingPicked = allSelected(visibleItems, selection);

	const toggle = (item: LibraryItem) =>
		setSelection((current) => toggleSelected(current, item.id));

	const toggleAll = () =>
		setSelection(
			everythingPicked
				? emptySelection
				: new Set(visibleItems.map((item) => item.id)),
		);

	const selectKind = (next: Kind | null) => {
		setKind(next);
		clearSelection();
		if (!next) return;
		// Keep the tab from hiding what the kind shows.
		if (
			filter === "folders" ||
			(next === "doc" && filter === "codes") ||
			(next !== "doc" && filter === "docs")
		) {
			setFilter("all");
		}
	};

	const selectFilter = (next: Filter) => {
		setFilter(next);
		clearSelection();
		if (
			next === "folders" ||
			(next === "codes" && kind === "doc") ||
			(next === "docs" && kind !== null && kind !== "doc")
		) {
			setKind(null);
		}
	};

	/** Back up the stack to a folder above, or swap this screen for it. */
	const openAncestor = (targetId: string | null) => {
		const state = navigation.getState();
		if (state) {
			for (let index = state.index - 1; index >= 0; index--) {
				const route = state.routes[index];
				const params = route.params as { folderId?: string } | undefined;
				const match =
					targetId === null
						? route.name === "library/index"
						: route.name === "library/[folderId]" &&
							params?.folderId === targetId;
				if (match) {
					router.dismiss(state.index - index);
					return;
				}
			}
		}
		router.replace(folderHref(targetId));
	};

	const folderCards = childFolders.length > 0 && (
		<View key={`folders-${filter}`} style={styles.folders}>
			{childFolders.map((child, index) => (
				<FolderCard
					key={child.id}
					folder={child}
					count={countInFolder(items, child.id)}
					index={index}
					disabled={selecting}
					onPress={() => router.push(folderHref(child.id))}
					onLongPress={() => actions.openFolder(child)}
				/>
			))}
		</View>
	);

	// While searching, only the results: matching folders, then items.
	const header = searching ? (
		folderCards || null
	) : (
		<View>
			<Animated.View entering={enter.up()} style={styles.titles}>
				{trail.length > 0 && (
					<Breadcrumbs trail={trail} onOpen={openAncestor} />
				)}
				<LargeTitle numberOfLines={2}>
					{folder ? folder.name : t("app.library.title")}
				</LargeTitle>
				<Text size={12} mono color={colors.muted}>
					{t("app.library.summary", {
						objects: t("app.library.objects", { count: scope.length }),
						found: found.size,
						total: stripKinds(found).length,
					}).toUpperCase()}
				</Text>
			</Animated.View>

			<Animated.View entering={enter.up(60)}>
				<KindStrip found={found} selected={kind} onSelect={selectKind} />
			</Animated.View>

			<Animated.View entering={enter.up(100)} style={styles.tabs}>
				<Tabs
					value={filter}
					onChange={selectFilter}
					options={[
						{ value: "all", label: t("app.library.all") },
						{ value: "codes", label: t("app.library.codes") },
						{ value: "docs", label: t("app.library.docs") },
						{ value: "folders", label: t("app.library.folders") },
					]}
				/>
			</Animated.View>

			{folderCards}
		</View>
	);

	const emptyLabel = filtering
		? t("app.library.no_results")
		: activeFilter === "folders"
			? t("app.library.no_folders")
			: folderId
				? t("app.library.empty_folder")
				: t("app.library.empty_title");
	// Subfolders are content too: a folder holding only folders isn't empty.
	const showEmpty = rows.length === 0 && childFolders.length === 0;

	return (
		<View style={shared.screen}>
			<StatusBar />
			<Header
				left={
					searching ? (
						<SearchField value={query} onChange={setQuery} />
					) : undefined
				}
				right={
					selecting ? (
						<Pressable
							accessibilityRole="button"
							onPress={toggleAll}
							haptic
							style={styles.selectAll}
						>
							<Text size={14} weight="medium">
								{everythingPicked
									? t("app.library.deselect_all")
									: t("app.library.select_all")}
							</Text>
						</Pressable>
					) : searching ? (
						<IconButton
							icon="close"
							accessibilityLabel={t("app.library.close_search")}
							onPress={closeSearch}
						/>
					) : (
						<>
							<IconButton
								icon="search"
								accessibilityLabel={t("app.library.search")}
								onPress={openSearch}
							/>
							<IconButton
								icon="folderPlus"
								accessibilityLabel={t("app.folder.new")}
								onPress={() => newFolderSheet.current?.present()}
							/>
						</>
					)
				}
			/>
			<LegendList
				data={rows}
				keyExtractor={(row) => row.key}
				getItemType={(row) => row.type}
				getFixedItemSize={(row) =>
					row.type === "heading" ? headingHeight : itemRowHeight
				}
				extraData={[itemRowHeight, selection]}
				ListHeaderComponent={header}
				ListEmptyComponent={
					showEmpty ? (
						<Animated.View entering={enter.fade(200)} style={styles.empty}>
							<Text size={15} weight="medium" align="center">
								{emptyLabel}
							</Text>
							{!filtering && activeFilter !== "folders" && (
								<Text
									size={14}
									leading={1.45}
									color={colors.muted}
									align="center"
								>
									{t("app.library.empty_body")}
								</Text>
							)}
						</Animated.View>
					) : null
				}
				contentContainerStyle={[
					edges.content,
					selecting && {
						paddingBottom:
							edges.bottom + SELECTION_BAR_HEIGHT + SELECTION_BAR_GAP,
					},
				]}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="on-drag"
				renderItem={({ item: row }) =>
					row.type === "heading" ? (
						<View style={[styles.heading, { height: headingHeight }]}>
							<Eyebrow
								weight="medium"
								leading={HEADING.leading}
								numberOfLines={1}
							>
								{row.label}
							</Eyebrow>
						</View>
					) : (
						<View style={[styles.itemRow, { height: itemRowHeight }]}>
							{row.items.map((item, index) => (
								<ItemTile
									key={item.id}
									item={item}
									size={tile}
									delay={stagger(row.offset + index, 40, 0, 9)}
									selecting={selecting}
									selected={selection.has(item.id)}
									onPress={() =>
										selecting ? toggle(item) : router.push(itemHref(item))
									}
									onLongPress={() => {
										haptics.pop();
										toggle(item);
									}}
								/>
							))}
						</View>
					)
				}
			/>
			<Sheet ref={newFolderSheet}>
				<NewFolderForm
					parentId={folderId}
					onCreated={() => newFolderSheet.current?.dismiss()}
				/>
			</Sheet>
			{selecting && (
				<SelectionBar
					label={t("app.library.selected", { count: picked.length })}
					onCancel={clearSelection}
					actions={[
						{
							key: "move",
							icon: "folderInput",
							label: t("app.library.move"),
							onPress: () => bulk.move(picked),
						},
						{
							key: "delete",
							icon: "trash",
							label: t("app.common.delete"),
							tone: "danger",
							onPress: () => bulk.remove(picked),
						},
						{
							key: "more",
							icon: "more",
							label: t("app.library.more"),
							onPress: () => bulk.more(picked),
						},
					]}
				/>
			)}
			{actions.element}
			{bulk.element}
		</View>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	titles: { paddingHorizontal: 20, gap: 4 },
	tabs: { marginTop: 16, marginHorizontal: 20 },
	folders: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
		paddingTop: 14,
		paddingHorizontal: SIDE,
	},
	heading: {
		justifyContent: "flex-end",
		paddingBottom: HEADING.below,
		paddingHorizontal: 20,
	},
	itemRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: COLUMN_GAP,
		paddingHorizontal: SIDE,
	},
	empty: { paddingTop: 48, paddingHorizontal: 40, gap: 8 },
	selectAll: {
		height: 46,
		paddingHorizontal: 18,
		borderRadius: radii.pill,
		justifyContent: "center",
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
	},
}));
