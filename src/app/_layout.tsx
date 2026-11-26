import "@/i18n";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useFonts } from "expo-font";
import { NavigationBar } from "expo-navigation-bar";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ToastHost } from "@/components/ui/Toast";
import { applyLocale, detectLocale } from "@/i18n";
import useSettings from "@/stores/settings";
import { fontAssets, useTheme } from "@/theme";

export { ErrorScreen as ErrorBoundary } from "@/features/errors/ErrorScreen";

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ fade: true });

export default function RootLayout() {
	const { colors, scheme } = useTheme();
	const [fontsLoaded] = useFonts(fontAssets);
	const locale = useSettings((state) => state.locale);
	const setLocale = useSettings((state) => state.setLocale);

	useEffect(() => {
		if (fontsLoaded) SplashScreen.hideAsync();
	}, [fontsLoaded]);

	// The window behind every screen (seen during transitions and keyboard).
	useEffect(() => {
		SystemUI.setBackgroundColorAsync(colors.canvas);
	}, [colors.canvas]);

	// The stored language, or the device's on first launch.
	useEffect(() => {
		if (locale) applyLocale(locale);
		else setLocale(detectLocale());
	}, [locale, setLocale]);

	if (!fontsLoaded) return null;

	return (
		<GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.canvas }}>
			{/* Android's gesture bar / buttons: dark on the light theme, light on
			    the dark one. It follows the app's theme, not the system's. */}
			<NavigationBar style={scheme === "dark" ? "light" : "dark"} />
			<KeyboardProvider>
				<BottomSheetModalProvider>
					<Stack
						screenOptions={{
							headerShown: false,
							contentStyle: { backgroundColor: colors.canvas },
						}}
					>
						<Stack.Screen
							name="capture/[id]"
							options={{
								presentation: "fullScreenModal",
								animation: "slide_from_bottom",
							}}
						/>
					</Stack>
					<ToastHost />
				</BottomSheetModalProvider>
			</KeyboardProvider>
		</GestureHandlerRootView>
	);
}
