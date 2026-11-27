import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { useFolderPicker } from "@/components/library/FolderPicker";
import { ItemThumb } from "@/components/library/ItemTile";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import type { LibraryItem } from "@/domain/library/types";
import { haptics } from "@/lib/haptics";
import useLibrary from "@/stores/library";
import { makeStyles, useTheme } from "@/theme";
import { enter } from "@/theme/motion";
import { sharedFolder } from "../selection";

/** Thumbnails fanned out in the delete sheet. */
const PREVIEW = 4;
const THUMB = 52;

/**
 * What the selection bar does to the picked items: move them to a folder, or
 * delete them after a confirmation. `onDone` runs once they're moved or gone.
 * Render `element` once in the screen.
 */
export function useBulkActions({ onDone }: { onDone: () => void }) {
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const picker = useFolderPicker();
	const sheet = useRef<BottomSheetModal>(null);
	const [doomed, setDoomed] = useState<LibraryItem[]>([]);
	const moveItems = useLibrary((state) => state.moveItems);
	const deleteItems = useLibrary((state) => state.deleteItems);

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

	const remove = (items: LibraryItem[]) => {
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

	return { move, remove, element };
}

const useStyles = makeStyles(() => ({
	thumbs: { flexDirection: "row", paddingHorizontal: 4, paddingTop: 4 },
	thumb: { width: THUMB, height: THUMB },
	overlap: { marginLeft: -THUMB * 0.35 },
	text: { gap: 6, paddingHorizontal: 4 },
	stack: { gap: 10 },
}));
