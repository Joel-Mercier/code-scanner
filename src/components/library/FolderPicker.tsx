import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ListCard } from "@/components/ui/List";
import { Pressable } from "@/components/ui/Pressable";
import { Sheet, useSheetPages } from "@/components/ui/Sheet";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { flattenFolderTree } from "@/domain/library/folders";
import type { Folder, LibraryItem } from "@/domain/library/types";
import { haptics } from "@/lib/haptics";
import useLibrary from "@/stores/library";
import { makeStyles, useSharedStyles, useTheme } from "@/theme";
import { enter, stagger } from "@/theme/motion";
import { FolderBadge } from "./FolderBadge";
import { FolderForm } from "./FolderForm";

type PickRequest = {
	current: string | null;
	/** Folder that cannot be picked, with its descendants (when moving a folder). */
	exclude?: string;
	onPick: (folderId: string | null) => void;
};

/** The folder tree to pick from, with "New folder" at the bottom. */
export function FolderList({
	current,
	exclude,
	onPick,
	onCreate,
}: {
	current: string | null;
	/** Folder that cannot be picked, with its descendants (when moving a folder). */
	exclude?: string;
	onPick: (folderId: string | null) => void;
	onCreate: () => void;
}) {
	const shared = useSharedStyles();
	const styles = useStyles();
	const { t } = useTranslation();
	const folders = useLibrary((state) => state.folders);
	const rows = flattenFolderTree(folders, exclude);
	return (
		<>
			<Text size={24} weight="semibold" tracking={-0.02}>
				{t("app.library.move_to_folder")}
			</Text>
			<ListCard>
				<Row
					label={t("app.library.title")}
					badge={
						<View style={[shared.iconTile, styles.root]}>
							<Icon name="grid" size={16} />
						</View>
					}
					depth={0}
					selected={current === null}
					last={rows.length === 0}
					index={0}
					onPress={() => onPick(null)}
				/>
				{rows.map(({ folder, depth }, index) => (
					<Row
						key={folder.id}
						label={folder.name}
						badge={<FolderBadge color={folder.color} icon={folder.icon} />}
						depth={depth}
						selected={current === folder.id}
						last={index === rows.length - 1}
						index={index + 1}
						onPress={() => onPick(folder.id)}
					/>
				))}
			</ListCard>
			<Button
				variant="secondary"
				icon="folderPlus"
				label={t("app.folder.new")}
				onPress={onCreate}
			/>
		</>
	);
}

/**
 * Creates a folder inside `parentId`. The subtitle says where; at the root
 * of the collection there is nothing to say.
 */
export function NewFolderForm({
	parentId,
	submitLabel,
	onCreated,
}: {
	parentId: string | null;
	submitLabel?: string;
	onCreated: (folder: Folder) => void;
}) {
	const { t } = useTranslation();
	const parent = useLibrary((state) =>
		parentId ? state.folders[parentId] : undefined,
	);
	const createFolder = useLibrary((state) => state.createFolder);
	return (
		<FolderForm
			title={t("app.folder.new")}
			subtitle={
				parent
					? t("app.folder.inside", { name: parent.name }).toUpperCase()
					: undefined
			}
			submitLabel={submitLabel ?? t("app.folder.create")}
			onSubmit={(values) => onCreated(createFolder({ ...values, parentId }))}
		/>
	);
}

/** A sheet to pick a folder from, which can morph into a new folder form. */
export function useFolderPicker() {
	const { t } = useTranslation();
	const sheet = useRef<BottomSheetModal>(null);
	const [request, setRequest] = useState<PickRequest | null>(null);
	const pages = useSheetPages<"pick" | "create">("pick", (page) =>
		page === "pick" ? 0 : 1,
	);

	const open = (next: PickRequest) => {
		setRequest(next);
		pages.reset("pick");
		sheet.current?.present();
	};

	const pick = (folderId: string | null) => {
		haptics.pop();
		request?.onPick(folderId);
		sheet.current?.dismiss();
	};

	const element = (
		<Sheet
			ref={sheet}
			page={pages.sheetPage}
			onDismiss={() => setRequest(null)}
		>
			{pages.page === "create" ? (
				<NewFolderForm
					parentId={null}
					submitLabel={t("app.folder.create_and_move")}
					onCreated={(folder) => pick(folder.id)}
				/>
			) : (
				<FolderList
					current={request?.current ?? null}
					exclude={request?.exclude}
					onPick={pick}
					onCreate={() => pages.go("create")}
				/>
			)}
		</Sheet>
	);

	return { open, element };
}

/** A folder picker that moves an item into the picked folder. */
export function useMoveToFolder() {
	const { t } = useTranslation();
	const picker = useFolderPicker();
	const moveItem = useLibrary((state) => state.moveItem);
	return {
		open: (item: LibraryItem) =>
			picker.open({
				current: item.folderId,
				onPick: (folderId) => {
					moveItem(item.id, folderId);
					toast(t("app.library.moved"));
				},
			}),
		element: picker.element,
	};
}

function Row({
	label,
	badge,
	depth,
	selected,
	last,
	index,
	onPress,
}: {
	label: string;
	badge: React.ReactNode;
	depth: number;
	selected: boolean;
	last: boolean;
	index: number;
	onPress: () => void;
}) {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	return (
		<Animated.View entering={enter.up(stagger(index, 40, 180))}>
			<Pressable
				accessibilityRole="button"
				accessibilityState={{ selected }}
				onPress={onPress}
				pressedScale={0.98}
				style={[styles.row, !last && shared.divider]}
			>
				<View style={[styles.rowContent, { marginLeft: depth * 24 }]}>
					{badge}
					<Text
						size={16}
						weight={selected ? "medium" : "regular"}
						numberOfLines={1}
						style={styles.label}
					>
						{label}
					</Text>
					{selected && (
						<Icon
							name="check"
							size={18}
							color={colors.accent}
							strokeWidth={2.4}
						/>
					)}
				</View>
			</Pressable>
		</Animated.View>
	);
}

const useStyles = makeStyles(() => ({
	row: { minHeight: 60, justifyContent: "center" },
	rowContent: { flexDirection: "row", alignItems: "center", gap: 12 },
	label: { flex: 1 },
	root: { width: 32, height: 32, borderRadius: 10 },
}));
