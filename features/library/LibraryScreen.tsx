import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { LegendList } from "@legendapp/list/react-native";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";
import { Header } from "@/components/ui/Header";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Pressable } from "@/components/ui/Pressable";
import { Sheet } from "@/components/ui/Sheet";
import { StatusBar } from "@/components/ui/StatusBar";
import { Tabs } from "@/components/ui/Tabs";
import { Eyebrow, LargeTitle, Text } from "@/components/ui/Text";
import { TextField } from "@/components/ui/TextField";
import { describeItem, kindIcons } from "@/features/codes/kinds";
import useLibrary, {
	type Folder,
	type LibraryItem,
	sortByRecent,
} from "@/stores/library";
import {
	boxShadow,
	HEADER_ROW,
	makeStyles,
	radii,
	useScreenInsets,
	useSharedStyles,
	useTheme,
} from "@/theme";
import { enter, stagger } from "@/theme/motion";
import { format } from "@/utils/date";
import { haptics } from "@/utils/haptics";
import { FolderBadge } from "./FolderForm";
import { fullTileHeight, ItemTile } from "./ItemTile";
import { itemTitle } from "./itemText";
import { NewFolderForm } from "./useFolderPicker";
import { useLibraryActions } from "./useLibraryActions";

type Filter = "all" | "codes" | "docs" | "folders";
type Kind = keyof typeof kindIcons;

const KINDS: Kind[] = [
	"url",
	"text",
	"wifi",
	"email",
	"phone",
	"sms",
	"vcard",
	"event",
	"geoPoint",
	"barcode",
	"doc",
];

const SIDE = 16;
const COLUMN_GAP = 12;
const ROW_GAP = 18;
// A month label: space above, one line, space below.
const HEADING = { above: 22, size: 11, leading: 1.4, below: 12 };

type Row =
	| { type: "heading"; key: string; label: string }
	| { type: "items"; key: string; items: LibraryItem[]; offset: number };

const kindOf = (item: LibraryItem): Kind =>
	item.kind === "doc" ? "doc" : describeItem(item).kind;

const matchesFilter = (item: LibraryItem, filter: Filter) =>
	filter === "all" ||
	(filter === "codes" ? item.kind === "code" : item.kind === "doc");

const matchesFolder = (folder: Folder, query: string) =>
	folder.name.toLowerCase().includes(query.toLowerCase());

const matchesQuery = (item: LibraryItem, query: string) => {
	const needle = query.toLowerCase();
	if (itemTitle(item).toLowerCase().includes(needle)) return true;
	if (item.kind === "code") {
		return (
			item.data.toLowerCase().includes(needle) ||
			describeItem(item).subtitle.toLowerCase().includes(needle)
		);
	}
	return false;
};

/** Groups items by month, then into rows of three. */
const toRows = (items: LibraryItem[], thisMonth: string): Row[] => {
	const rows: Row[] = [];
	let month = "";
	let bucket: LibraryItem[] = [];
	let offset = 0;
	const flush = () => {
		for (let i = 0; i < bucket.length; i += 3) {
			rows.push({
				type: "items",
				key: `${month}-${i}`,
				items: bucket.slice(i, i + 3),
				offset: offset + i,
			});
		}
		offset += bucket.length;
		bucket = [];
	};
	for (const item of items) {
		const key = format(item.createdAt, "yyyy-MM");
		if (key !== month) {
			flush();
			month = key;
			rows.push({
				type: "heading",
				key: `heading-${key}`,
				label:
					key === format(Date.now(), "yyyy-MM")
						? thisMonth
						: format(item.createdAt, "MMMM yyyy"),
			});
		}
		bucket.push(item);
	}
	flush();
	return rows;
};

/**
 * Every kind of object, lit when the collection holds one. Tapping a lit
 * kind shows only that kind; tapping it again shows everything.
 */
