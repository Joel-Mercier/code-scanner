import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { zustandStorage } from "@/lib/storage";

/** Why the last automatic backup failed. */
export type AutoBackupError = "folderUnavailable" | "failed";

interface AutoBackupStatusState {
	lastSuccessAt: number | null;
	lastAttemptAt: number | null;
	lastError: AutoBackupError | null;
	succeeded: (at: number) => void;
	failed: (at: number, error: AutoBackupError) => void;
}

/**
 * How the automatic backups have gone, on this phone. Its own store, apart
 * from the library: a run's own status must not count as a change to back up.
 */
const useAutoBackupStatus = create<AutoBackupStatusState>()(
	persist(
		(set) => ({
			lastSuccessAt: null,
			lastAttemptAt: null,
			lastError: null,
			succeeded: (at) =>
				set({ lastSuccessAt: at, lastAttemptAt: at, lastError: null }),
			failed: (at, error) => set({ lastAttemptAt: at, lastError: error }),
		}),
		{
			name: "autoBackup",
			version: 1,
			storage: createJSONStorage(() => zustandStorage),
		},
	),
);

export default useAutoBackupStatus;
