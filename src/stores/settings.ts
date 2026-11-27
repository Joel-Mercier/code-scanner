import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SearchEngine } from "@/domain/codes/lookup";
import { applyLocale, type Locale } from "@/i18n";
import { setHapticsEnabled } from "@/lib/haptics";
import { zustandStorage } from "@/lib/storage";

export type ThemePreference = "system" | "light" | "dark";

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
