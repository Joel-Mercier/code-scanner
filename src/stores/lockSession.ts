import { create } from "zustand";
import { lockoutDelay } from "@/domain/security/throttle";
import useSettings from "./settings";

interface LockSessionState {
	/** False while the app lock is on and nobody has unlocked it yet. */
	appUnlocked: boolean;
	/** Locked items show what they hold until the app next locks. */
	itemsUnlocked: boolean;
	/** When the app last went to the background, while it is there. */
	backgroundAt: number | null;
	/** Wrong passwords / codes in a row, and when guessing may resume. */
	failures: number;
	blockedUntil: number;
	unlockApp: () => void;
	unlockItems: () => void;
	/** Hides locked items again (after locking one, say). */
	relockItems: () => void;
	wentToBackground: (now: number) => void;
	/**
	 * Locks again if the app was away for `lockAfter` or more, or if the
	 * clock went back while it was away.
	 */
	cameToForeground: (now: number) => void;
	/** A wrong guess: counts it, and may make the next one wait. */
	failed: (now: number) => void;
	succeeded: () => void;
}

/**
 * Who has unlocked what, in memory only: a fresh launch always starts
 * locked. Not persisted on purpose.
 */
const useLockSession = create<LockSessionState>()((set, get) => ({
	appUnlocked: !useSettings.getState().appLock,
	itemsUnlocked: false,
	backgroundAt: null,
	failures: 0,
	blockedUntil: 0,
	unlockApp: () => set({ appUnlocked: true }),
	unlockItems: () => set({ itemsUnlocked: true }),
	relockItems: () => set({ itemsUnlocked: false }),
	wentToBackground: (now) => {
		if (get().backgroundAt === null) set({ backgroundAt: now });
	},
	cameToForeground: (now) => {
		const { backgroundAt } = get();
		if (backgroundAt === null) return;
		const { appLock, lockAfter } = useSettings.getState();
		const away = now - backgroundAt;
		// A clock set back meanwhile can't tell how long it was: lock.
		if (away < 0 || away >= lockAfter) {
			set({ backgroundAt: null, itemsUnlocked: false, appUnlocked: !appLock });
		} else {
			set({ backgroundAt: null });
		}
	},
	failed: (now) => {
		const failures = get().failures + 1;
		set({ failures, blockedUntil: now + lockoutDelay(failures) });
	},
	succeeded: () => set({ failures: 0, blockedUntil: 0 }),
}));

export default useLockSession;
