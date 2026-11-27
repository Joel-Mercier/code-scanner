import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SearchEngine } from "@/domain/codes/lookup";
import {
	clampKeep,
	DEFAULT_MINUTE_OF_DAY,
	KEEP_DEFAULT,
} from "@/domain/library/autoBackup";
import { applyLocale, type Locale } from "@/i18n";
import { setHapticsEnabled } from "@/lib/haptics";
import { zustandStorage } from "@/lib/storage";

export type ThemePreference = "system" | "light" | "dark";

/**
 * How the app and locked items are opened: the phone's own Face ID /
 * fingerprint / passcode, a password of the app's own, or a code from an
 * authenticator app.
 */
export type LockMethod = "device" | "password" | "totp";

/** How long the app can sit in the background before it locks again. */
export const lockDelays = [0, 60_000, 5 * 60_000] as const;
export type LockDelay = (typeof lockDelays)[number];

interface SettingsState {
	/** `null` until the device language has been detected on first launch. */
	locale: Locale | null;
	setLocale: (locale: Locale) => void;
	haptics: boolean;
	setHaptics: (haptics: boolean) => void;
	/** Spin and tilt codes in 3D (detail, capture, creation); off holds them flat. */
	motion3d: boolean;
	setMotion3d: (motion3d: boolean) => void;
	/** Follow the system appearance, or force light or dark. */
	theme: ThemePreference;
	setTheme: (theme: ThemePreference) => void;
	/** Where "Search the web" and lookups' last resort go. */
	searchEngine: SearchEngine;
	setSearchEngine: (searchEngine: SearchEngine) => void;
	/** Its secret (password hash, authenticator key) is in the secure store. */
	lockMethod: LockMethod;
	setLockMethod: (lockMethod: LockMethod) => void;
	/** Ask before opening the app at all. */
	appLock: boolean;
	setAppLock: (appLock: boolean) => void;
	/** Also how long locked items stay open once unlocked, in the background. */
	lockAfter: LockDelay;
	setLockAfter: (lockAfter: LockDelay) => void;
	/** A backup a day into `autoBackupFolder` (Android). */
	autoBackup: boolean;
	setAutoBackup: (autoBackup: boolean) => void;
	/** The folder picked for them: a SAF tree URI. */
	autoBackupFolder: string | null;
	setAutoBackupFolder: (autoBackupFolder: string | null) => void;
	/** Around when they run, in minutes after midnight. */
	autoBackupMinute: number;
	setAutoBackupMinute: (autoBackupMinute: number) => void;
	/** How many of them stay in the folder. */
	autoBackupKeep: number;
	setAutoBackupKeep: (autoBackupKeep: number) => void;
}

const useSettings = create<SettingsState>()(
	persist(
		(set) => ({
			locale: null,
			setLocale: (locale) => {
				applyLocale(locale);
				set({ locale });
			},
			haptics: true,
			setHaptics: (haptics) => set({ haptics }),
			motion3d: true,
			setMotion3d: (motion3d) => set({ motion3d }),
			theme: "system",
			setTheme: (theme) => set({ theme }),
			searchEngine: "duckduckgo",
			setSearchEngine: (searchEngine) => set({ searchEngine }),
			lockMethod: "device",
			setLockMethod: (lockMethod) => set({ lockMethod }),
			appLock: false,
			setAppLock: (appLock) => set({ appLock }),
			lockAfter: 60_000,
			setLockAfter: (lockAfter) => set({ lockAfter }),
			autoBackup: false,
			setAutoBackup: (autoBackup) => set({ autoBackup }),
			autoBackupFolder: null,
			setAutoBackupFolder: (autoBackupFolder) => set({ autoBackupFolder }),
			autoBackupMinute: DEFAULT_MINUTE_OF_DAY,
			setAutoBackupMinute: (autoBackupMinute) =>
				set({
					autoBackupMinute: Math.min(
						24 * 60 - 1,
						Math.max(0, Math.round(autoBackupMinute)),
					),
				}),
			autoBackupKeep: KEEP_DEFAULT,
			setAutoBackupKeep: (autoBackupKeep) =>
				set({ autoBackupKeep: clampKeep(autoBackupKeep) }),
		}),
		{
			// The storage key predates the rename: keep it, or settings are lost.
			name: "app",
			version: 1,
			storage: createJSONStorage(() => zustandStorage),
		},
	),
);

// MMKV hydrates synchronously, so this runs with the stored value before the
// first frame, then follows every change.
setHapticsEnabled(useSettings.getState().haptics);
useSettings.subscribe((state) => setHapticsEnabled(state.haptics));

export default useSettings;
