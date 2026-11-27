import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { shareCode } from "@/components/codes/exportCode";
import { useRevealed } from "@/components/lock/hooks";
import { canLock, unlockItems } from "@/components/lock/unlock";
import { Button } from "@/components/ui/Button";
import type { IconName } from "@/components/ui/Icon";
import { ListCard, ListRow } from "@/components/ui/List";
import { Sheet, useSheetPages } from "@/components/ui/Sheet";
import { Text } from "@/components/ui/Text";
import { TextField } from "@/components/ui/TextField";
import { toast } from "@/components/ui/Toast";
import { canRender } from "@/domain/codes/formats";
import {
	countInFolder,
	isLocked,
	isPinned,
	itemCaption,
	itemTitle,
	shownTitle,
} from "@/domain/library/items";
import type { Folder, LibraryItem } from "@/domain/library/types";
import { haptics } from "@/lib/haptics";
import { shareItem } from "@/services/share";
import useLibrary from "@/stores/library";
import useLockSession from "@/stores/lockSession";
import { useTheme } from "@/theme";
import { enter } from "@/theme/motion";
import { FolderBadge } from "./FolderBadge";
import { FolderForm } from "./FolderForm";
import { FolderList, NewFolderForm } from "./FolderPicker";
import { ItemThumb } from "./ItemTile";

type Target = { type: "item"; id: string } | { type: "folder"; id: string };

type Step = "menu" | "rename" | "edit" | "confirm" | "move" | "move-create";

/** How deep each step sits, so the sheet slides forward or back. */
const depthOf = (step: Step) =>
	step === "menu" ? 0 : step === "move-create" ? 2 : 1;

type MenuRow = { key: string; icon: IconName; label: string; run: () => void };

/**
 * The long-press / ⋮ sheet of an item or a folder: rename, share, move,
 * edit, delete. Render `element` once in the screen.
 */
