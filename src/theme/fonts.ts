import {
	Geist_400Regular,
	Geist_500Medium,
	Geist_600SemiBold,
} from "@expo-google-fonts/geist";
import {
	GeistMono_400Regular,
	GeistMono_500Medium,
} from "@expo-google-fonts/geist-mono";

/** Font families, as registered by `useFonts(fontAssets)`. */
export const fonts = {
	regular: "Geist_400Regular",
	medium: "Geist_500Medium",
	semibold: "Geist_600SemiBold",
	mono: "GeistMono_400Regular",
	monoMedium: "GeistMono_500Medium",
} as const;

/** Loaded once by the root layout, before the splash screen hides. */
export const fontAssets = {
	Geist_400Regular,
	Geist_500Medium,
	Geist_600SemiBold,
	GeistMono_400Regular,
	GeistMono_500Medium,
} satisfies Record<(typeof fonts)[keyof typeof fonts], number>;