function KindStrip({
	found,
	selected,
	onSelect,
}: {
	found: Set<Kind>;
	selected: Kind | null;
	onSelect: (kind: Kind | null) => void;
}) {
	const { colors, shadows } = useTheme();
	const shared = useSharedStyles();
	const styles = useStyles();
	const { t } = useTranslation();
	return (
		<View style={styles.kinds}>
			{KINDS.map((kind) => {
				const has = found.has(kind);
				const active = kind === selected;
				const label = t(
					kind === "doc" ? "app.library.document" : `app.kinds.${kind}`,
				);
				return (
					<Pressable
						key={kind}
						accessibilityRole="button"
						accessibilityLabel={
							has ? label : t("app.library.kind_missing", { kind: label })
						}
						accessibilityState={{ selected: active, disabled: !has }}
						disabled={!has}
						pressedScale={0.9}
						onPress={() => {
							haptics.select();
							onSelect(active ? null : kind);
						}}
						style={[
							shared.center,
							styles.kind,
							!has
								? shared.dashed
								: active
									? styles.kindActive
									: [styles.kindFound, boxShadow(shadows.chip)],
							selected && !active && styles.kindDimmed,
						]}
					>
						{has && (
							<Icon
								name={kindIcons[kind]}
								size={14}
								color={active ? colors.canvas : colors.ink}
							/>
						)}
					</Pressable>
				);
			})}
		</View>
	);
}

/** "Collection / Travel /": the folders above this one, each a way back. */
function Breadcrumbs({
	trail,
	onOpen,
}: {
	trail: { id: string | null; name: string }[];
	onOpen: (folderId: string | null) => void;
}) {
	const { colors } = useTheme();
	const styles = useStyles();
	return (
		<View accessibilityRole="toolbar" style={styles.crumbs}>
			{trail.map((crumb) => (
				<View key={crumb.id ?? "root"} style={styles.crumb}>
					<Pressable
						accessibilityRole="link"
						onPress={() => onOpen(crumb.id)}
						hitSlop={8}
						style={styles.crumbLink}
					>
						<Text size={12} mono color={colors.muted} numberOfLines={1}>
							{crumb.name.toUpperCase()}
						</Text>
					</Pressable>
					<Icon name="chevronRight" size={13} color={colors.faint} />
				</View>
			))}
		</View>
	);
}

