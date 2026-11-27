jest.mock("@/services/autoBackup", () => {
	let due: (() => void) | null = null;
	return {
		isAutoBackupAvailable: () => true,
		scheduleAutoBackup: jest.fn(),
		cancelAutoBackup: jest.fn(),
		setAutoBackupPending: jest.fn(),
		isAutoBackupPending: jest.fn(() => false),
		notifyAutoBackupReady: jest.fn(),
		reportAutoBackupDone: jest.fn(),
		canWriteFolder: jest.fn(() => true),
		writeAutoBackup: jest.fn(async () => {}),
		onAutoBackupDue: (listener: () => void) => {
			due = listener;
			return () => {};
		},
		fireDue: () => due?.(),
	};
});

type Modules = {
	scheduler: typeof import("./autoBackup");
	native: jest.Mocked<typeof import("@/services/autoBackup")> & {
		fireDue: () => void;
	};
	library: typeof import("@/stores/library").default;
	settings: typeof import("@/stores/settings").default;
	status: typeof import("@/stores/autoBackupStatus").default;
};

const FOLDER = "content://com.android.externalstorage.documents/tree/x";
let appState: "active" | "background" = "background";
const listeners = new Set<(state: string) => void>();

/** A fresh app: every module (and its state) loaded again. */
const boot = (): Modules => {
	jest.resetModules();
	// The fresh `react-native` the scheduler is about to load.
	const { AppState } = require("react-native");
	Object.defineProperty(AppState, "currentState", {
		configurable: true,
		get: () => appState,
	});
	AppState.addEventListener = (
		_: string,
		listener: (state: string) => void,
	) => {
		listeners.add(listener);
		return { remove: () => listeners.delete(listener) };
	};
	return {
		scheduler: require("./autoBackup"),
		native: require("@/services/autoBackup"),
		library: require("@/stores/library").default,
		settings: require("@/stores/settings").default,
		status: require("@/stores/autoBackupStatus").default,
	};
};

const setAppState = (next: "active" | "background") => {
	appState = next;
	for (const listener of listeners) listener(next);
};

/** Lets pending promises settle. */
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

beforeEach(() => {
	appState = "background";
	listeners.clear();
});

afterEach(() => jest.restoreAllMocks());

const turnOn = ({ settings }: Modules) => {
	settings.getState().setAutoBackupFolder(FOLDER);
	settings.getState().setAutoBackup(true);
};

describe("automatic backup scheduler", () => {
	it("stays off until turned on with a folder, then schedules the day's run", () => {
		const app = boot();
		app.scheduler.startAutoBackupScheduler();
		expect(app.native.scheduleAutoBackup).not.toHaveBeenCalled();
		expect(app.native.notifyAutoBackupReady).toHaveBeenCalled();

		turnOn(app);
		expect(app.native.scheduleAutoBackup).toHaveBeenLastCalledWith(180);
		// Nothing is in the folder yet: the first run has something to do.
		expect(app.native.setAutoBackupPending).toHaveBeenLastCalledWith(true);

		app.settings.getState().setAutoBackupMinute(22 * 60 + 30);
		expect(app.native.scheduleAutoBackup).toHaveBeenLastCalledWith(1350);

		app.settings.getState().setAutoBackup(false);
		expect(app.native.cancelAutoBackup).toHaveBeenCalled();
	});

	it("backs up when due and something changed, then lowers `pending`", async () => {
		const app = boot();
		turnOn(app);
		app.scheduler.startAutoBackupScheduler();
		app.library
			.getState()
			.addCode({ source: "scanner", format: "qr", data: "x" });
		expect(app.native.setAutoBackupPending).toHaveBeenLastCalledWith(true);

		app.native.fireDue();
		await flush();
		expect(app.native.writeAutoBackup).toHaveBeenCalledWith(
			FOLDER,
			expect.objectContaining({ nextSeq: 2 }),
			7,
			expect.any(Number),
		);
		expect(app.native.setAutoBackupPending).toHaveBeenLastCalledWith(false);
		expect(app.native.reportAutoBackupDone).toHaveBeenCalled();
		expect(app.status.getState().lastError).toBeNull();
		expect(app.status.getState().lastSuccessAt).not.toBeNull();
	});

	it("does nothing when due on a day nothing changed", async () => {
		const app = boot();
		turnOn(app);
		app.scheduler.startAutoBackupScheduler();
		app.native.fireDue();
		await flush();
		expect(app.native.writeAutoBackup).not.toHaveBeenCalled();
		expect(app.native.reportAutoBackupDone).toHaveBeenCalled();
	});

	it("waits for the app to leave the foreground", async () => {
		const app = boot();
		turnOn(app);
		app.native.isAutoBackupPending.mockReturnValue(true);
		appState = "active";
		app.scheduler.startAutoBackupScheduler();
		app.native.fireDue();
		await flush();
		expect(app.native.reportAutoBackupDone).toHaveBeenCalled();
		expect(app.native.writeAutoBackup).not.toHaveBeenCalled();

		setAppState("background");
		await flush();
		expect(app.native.writeAutoBackup).toHaveBeenCalledTimes(1);
	});

	it("keeps `pending` and says why when the folder is gone", async () => {
		const app = boot();
		turnOn(app);
		app.native.isAutoBackupPending.mockReturnValue(true);
		app.native.canWriteFolder.mockReturnValue(false);
		app.scheduler.startAutoBackupScheduler();
		await expect(app.scheduler.runAutoBackup()).resolves.toBe(false);
		expect(app.status.getState().lastError).toBe("folderUnavailable");
		expect(app.native.setAutoBackupPending).not.toHaveBeenCalledWith(false);
	});

	it("keeps `pending` when the write fails", async () => {
		const app = boot();
		turnOn(app);
		app.native.isAutoBackupPending.mockReturnValue(true);
		app.native.writeAutoBackup.mockRejectedValueOnce(new Error("disk full"));
		jest.spyOn(console, "error").mockImplementation(() => {});
		app.scheduler.startAutoBackupScheduler();
		await expect(app.scheduler.runAutoBackup()).resolves.toBe(false);
		expect(app.status.getState().lastError).toBe("failed");
		expect(app.native.setAutoBackupPending).not.toHaveBeenCalledWith(false);
	});

	it("backs up now on demand, changed or not", async () => {
		const app = boot();
		turnOn(app);
		app.scheduler.startAutoBackupScheduler();
		await expect(app.scheduler.runAutoBackup({ force: true })).resolves.toBe(
			true,
		);
		expect(app.native.writeAutoBackup).toHaveBeenCalledTimes(1);
	});

	it("catches up after a missed run, once the app is left", async () => {
		const app = boot();
		turnOn(app);
		app.native.isAutoBackupPending.mockReturnValue(true);
		appState = "active";
		app.scheduler.startAutoBackupScheduler();
		expect(app.native.writeAutoBackup).not.toHaveBeenCalled();
		setAppState("background");
		await flush();
		expect(app.native.writeAutoBackup).toHaveBeenCalledTimes(1);
	});
});
