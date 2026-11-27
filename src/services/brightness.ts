import * as Brightness from "expo-brightness";
import { Platform } from "react-native";

/**
 * Turns the screen all the way up, so a scanner at a till or a gate reads
 * the code off it, and resolves to what puts it back.
 *
 * Android sets this window's brightness only (no permission), which goes
 * back to the system's setting when cleared. iOS sets the screen's own, so
 * the previous level is kept and restored; iOS also restores it by itself
 * whenever the app leaves the foreground.
 */
export const raiseBrightness = async () => {
	if (Platform.OS === "android") {
		await Brightness.setBrightnessAsync(1);
		return () => Brightness.restoreSystemBrightnessAsync();
	}
	const previous = await Brightness.getBrightnessAsync();
	await Brightness.setBrightnessAsync(1);
	return () => Brightness.setBrightnessAsync(previous);
};
