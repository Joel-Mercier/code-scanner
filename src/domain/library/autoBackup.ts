/**
 * Automatic backups (Android): a .zip a day, at a time the user picks, in a
 * folder they picked. Pure rules here; the run is in features/settings.
 */

const PREFIX = "code-scanner-auto-backup-";
/** Only files named this way are ours: the folder may hold anything else. */
export const AUTO_BACKUP_PATTERN =
	/^code-scanner-auto-backup-\d{8}-\d{6}\.zip$/;

export const KEEP_MIN = 1;
export const KEEP_MAX = 30;
export const KEEP_DEFAULT = 7;
/** 03:00, while the phone is most likely idle and charging. */
export const DEFAULT_MINUTE_OF_DAY = 3 * 60;

/** A run was missed (the app was force-stopped, say) if none succeeded for this long. */
export const CATCH_UP_AFTER = 26 * 60 * 60_000;

const pad = (n: number) => String(n).padStart(2, "0");

/** "code-scanner-auto-backup-20261127-030512.zip", in local time: sorts by date. */
export const autoBackupFileName = (now: number) => {
	const date = new Date(now);
	const day = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
	const time = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
	return `${PREFIX}${day}-${time}.zip`;
};

/** Our backups beyond the `keep` newest ones; anything else is left alone. */
export const backupsToPrune = (names: string[], keep: number) =>
	names
		.filter((name) => AUTO_BACKUP_PATTERN.test(name))
		.sort()
		.reverse()
		.slice(Math.max(KEEP_MIN, keep));

export const clampKeep = (keep: number) =>
	Math.min(KEEP_MAX, Math.max(KEEP_MIN, Math.round(keep)));

/** "03:05" */
export const formatMinuteOfDay = (minuteOfDay: number) =>
	`${pad(Math.floor(minuteOfDay / 60))}:${pad(minuteOfDay % 60)}`;

/**
 * On a launch: whether to run now rather than wait for the next slot,
 * because something changed and the last success is too old.
 */
export const shouldCatchUp = (
	pending: boolean,
	lastSuccessAt: number | null,
	now: number,
) =>
	pending && (lastSuccessAt === null || now - lastSuccessAt > CATCH_UP_AFTER);
