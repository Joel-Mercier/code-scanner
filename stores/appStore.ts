import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import i18n, { applyZodLocale, type TSupportedLanguages } from "@/config/i18n";
import { zustandStorage } from "@/config/storage";

export type ThemePreference = "system" | "light" | "dark";

interface AppStore {
	locale: TSupportedLanguages | null;
	setLocale: (locale: TSupportedLanguages) => void;
	haptics: boolean;
	setHaptics: (haptics: boolean) => void;
	/** Spin and tilt codes in 3D (detail, capture, creation); off holds them flat. */
	motion3d: boolean;
	setMotion3d: (motion3d: boolean) => void;
	/** Follow the system appearance, or force light or dark. */
	theme: ThemePreference;
	setTheme: (theme: ThemePreference) => void;
}

const useApp = create<AppStore>()(
	persist(
		(set) => ({
			locale: null,
			setLocale: (locale: TSupportedLanguages) => {
				i18n.changeLanguage(locale);
				applyZodLocale(locale);
				set({ locale });
			},
			haptics: true,
			setHaptics: (haptics: boolean) => set({ haptics }),
			motion3d: true,
			setMotion3d: (motion3d: boolean) => set({ motion3d }),
			theme: "system",
			setTheme: (theme: ThemePreference) => set({ theme }),
		}),
		{
			name: "app",
			version: 1,
			storage: createJSONStorage(() => zustandStorage),
		},
	),
);

export default useApp;
