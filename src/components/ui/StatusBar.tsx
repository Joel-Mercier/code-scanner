import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useTheme } from "@/theme";

/**
 * The status bar, dark icons on the light theme and light ones on the dark
 * theme. `light` forces light icons (over the camera), `dark` dark ones (over
 * a code's white paper). It follows the app's theme rather than the
 * system's, so both switch together.
 */
export function StatusBar({ style }: { style?: "light" | "dark" }) {
	const { scheme } = useTheme();
	return (
		<ExpoStatusBar style={style ?? (scheme === "dark" ? "light" : "dark")} />
	);
}
