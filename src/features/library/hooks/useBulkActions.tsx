import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { mergeDocuments } from "@/components/documents/actions";
import { useFolderPicker } from "@/components/library/FolderPicker";
import { ItemThumb } from "@/components/library/ItemTile";
import { canLock, unlockItems } from "@/components/lock/unlock";
import { Button } from "@/components/ui/Button";
import { ListCard, ListRow } from "@/components/ui/List";
import { Sheet } from "@/components/ui/Sheet";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { isLocked, isPinned } from "@/domain/library/items";
import type { DocItem, LibraryItem } from "@/domain/library/types";
import { attempt } from "@/lib/attempt";
import { haptics } from "@/lib/haptics";
import { shareItems } from "@/services/share";
import useLibrary from "@/stores/library";
import useLockSession from "@/stores/lockSession";
import { makeStyles, useTheme } from "@/theme";
import { enter } from "@/theme/motion";
import { sharedFolder } from "../selection";

/** Thumbnails fanned out in the delete sheet. */
const PREVIEW = 4;
const THUMB = 52;

/**
 * What the selection bar does to the picked items: move them to a folder,
 * delete them after a confirmation, or (under "More") share, pin and merge
 * documents into one. `onDone` runs once the action is through; `onMerged`
 * gets the new document. Render `element` once in the screen.
 */
export function useBulkActions({
	onDone,
	onMerged,
}: {
	onDone: () => void;
	onMerged: (id: string) => void;
}) {
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const picker = useFolderPicker();
	const sheet = useRef<BottomSheetModal>(null);
	const moreSheet = useRef<BottomSheetModal>(null);
	const [doomed, setDoomed] = useState<LibraryItem[]>([]);
	const [picked, setPicked] = useState<LibraryItem[]>([]);
	const [merging, setMerging] = useState(false);
	const moveItems = useLibrary((state) => state.moveItems);
	const deleteItems = useLibrary((state) => state.deleteItems);
	const setPinned = useLibrary((state) => state.setPinned);
	const setLocked = useLibrary((state) => state.setLocked);
	const relockItems = useLockSession((state) => state.relockItems);

	/** Sharing, merging or deleting locked items asks to unlock them first. */
	const unlocked = async (items: LibraryItem[]) =>
		!items.some(isLocked) || (await unlockItems());

	const more = (items: LibraryItem[]) => {
		setPicked(items);
		moreSheet.current?.present();
	};

	const share = async () => {
		if (!(await unlocked(picked))) return;
		moreSheet.current?.dismiss();
		await attempt(() => shareItems(picked));
	};

	// Lock them all, unless they all are already.
	const allLocked = picked.length > 0 && picked.every(isLocked);
	const toggleLocks = async () => {
		if (allLocked) {
			if (!(await unlockItems())) return;
		} else if (!(await canLock())) {
			haptics.warning();
			toast(t("app.lock.set_up_first"), "warning");
			return;
		}
		haptics.pop();
		setLocked(
			picked.map((item) => item.id),
			!allLocked,
		);
		if (!allLocked) relockItems();
		toast(
			t(allLocked ? "app.lock.unlocked_count" : "app.lock.locked_count", {
				count: picked.length,
			}),
		);
		moreSheet.current?.dismiss();
		onDone();
	};

	// Pin them all, unless they all are already.
	const allPinned = picked.length > 0 && picked.every(isPinned);
	const togglePins = () => {
		haptics.pop();
		setPinned(
			picked.map((item) => item.id),
			!allPinned,
		);
		toast(
			t(allPinned ? "app.library.unpinned_count" : "app.library.pinned_count", {
				count: picked.length,
			}),
		);
		moreSheet.current?.dismiss();
		onDone();
	};

	const docs = picked.filter((item): item is DocItem => item.kind === "doc");
	const merge = async () => {
		if (!(await unlocked(docs))) return;
		setMerging(true);
		const id = await mergeDocuments(docs);
		setMerging(false);
		moreSheet.current?.dismiss();
		if (!id) return;
		// The merged copy holds their pages: it stays as locked as they were.
		if (docs.some(isLocked)) setLocked([id], true);
		onDone();
		onMerged(id);
	};

	const move = (items: LibraryItem[]) =>
		picker.open({
			current: sharedFolder(items),
			onPick: (folderId) => {
				moveItems(
					items.map((item) => item.id),
					folderId,
				);
				toast(t("app.library.moved_count", { count: items.length }));
				onDone();
			},
		});

	const remove = async (items: LibraryItem[]) => {
		if (!(await unlocked(items))) return;
		setDoomed(items);
		sheet.current?.present();
	};

	const confirm = () => {
		haptics.warning();
		deleteItems(doomed.map((item) => item.id));
		toast(t("app.library.deleted_count", { count: doomed.length }));
		sheet.current?.dismiss();
		onDone();
	};

	const element = (
		<>
			{picker.element}
			<Sheet ref={moreSheet} onDismiss={() => setPicked([])}>
				{picked.length > 0 && (
					<>
						<Text size={24} weight="semibold" tracking={-0.02}>
							{t("app.library.selected", { count: picked.length })}
						</Text>
						<ListCard>
							<ListRow
								icon="share"
								label={t("app.common.share")}
								onPress={share}
							/>
							<ListRow
								icon={allPinned ? "pinOff" : "pin"}
								label={t(allPinned ? "app.library.unpin" : "app.library.pin")}
								onPress={togglePins}
							/>
							<ListRow
								icon={allLocked ? "unlock" : "lock"}
								label={t(allLocked ? "app.lock.remove_lock" : "app.lock.lock")}
								last={docs.length < 2}
								onPress={toggleLocks}
							/>
							{docs.length >= 2 && (
								<ListRow
									icon="layers"
									label={t("app.document.merge", { count: docs.length })}
									description={t(
										merging
											? "app.document.merging"
											: "app.document.merge_hint",
									)}
									height={64}
									last
									onPress={merging ? undefined : merge}
								/>
							)}
						</ListCard>
					</>
				)}
			</Sheet>
			<Sheet ref={sheet} inset={16} gap={16} onDismiss={() => setDoomed([])}>
				{doomed.length > 0 && (
					<>
						<View style={styles.thumbs}>
							{doomed.slice(0, PREVIEW).map((item, index) => (
								<Animated.View
									key={item.id}
									entering={enter.pop(120 + index * 50)}
									style={[
										styles.thumb,
										index > 0 && styles.overlap,
										{ zIndex: PREVIEW - index },
									]}
								>
									<ItemThumb item={item} size={THUMB} />
								</Animated.View>
							))}
						</View>
						<View style={styles.text}>
							<Text size={20} weight="semibold" tracking={-0.015}>
								{t("app.library.delete_selected_question", {
									count: doomed.length,
								})}
							</Text>
							<Text size={15} leading={1.5} color={colors.body}>
								{t("app.item.delete_body")}
							</Text>
						</View>
						<View style={styles.stack}>
							<Button
								variant="danger"
								icon="trash"
								label={t("app.common.delete")}
								onPress={confirm}
							/>
							<Button
								variant="secondary"
								label={t("app.common.cancel")}
								onPress={() => sheet.current?.dismiss()}
							/>
						</View>
					</>
				)}
			</Sheet>
		</>
	);

	return { move, remove, more, element };
}

const useStyles = makeStyles(() => ({
	thumbs: { flexDirection: "row", paddingHorizontal: 4, paddingTop: 4 },
	thumb: { width: THUMB, height: THUMB },
	overlap: { marginLeft: -THUMB * 0.35 },
	text: { gap: 6, paddingHorizontal: 4 },
	stack: { gap: 10 },
}));