function FolderCard({
	folder,
	count,
	index,
	onPress,
	onLongPress,
}: {
	folder: Folder;
	count: number;
	index: number;
	onPress: () => void;
	onLongPress: () => void;
}) {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	return (
		<Animated.View
			entering={enter.pop(stagger(index, 50))}
			style={styles.folderCell}
		>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={folder.name}
				onPress={onPress}
				onLongPress={onLongPress}
				haptic
				style={[shared.card, styles.folder]}
			>
				<FolderBadge color={folder.color} icon={folder.icon} />
				<Text size={15} weight="medium" numberOfLines={1} style={shared.flex}>
					{folder.name}
				</Text>
				<Text size={12} mono color={colors.muted}>
					{count}
				</Text>
			</Pressable>
		</Animated.View>
	);
}

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
	const items = useLibrary((state) => state.items);
	const folders = useLibrary((state) => state.folders);
	const newFolderSheet = useRef<BottomSheetModal>(null);
	const actions = useLibraryActions({
		onDeleted: (target) => {
			if (target.type === "folder" && target.id === folderId) router.back();
		},
	});

	const closeSearch = () => {
		setSearching(false);
		setQuery("");
	};

	// Android's back button leaves the search before leaving the screen.
	useFocusEffect(
		useCallback(() => {
			if (!searching) return;
			const subscription = BackHandler.addEventListener(
				"hardwareBackPress",
				() => {
					setSearching(false);
					setQuery("");
					return true;
				},
			);
			return () => subscription.remove();
		}, [searching]),
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
	const countIn = (id: string) =>
		allItems.filter((item) => item.folderId === id).length;

	// The folders above this one, from the root down.
	const trail: { id: string | null; name: string }[] = [];
	for (
		let parent = folder?.parentId ? folders[folder.parentId] : undefined;
		parent;
		parent = parent.parentId ? folders[parent.parentId] : undefined
	) {
		trail.unshift({ id: parent.id, name: parent.name });
	}
	if (folder) trail.unshift({ id: null, name: t("app.library.title") });

	const tile = (width - SIDE * 2 - COLUMN_GAP * 2) / 3;
	// Rows have exact heights, so the list never places one from a guess
	// (a guessed month label left a gap above its tiles).
	const headingHeight =
		HEADING.above + HEADING.size * HEADING.leading * fontScale + HEADING.below;
	const itemRowHeight = fullTileHeight(tile, fontScale) + ROW_GAP;
	const rows = toRows(visibleItems, t("app.library.this_month"));

	const selectKind = (next: Kind | null) => {
		setKind(next);
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
		router.replace(
			targetId
				? { pathname: "/library/[folderId]", params: { folderId: targetId } }
				: "/library",
		);
	};

	const openItem = (item: LibraryItem) =>
		router.push(
			item.kind === "doc"
				? { pathname: "/document/[id]", params: { id: item.id } }
				: { pathname: "/code/[id]", params: { id: item.id } },
		);

	const folderCards = childFolders.length > 0 && (
		<View key={`folders-${filter}`} style={styles.folders}>
			{childFolders.map((child, index) => (
				<FolderCard
					key={child.id}
					folder={child}
					count={countIn(child.id)}
					index={index}
					onPress={() =>
						router.push({
							pathname: "/library/[folderId]",
							params: { folderId: child.id },
						})
					}
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
						total: KINDS.length,
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
						<Animated.View entering={enter.fade()} style={shared.flex}>
							<View style={[shared.row, styles.searchField]}>
								<Icon name="search" size={18} color={colors.muted} />
								<TextField
									value={query}
									onChangeText={setQuery}
									placeholder={t("app.library.search")}
									autoFocus
									returnKeyType="search"
									autoCorrect={false}
									style={styles.searchInput}
								/>
							</View>
						</Animated.View>
					) : undefined
				}
				right={
					searching ? (
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
								onPress={() => setSearching(true)}
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
				extraData={itemRowHeight}
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
				contentContainerStyle={edges.content}
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
									onPress={() => openItem(item)}
									onLongPress={() => actions.openItem(item)}
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
			{actions.element}
		</View>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	titles: { paddingHorizontal: 20, gap: 4 },
	crumbs: {
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "center",
		marginBottom: 4,
	},
	crumb: { flexDirection: "row", alignItems: "center", gap: 2 },
	crumbLink: { paddingVertical: 4, paddingRight: 2, maxWidth: 180 },
	searchField: {
		height: HEADER_ROW,
		paddingLeft: 16,
		gap: 8,
		borderRadius: HEADER_ROW / 2,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
	},
	searchInput: {
		flex: 1,
		minHeight: 0,
		height: HEADER_ROW - 2,
		paddingHorizontal: 0,
		paddingRight: 16,
		borderWidth: 0,
		backgroundColor: "transparent",
	},
	kinds: {
		flexDirection: "row",
		gap: 4,
		paddingTop: 14,
		paddingHorizontal: 20,
	},
	kind: { flex: 1, aspectRatio: 1, borderRadius: 9 },
	kindFound: { backgroundColor: colors.surface },
	kindActive: { backgroundColor: colors.ink },
	kindDimmed: { opacity: 0.45 },
	tabs: { marginTop: 16, marginHorizontal: 20 },
	folders: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
		paddingTop: 14,
		paddingHorizontal: SIDE,
	},
	folderCell: { width: "48%", flexGrow: 1 },
	folder: {
		height: 60,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 14,
		borderRadius: radii.md,
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
}));
