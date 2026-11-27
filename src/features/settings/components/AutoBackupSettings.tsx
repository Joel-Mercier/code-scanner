import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { unlockItems } from "@/components/lock/unlock";
import { IconButton } from "@/components/ui/IconButton";
import { ListCard, ListRow } from "@/components/ui/List";
import { Switch } from "@/components/ui/Switch";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import {
	formatMinuteOfDay,
	KEEP_MAX,
	KEEP_MIN,
} from "@/domain/library/autoBackup";
import { isLocked } from "@/domain/library/items";
import { timeAgo } from "@/lib/date";
import { haptics } from "@/lib/haptics";
import { folderLabel } from "@/lib/saf";
import {
	canWriteFolder,
	type FolderProblem,
	isAutoBackupAvailable,
	pickBackupFolder,
} from "@/services/autoBackup";
import useAutoBackupStatus from "@/stores/autoBackupStatus";
import useLibrary from "@/stores/library";
import useSettings from "@/stores/settings";
import { makeStyles, useTheme } from "@/theme";
import { runAutoBackup } from "../autoBackup";

const timeOfDay = (minuteOfDay: number) => {
	const date = new Date();
	date.setHours(Math.floor(minuteOfDay / 60), minuteOfDay % 60, 0, 0);
	return date;
};

/**
 * Automatic backups (Android): on / off, the folder, the time, how many to
 * keep, and "Back up now". Renders nothing where they aren't available.
 */
export function AutoBackupSettings() {
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const enabled = useSettings((state) => state.autoBackup);
	const setEnabled = useSettings((state) => state.setAutoBackup);
	const folder = useSettings((state) => state.autoBackupFolder);
	const setFolder = useSettings((state) => state.setAutoBackupFolder);
	const minute = useSettings((state) => state.autoBackupMinute);
	const setMinute = useSettings((state) => state.setAutoBackupMinute);
	const keep = useSettings((state) => state.autoBackupKeep);
	const setKeep = useSettings((state) => state.setAutoBackupKeep);
	const status = useAutoBackupStatus();
	const anyLocked = useLibrary((state) =>
		Object.values(state.items).some(isLocked),
	);
	const [problem, setProblem] = useState<FolderProblem | null>(null);
	const [writable, setWritable] = useState(true);
	const [backingUp, setBackingUp] = useState(false);

	// Checked again after each run, so a folder that went away shows here.
	// biome-ignore lint/correctness/useExhaustiveDependencies: each run is a trigger too
	useEffect(() => {
		setWritable(folder ? canWriteFolder(folder) : true);
	}, [folder, status.lastAttemptAt]);

	if (!isAutoBackupAvailable()) return null;

	/**
	 * Backups hold locked items too, unencrypted, and run unattended: choosing
	 * where they go asks first, like a backup made by hand.
	 */
	const allowed = async () => !anyLocked || (await unlockItems());

	const chooseFolder = async () => {
		if (!(await allowed())) return false;
		const picked = await pickBackupFolder();
		if (!picked) return false;
		if ("problem" in picked) {
			haptics.warning();
			setProblem(picked.problem);
			return false;
		}
		setProblem(null);
		setFolder(picked.uri);
		return true;
	};

	const toggle = async (next: boolean) => {
		if (next) {
			if (!folder && !(await chooseFolder())) return;
			if (folder && !(await allowed())) return;
		}
		setEnabled(next);
	};

	const pickTime = () =>
		DateTimePickerAndroid.open({
			value: timeOfDay(minute),
			mode: "time",
			is24Hour: true,
			onValueChange: (_, date) => {
				if (date) setMinute(date.getHours() * 60 + date.getMinutes());
			},
		});

	const backUpNow = async () => {
		if (backingUp) return;
		setBackingUp(true);
		const ok = await runAutoBackup({ force: true });
		setBackingUp(false);
		if (ok) {
			haptics.success();
			toast(t("app.auto_backup.now_done"));
		} else {
			haptics.warning();
			toast(t("app.auto_backup.now_failed"), "warning");
		}
	};

	const statusLine = status.lastError
		? t("app.auto_backup.last_failed")
		: status.lastSuccessAt
			? t("app.auto_backup.last_success", {
					time: timeAgo(status.lastSuccessAt),
				})
			: t("app.auto_backup.never");

	const folderWarning = problem
		? t(`app.auto_backup.problems.${problem}`)
		: enabled && folder && !writable
			? t("app.auto_backup.folder_unavailable")
			: null;

	return (
		<>
			<ListCard>
				<ListRow
					icon="calendarClock"
					iconTile={36}
					label={t("app.auto_backup.toggle")}
					description={t("app.auto_backup.toggle_hint")}
					height={64}
					last={!enabled}
					trailing={
						<Switch
							value={enabled}
							onChange={toggle}
							accessibilityLabel={t("app.auto_backup.toggle")}
						/>
					}
				/>
				{enabled && (
					<>
						<ListRow
							icon="folder"
							iconTile={36}
							label={t("app.auto_backup.folder")}
							height={64}
							trailing={
								<Text
									size={15}
									color={colors.muted}
									numberOfLines={1}
									style={styles.value}
								>
									{folder ? folderLabel(folder) : t("app.auto_backup.choose")}
								</Text>
							}
							chevron
							onPress={chooseFolder}
						/>
						<ListRow
							icon="calendarClock"
							iconTile={36}
							label={t("app.auto_backup.time")}
							description={t("app.auto_backup.time_hint")}
							height={64}
							trailing={
								<Text size={15} mono color={colors.muted}>
									{formatMinuteOfDay(minute)}
								</Text>
							}
							chevron
							onPress={pickTime}
						/>
						<ListRow
							icon="layers"
							iconTile={36}
							label={t("app.auto_backup.keep")}
							description={t("app.auto_backup.keep_hint")}
							height={72}
							trailing={
								<View style={styles.stepper}>
									<IconButton
										icon="minus"
										size={36}
										iconSize={16}
										accessibilityLabel={t("app.auto_backup.keep_fewer")}
										disabled={keep <= KEEP_MIN}
										onPress={() => setKeep(keep - 1)}
									/>
									<Text size={16} mono style={styles.count}>
										{keep}
									</Text>
									<IconButton
										icon="plus"
										size={36}
										iconSize={16}
										accessibilityLabel={t("app.auto_backup.keep_more")}
										disabled={keep >= KEEP_MAX}
										onPress={() => setKeep(keep + 1)}
									/>
								</View>
							}
						/>
						<ListRow
							icon="archive"
							iconTile={36}
							label={t(
								backingUp
									? "app.auto_backup.now_running"
									: "app.auto_backup.now",
							)}
							description={statusLine}
							height={64}
							last
							onPress={folder ? backUpNow : undefined}
						/>
					</>
				)}
			</ListCard>
			{folderWarning && (
				<Text
					size={13}
					leading={1.5}
					color={colors.danger}
					style={styles.note}
					accessibilityLiveRegion="polite"
				>
					{folderWarning}
				</Text>
			)}
			{enabled && (
				<Text size={13} leading={1.5} color={colors.muted} style={styles.note}>
					{t("app.auto_backup.privacy")}
				</Text>
			)}
		</>
	);
}

const useStyles = makeStyles(() => ({
	value: { maxWidth: 150 },
	stepper: { flexDirection: "row", alignItems: "center", gap: 8 },
	count: { minWidth: 22, textAlign: "center" },
	note: { paddingHorizontal: 4 },
}));
