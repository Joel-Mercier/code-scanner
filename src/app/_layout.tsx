import "@/i18n";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useFonts } from "expo-font";
import { NavigationBar } from "expo-navigation-bar";
import { Stack } from "expo-router";
import { ShareIntentProvider } from "expo-share-intent";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { LockOverlay } from "@/components/lock/LockOverlay";
import { ToastHost } from "@/components/ui/Toast";
import { ShareIntentListener } from "@/features/import/ShareIntentListener";
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
		<ShareIntentProvider>
			<GestureHandlerRootView
				style={{ flex: 1, backgroundColor: colors.canvas }}
			>
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
							<Stack.Screen
								name="document/[id]/view"
								options={{
									presentation: "fullScreenModal",
									animation: "fade",
								}}
							/>
							<Stack.Screen
								name="code/[id]/show"
								options={{
									presentation: "fullScreenModal",
									animation: "fade",
								}}
							/>
						</Stack>
						<ShareIntentListener />
					</BottomSheetModalProvider>
					{/* After the sheets' provider, so toasts show above an open sheet
					    and its backdrop, and the lock covers sheets and toasts. */}
					<ToastHost />
					<LockOverlay />
				</KeyboardProvider>
			</GestureHandlerRootView>
		</ShareIntentProvider>
	);
}
