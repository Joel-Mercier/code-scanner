import { Appearance, StyleSheet, useColorScheme } from "react-native";
import useApp, { type ThemePreference } from "@/stores/appStore";
import {
	type FolderColors,
	folderPalettes,
	type Palette,
	palettes,
	type Scheme,
	type Shadows,
	shadowSets,
} from "./tokens";

export type { ThemePreference } from "@/stores/appStore";

export type Theme = {
	scheme: Scheme;
	colors: Palette;
	shadows: Shadows;
	folderColors: FolderColors;
};

const themes: Record<Scheme, Theme> = {
	light: {
		scheme: "light",
		colors: palettes.light,
		shadows: shadowSets.light,
		folderColors: folderPalettes.light,
	},
	dark: {
		scheme: "dark",
		colors: palettes.dark,
		shadows: shadowSets.dark,
		folderColors: folderPalettes.dark,
	},
};

/**
 * Makes native UI (pickers, alerts, the keyboard) follow the preference.
 * Screens don't wait for this: on Android the change comes back from native
 * a few frames later, and reading it would repaint the app piecemeal.
 */
const applyToNative = (preference: ThemePreference) => {
	Appearance.setColorScheme(preference === "system" ? "auto" : preference);
};

// The store hydrates synchronously from MMKV, so this runs before the first
// frame, then follows every change.
applyToNative(useApp.getState().theme);
useApp.subscribe((state, previous) => {
	if (state.theme !== previous.theme) applyToNative(state.theme);
});

/**
 * The active theme. A forced preference comes straight from the store, so
 * every component switches in the same render.
 */
export function useTheme(): Theme {
	const preference = useApp((state) => state.theme);
	const system = useColorScheme();
	const scheme = preference === "system" ? system : preference;
	return themes[scheme === "dark" ? "dark" : "light"];
}

/** What `StyleSheet.create` accepts. */
type Styles = Parameters<typeof StyleSheet.create>[0];

/**
 * Like `StyleSheet.create`, but the styles can use the theme. Call it at
 * module level and use the returned hook in components; each theme's sheet
 * is created once and reused.
 */
export function makeStyles<S extends Styles>(
	factory: (theme: Theme) => S & Styles,
): () => Readonly<S> {
	const cache: Partial<Record<Scheme, Readonly<S>>> = {};
	// biome-ignore lint/correctness/noComponentHookFactories: called once at module level (`const useStyles = makeStyles(...)`), so the hook's identity is stable.
	return function useStyles() {
		const theme = useTheme();
		cache[theme.scheme] ??= StyleSheet.create(factory(theme));
		return cache[theme.scheme] as Readonly<S>;
	};
}
