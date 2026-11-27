import useLockSession from "./lockSession";
import useSettings from "./settings";

const session = () => useLockSession.getState();

afterEach(() => {
	useSettings.getState().setAppLock(false);
	useSettings.getState().setLockAfter(60_000);
	useLockSession.setState({
		appUnlocked: true,
		itemsUnlocked: false,
		backgroundAt: null,
		failures: 0,
		blockedUntil: 0,
	});
});

describe("lock session", () => {
	it("starts with the app open when the app lock is off", () => {
		expect(session().appUnlocked).toBe(true);
		expect(session().itemsUnlocked).toBe(false);
	});

	it("locks again after `lockAfter` in the background", () => {
		useSettings.getState().setAppLock(true);
		session().unlockApp();
		session().unlockItems();

		session().wentToBackground(1000);
		session().cameToForeground(1000 + 59_000);
		expect(session()).toMatchObject({
			appUnlocked: true,
			itemsUnlocked: true,
			backgroundAt: null,
		});

		session().wentToBackground(100_000);
		// A second background event (inactive → background) keeps the first time.
		session().wentToBackground(150_000);
		session().cameToForeground(160_000);
		expect(session()).toMatchObject({
			appUnlocked: false,
			itemsUnlocked: false,
		});
	});

	it("locks when the clock went back while the app was away", () => {
		useSettings.getState().setAppLock(true);
		useSettings.getState().setLockAfter(5 * 60_000);
		session().unlockApp();
		session().unlockItems();
		session().wentToBackground(1_000_000);
		session().cameToForeground(1_000_000 - 60 * 60_000);
		expect(session()).toMatchObject({
			appUnlocked: false,
			itemsUnlocked: false,
			backgroundAt: null,
		});
	});

	it("only relocks items when the app lock is off", () => {
		session().unlockItems();
		session().wentToBackground(0);
		session().cameToForeground(60_000);
		expect(session()).toMatchObject({
			appUnlocked: true,
			itemsUnlocked: false,
		});
	});

	it("locks at once with no delay, and ignores a foreground it didn't leave", () => {
		useSettings.getState().setAppLock(true);
		useSettings.getState().setLockAfter(0);
		session().cameToForeground(5);
		expect(session().appUnlocked).toBe(true);
		session().wentToBackground(10);
		session().cameToForeground(10);
		expect(session().appUnlocked).toBe(false);
	});

	it("makes guesses wait after too many wrong ones, until one is right", () => {
		for (let i = 0; i < 4; i++) session().failed(0);
		expect(session().blockedUntil).toBe(0);
		session().failed(1000);
		expect(session().blockedUntil).toBe(31_000);
		session().succeeded();
		expect(session()).toMatchObject({ failures: 0, blockedUntil: 0 });
	});

	it("relocks items on demand", () => {
		session().unlockItems();
		session().relockItems();
		expect(session().itemsUnlocked).toBe(false);
	});
});
