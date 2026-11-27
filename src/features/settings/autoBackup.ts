import { AppState } from "react-native";
import { shouldCatchUp } from "@/domain/library/autoBackup";
import { attempt } from "@/lib/attempt";
import {
	cancelAutoBackup,
	canWriteFolder,
	isAutoBackupAvailable,
	isAutoBackupPending,
	notifyAutoBackupReady,
	onAutoBackupDue,
	reportAutoBackupDone,
	scheduleAutoBackup,
	setAutoBackupPending,
	writeAutoBackup,
} from "@/services/autoBackup";
import useAutoBackupStatus from "@/stores/autoBackupStatus";
import useLibrary from "@/stores/library";
import useSettings from "@/stores/settings";

// Daily automatic backups into a folder the user picked (Android).
//
// The OS schedules the run (modules/auto-backup: WorkManager), not a JS
// timer, so it happens with the app closed. The library only changes while
// JS runs, so each change raises a native `pending` flag, and a run on a day
// nothing changed ends natively, without starting JS.
//
// A run never gets in the way of someone using the app: one that comes due
// while the app is in front waits until it goes to the background (or for
// FOREGROUND_WAIT at most).
//
// Started from the entry file (index.ts), not a screen: the run can start JS
// with no UI at all.

const FOREGROUND_WAIT = 30 * 60_000;

type Settings = ReturnType<typeof useSettings.getState>;

const isOn = (settings: Settings) =>
	settings.autoBackup && settings.autoBackupFolder !== null;

// --- what changed ----------------------------------------------------------

let pending = false;
// Bumped on every change, so one made while a backup is being written keeps
// `pending` raised for the next.
let generation = 0;

const markPending = () => {
	generation += 1;
	if (pending) return;
	pending = true;
	setAutoBackupPending(true);
};

let stopWatching: (() => void) | null = null;

/** Every change to what a backup holds: items (and their files), folders. */
const watchLibrary = () => {
	stopWatching ??= useLibrary.subscribe((state, previous) => {
		if (state.items !== previous.items || state.folders !== previous.folders) {
			markPending();
		}
	});
};

const unwatchLibrary = () => {
	stopWatching?.();
	stopWatching = null;
};

// --- a run -----------------------------------------------------------------

let running: Promise<boolean> | null = null;

const performRun = async () => {
	const { autoBackupFolder: folder, autoBackupKeep: keep } =
		useSettings.getState();
	if (!folder) return false;
	const at = Date.now();
	const status = useAutoBackupStatus.getState();
	if (!canWriteFolder(folder)) {
		status.failed(at, "folderUnavailable");
		return false;
	}
	const start = generation;
	const { items, folders, nextSeq } = useLibrary.getState();
	const written = await attempt(() =>
		writeAutoBackup(folder, { items, folders, nextSeq }, keep, at),
	);
	if (!written.ok) {
		// `pending` stays up: the next day's run tries again.
		status.failed(at, "failed");
		return false;
	}
	if (generation === start) {
		pending = false;
		setAutoBackupPending(false);
	}
	status.succeeded(at);
	return true;
};

/**
 * Backs up if anything changed since the last one; `force` ("Back up now")
 * writes one anyway. One run at a time. Resolves to whether it went well.
 */
export const runAutoBackup = ({ force = false } = {}) => {
	if (!force && !pending) return Promise.resolve(true);
	running ??= performRun().finally(() => {
		running = null;
	});
	return running;
};

// --- when ------------------------------------------------------------------

let deferred: (() => void) | null = null;

const cancelDeferred = () => {
	deferred?.();
	deferred = null;
};

/** Waits until the app leaves the foreground (or FOREGROUND_WAIT). */
const runWhenBackgrounded = () => {
	if (deferred) return;
	const run = () => {
		cancelDeferred();
		runAutoBackup();
	};
	const subscription = AppState.addEventListener("change", (state) => {
		if (state === "background") run();
	});
	const timer = setTimeout(run, FOREGROUND_WAIT);
	deferred = () => {
		subscription.remove();
		clearTimeout(timer);
	};
};

/**
 * The day's slot. The native job waits for `reportDone` (5 minutes at most),
 * so a run put off while the app is in front is answered at once and goes on
 * in this process, which is alive anyway.
 */
const handleDue = async () => {
	try {
		if (!isOn(useSettings.getState())) return;
		if (AppState.currentState === "active") {
			runWhenBackgrounded();
			return;
		}
		await runAutoBackup();
	} finally {
		reportAutoBackupDone();
	}
};

const applySettings = (next: Settings, previous: Settings | null) => {
	if (!isOn(next)) {
		unwatchLibrary();
		cancelDeferred();
		cancelAutoBackup();
		return;
	}
	if (!previous || !isOn(previous)) {
		pending = isAutoBackupPending();
		watchLibrary();
	}
	// Just turned on, or a new folder: there's nothing in it yet.
	if (
		previous &&
		(!isOn(previous) || previous.autoBackupFolder !== next.autoBackupFolder)
	) {
		markPending();
	}
	scheduleAutoBackup(next.autoBackupMinute);
};

/** Wires automatic backups up; call once, from the entry file. */
export const startAutoBackupScheduler = () => {
	if (!isAutoBackupAvailable()) return;
	onAutoBackupDue(() => {
		handleDue();
	});
	const initial = useSettings.getState();
	applySettings(initial, null);
	useSettings.subscribe((state, previous) => {
		if (
			state.autoBackup !== previous.autoBackup ||
			state.autoBackupFolder !== previous.autoBackupFolder ||
			state.autoBackupMinute !== previous.autoBackupMinute
		) {
			applySettings(state, previous);
		}
	});
	// A missed run (a force-stopped app loses its scheduled job until the
	// next launch) catches up, on a launch someone sees, once they leave.
	if (
		AppState.currentState === "active" &&
		isOn(initial) &&
		shouldCatchUp(
			pending,
			useAutoBackupStatus.getState().lastSuccessAt,
			Date.now(),
		)
	) {
		runWhenBackgrounded();
	}
	notifyAutoBackupReady();
};
