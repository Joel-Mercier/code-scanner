import {
	AUTO_BACKUP_PATTERN,
	autoBackupFileName,
	backupsToPrune,
	CATCH_UP_AFTER,
	clampKeep,
	formatMinuteOfDay,
	KEEP_MAX,
	shouldCatchUp,
} from "./autoBackup";

describe("automatic backup files", () => {
	it("are named by local date and time, so they sort by age", () => {
		const name = autoBackupFileName(new Date(2026, 10, 27, 3, 5, 12).getTime());
		expect(name).toBe("code-scanner-auto-backup-20261127-030512.zip");
		expect(AUTO_BACKUP_PATTERN.test(name)).toBe(true);
	});

	it("prunes only our own, oldest first, beyond the ones to keep", () => {
		const names = [
			"code-scanner-auto-backup-20261125-030000.zip",
			"holiday.jpg",
			"code-scanner-auto-backup-20261127-030000.zip",
			"code-scanner-backup-2026-11-01.zip",
			"code-scanner-auto-backup-20261126-030000.zip",
		];
		expect(backupsToPrune(names, 2)).toEqual([
			"code-scanner-auto-backup-20261125-030000.zip",
		]);
		expect(backupsToPrune(names, 5)).toEqual([]);
		// Never every one of them.
		expect(backupsToPrune(names, 0)).toHaveLength(2);
	});

	it("keeps between 1 and 30", () => {
		expect(clampKeep(0)).toBe(1);
		expect(clampKeep(99)).toBe(KEEP_MAX);
		expect(clampKeep(7)).toBe(7);
	});

	it("shows the time of day", () => {
		expect(formatMinuteOfDay(3 * 60 + 5)).toBe("03:05");
		expect(formatMinuteOfDay(23 * 60 + 59)).toBe("23:59");
	});
});

describe("shouldCatchUp", () => {
	it("runs at launch when something changed and no backup succeeded lately", () => {
		const now = 10 * CATCH_UP_AFTER;
		expect(shouldCatchUp(true, null, now)).toBe(true);
		expect(shouldCatchUp(true, now - CATCH_UP_AFTER - 1, now)).toBe(true);
		expect(shouldCatchUp(true, now - 60_000, now)).toBe(false);
		expect(shouldCatchUp(false, null, now)).toBe(false);
	});
});
