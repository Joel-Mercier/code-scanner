import * as DocumentPicker from "expo-document-picker";
import { unlockItems } from "@/components/lock/unlock";
import { toast } from "@/components/ui/Toast";
import { InvalidBackupError } from "@/domain/library/backup";
import { isLocked } from "@/domain/library/items";
import i18n from "@/i18n";
import { attempt } from "@/lib/attempt";
import { haptics } from "@/lib/haptics";
import { readBackup, restoreFiles, writeBackup } from "@/services/backup";
import { shareFile } from "@/services/share";
import useLibrary from "@/stores/library";

const t = (key: string, options?: Record<string, unknown>) =>
	i18n.t(key, options);

/** Writes the whole collection to a .zip and opens the share sheet with it. */
export const backUpLibrary = async () => {
	const { items, folders, nextSeq } = useLibrary.getState();
	// A backup holds everything, locked items included: unlock them first.
	if (Object.values(items).some(isLocked) && !(await unlockItems())) return;
	const result = await attempt(async () => {
		const uri = await writeBackup({ items, folders, nextSeq });
		await shareFile(uri, "application/zip");
	});
	if (!result.ok) toast(t("app.backup.failed"), "warning");
};

/**
 * Picks a backup and adds what it holds to the collection; nothing already
 * here is replaced. Resolves to how many objects were added.
 */
export const restoreLibrary = async () => {
	const picked = await attempt(() =>
		DocumentPicker.getDocumentAsync({
			type: ["application/zip", "application/x-zip-compressed"],
			copyToCacheDirectory: true,
		}),
	);
	if (!picked.ok || picked.value.canceled) return;
	const result = await attempt(async () => {
		const { library, entries } = await readBackup(
			picked.value.assets?.[0].uri ?? "",
		);
		const added = useLibrary.getState().restore(library);
		await restoreFiles(added, entries);
		return added.length;
	});
	if (!result.ok) {
		toast(
			t(
				result.error instanceof InvalidBackupError
					? "app.backup.invalid"
					: "app.backup.restore_failed",
			),
			"warning",
		);
		return;
	}
	haptics.success();
	toast(
		result.value > 0
			? t("app.backup.restored", { count: result.value })
			: t("app.backup.nothing_new"),
	);
};