export function useLibraryActions({
	onDeleted,
}: {
	onDeleted?: (target: Target) => void;
} = {}) {
	const { colors } = useTheme();
	const { t } = useTranslation();
	const sheet = useRef<BottomSheetModal>(null);
	const [target, setTarget] = useState<Target | null>(null);
	const pages = useSheetPages<Step>("menu", depthOf);
	const step = pages.page;
	const setStep = pages.go;
	const [name, setName] = useState("");
	const items = useLibrary((state) => state.items);
	const folders = useLibrary((state) => state.folders);
	const renameItem = useLibrary((state) => state.renameItem);
	const moveItem = useLibrary((state) => state.moveItem);
	const deleteItem = useLibrary((state) => state.deleteItem);
	const setPinned = useLibrary((state) => state.setPinned);
	const setLocked = useLibrary((state) => state.setLocked);
	const relockItems = useLockSession((state) => state.relockItems);
	const updateFolder = useLibrary((state) => state.updateFolder);
	const moveFolder = useLibrary((state) => state.moveFolder);
	const deleteFolder = useLibrary((state) => state.deleteFolder);

	const item = target?.type === "item" ? items[target.id] : undefined;
	const folder = target?.type === "folder" ? folders[target.id] : undefined;
	const revealed = useRevealed(item);
	const title = item ? shownTitle(item, revealed) : "";
	const countIn = (id: string) => countInFolder(items, id);

	/**
	 * Runs `task` once a locked item has been unlocked (straight away for any
	 * other): renaming, sharing and deleting all need what it holds.
	 */
	const unlocked = async (subject: LibraryItem, task: () => void) => {
		if (isLocked(subject) && !(await unlockItems())) return;
		task();
	};

	const openItem = (next: LibraryItem, initialStep: Step = "menu") => {
		const open = () => {
			setTarget({ type: "item", id: next.id });
			setName(itemTitle(next));
			pages.reset(initialStep);
			sheet.current?.present();
		};
		if (initialStep === "rename") unlocked(next, open);
		else open();
	};

	const startRename = (target: LibraryItem) =>
		unlocked(target, () => {
			setName(itemTitle(target));
			setStep("rename");
		});

	const toggleLock = async (target: LibraryItem) => {
		if (isLocked(target)) {
			if (!(await unlockItems())) return;
			setLocked([target.id], false);
			toast(t("app.lock.unlocked_toast"));
		} else {
			if (!(await canLock())) {
				haptics.warning();
				toast(t("app.lock.set_up_first"), "warning");
				return;
			}
			setLocked([target.id], true);
			// Locking is "lock it now": hide it (and the others) again.
			relockItems();
			toast(t("app.lock.locked_toast"));
		}
		haptics.pop();
		close();
	};

	const openFolder = (next: Folder) => {
		setTarget({ type: "folder", id: next.id });
		pages.reset("menu");
		sheet.current?.present();
	};

	const close = () => sheet.current?.dismiss();

	/** Moves the target into `folderId` (an item) or under it (a folder). */
	const moveTo = (folderId: string | null) => {
		haptics.pop();
		if (item) moveItem(item.id, folderId);
		else if (folder) moveFolder(folder.id, folderId);
		toast(t("app.library.moved"));
		close();
	};

	const remove = (keepContents = false) => {
		if (!target) return;
		haptics.warning();
		if (target.type === "item") deleteItem(target.id);
		else deleteFolder(target.id, keepContents);
		onDeleted?.(target);
		close();
	};

	const header = (() => {
		if (item) {
			return (
				<View style={styles.header}>
					<View style={styles.thumb}>
						<ItemThumb item={item} size={52} />
					</View>
					<View style={styles.headerText}>
						<Text
							size={20}
							weight="semibold"
							tracking={-0.015}
							numberOfLines={2}
						>
							{step === "confirm"
								? t("app.common.delete_question", { name: title })
								: title}
						</Text>
						<Text size={12} mono color={colors.muted}>
							{itemCaption(item, t("app.library.document"))}
						</Text>
					</View>
				</View>
			);
		}
		if (folder) {
			return (
				<View style={styles.header}>
					<FolderBadge color={folder.color} icon={folder.icon} size={52} />
					<View style={styles.headerText}>
						<Text
							size={20}
							weight="semibold"
							tracking={-0.015}
							numberOfLines={2}
						>
							{step === "confirm"
								? t("app.common.delete_question", { name: folder.name })
								: folder.name}
						</Text>
						<Text size={12} mono color={colors.muted}>
							{t("app.library.objects", {
								count: countIn(folder.id),
							}).toUpperCase()}
						</Text>
					</View>
				</View>
			);
		}
		return null;
	})();

	const menu = (rows: MenuRow[], deleteLabel: string) => (
		<>
			{header}
			<ListCard>
				{rows.map((row, index) => (
					<Animated.View key={row.key} entering={enter.up(180 + index * 40)}>
						<ListRow
							icon={row.icon}
							label={row.label}
							chevron={row.key === "move"}
							last={index === rows.length - 1}
							onPress={row.run}
						/>
					</Animated.View>
				))}
			</ListCard>
			<Animated.View entering={enter.up(180 + rows.length * 40 + 20)}>
				<Button
					variant="danger"
					icon="trash"
					label={deleteLabel}
					onPress={() =>
						item ? unlocked(item, () => setStep("confirm")) : setStep("confirm")
					}
				/>
			</Animated.View>
		</>
	);

	const content = (() => {
		if (!item && !folder) return null;
		if (step === "move") {
			return (
				<FolderList
					current={item ? item.folderId : (folder?.parentId ?? null)}
					exclude={folder?.id}
					onPick={moveTo}
					onCreate={() => setStep("move-create")}
				/>
			);
		}
		if (step === "move-create") {
			return (
				<NewFolderForm
					parentId={null}
					submitLabel={t("app.folder.create_and_move")}
					onCreated={(created) => moveTo(created.id)}
				/>
			);
		}
		if (step === "rename" && item) {
			return (
				<>
					{header}
					<TextField
						inSheet
						value={name}
						onChangeText={setName}
						autoFocus
						maxLength={80}
						returnKeyType="done"
					/>
					<Button
						icon="check"
						label={t("app.common.save")}
						disabled={!name.trim()}
						onPress={() => {
							renameItem(item.id, name.trim());
							close();
						}}
					/>
				</>
			);
		}
		if (step === "edit" && folder) {
			return (
				<FolderForm
					initial={folder}
					title={t("app.folder.edit")}
					subtitle={t("app.library.objects", {
						count: countIn(folder.id),
					}).toUpperCase()}
					submitLabel={t("app.common.save")}
					onSubmit={(values) => {
						updateFolder(folder.id, values);
						close();
					}}
				/>
			);
		}
		if (step === "confirm") {
			return (
				<>
					{header}
					<Text size={15} leading={1.5} color={colors.body}>
						{folder ? t("app.folder.delete_body") : t("app.item.delete_body")}
					</Text>
					<View style={styles.stack}>
						{folder ? (
							<>
								<Button
									variant="secondary"
									label={t("app.folder.delete_keep")}
									onPress={() => remove(true)}
								/>
								<Button
									variant="danger"
									icon="trash"
									label={t("app.folder.delete_all")}
									onPress={() => remove(false)}
								/>
							</>
						) : (
							<Button
								variant="danger"
								icon="trash"
								label={t("app.common.delete")}
								onPress={() => remove()}
							/>
						)}
						<Button
							variant="secondary"
							label={t("app.common.cancel")}
							onPress={() => setStep("menu")}
						/>
					</View>
				</>
			);
		}
		if (item) {
			const rows: MenuRow[] = [
				{
					key: "rename",
					icon: "pencil",
					label: t("app.common.rename"),
					run: () => startRename(item),
				},
				{
					key: "share",
					icon: "share",
					label: t("app.common.share"),
					run: () =>
						unlocked(item, () => {
							shareItem(item).catch(console.error);
							close();
						}),
				},
			];
			if (item.kind === "code" && canRender(item.format)) {
				rows.push({
					key: "image",
					icon: "image",
					label: t("app.code.share_image"),
					run: () =>
						unlocked(item, () => {
							shareCode(item.format, item.data, item.style).catch(
								console.error,
							);
							close();
						}),
				});
			}
			const pinned = isPinned(item);
			rows.push(
				{
					key: "pin",
					icon: pinned ? "pinOff" : "pin",
					label: t(pinned ? "app.library.unpin" : "app.library.pin"),
					run: () => {
						haptics.pop();
						setPinned([item.id], !pinned);
						toast(
							t(pinned ? "app.library.unpinned" : "app.library.pinned_toast"),
						);
						close();
					},
				},
				{
					key: "lock",
					icon: isLocked(item) ? "unlock" : "lock",
					label: t(isLocked(item) ? "app.lock.remove_lock" : "app.lock.lock"),
					run: () => toggleLock(item),
				},
				{
					key: "move",
					icon: "folderInput",
					label: t("app.library.move_to_folder"),
					run: () => setStep("move"),
				},
			);
			return menu(rows, t("app.library.delete_from_collection"));
		}
		return menu(
			[
				{
					key: "edit",
					icon: "palette",
					label: t("app.folder.edit"),
					run: () => setStep("edit"),
				},
				{
					key: "move",
					icon: "folderInput",
					label: t("app.library.move_to_folder"),
					run: () => setStep("move"),
				},
			],
			t("app.folder.delete"),
		);
	})();

	const element = (
		<Sheet
			ref={sheet}
			inset={16}
			gap={16}
			page={pages.sheetPage}
			onDismiss={() => setTarget(null)}
		>
			{content}
		</Sheet>
	);

	return {
		openItem: (next: LibraryItem) => openItem(next),
		/** Opens straight on the rename step. */
		renameItem: (next: LibraryItem) => openItem(next, "rename"),
		openFolder,
		element,
	};
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		paddingHorizontal: 4,
	},
	thumb: { width: 52, height: 52 },
	headerText: { flex: 1, gap: 2 },
	stack: { gap: 10 },
});
