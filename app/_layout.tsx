import "@/config/i18n";
import {
	Geist_400Regular,
	Geist_500Medium,
	Geist_600SemiBold,
} from "@expo-google-fonts/geist";
import {
	GeistMono_400Regular,
	GeistMono_500Medium,
} from "@expo-google-fonts/geist-mono";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useFonts } from "expo-font";
import { getLocales } from "expo-localization";
import { NavigationBar } from "expo-navigation-bar";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ToastHost } from "@/components/ui/Toast";
import i18n, {
	applyZodLocale,
	SupportedLanguages,
	type TSupportedLanguages,
} from "@/config/i18n";
import useApp from "@/stores/appStore";
import { useTheme } from "@/theme";

export { ErrorScreen as ErrorBoundary } from "@/components/ui/ErrorScreen";

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ fade: true });

const detectLocale = (): TSupportedLanguages => {
	const match = getLocales().find(
		(locale) =>
			locale.languageCode &&
			(SupportedLanguages as string[]).includes(locale.languageCode),
	);
	return (match?.languageCode as TSupportedLanguages | undefined) ?? "en";
};

export default function RootLayout() {
	const { colors, scheme } = useTheme();
	const [fontsLoaded] = useFonts({
		Geist_400Regular,
		Geist_500Medium,
		Geist_600SemiBold,
		GeistMono_400Regular,
		GeistMono_500Medium,
	});
	const locale = useApp((state) => state.locale);
	const setLocale = useApp((state) => state.setLocale);

	useEffect(() => {
		if (fontsLoaded) SplashScreen.hideAsync();
	}, [fontsLoaded]);

	// The window behind every screen (seen during transitions and keyboard).
	useEffect(() => {
		SystemUI.setBackgroundColorAsync(colors.canvas);
	}, [colors.canvas]);

	useEffect(() => {
		if (locale) {
			i18n.changeLanguage(locale);
			applyZodLocale(locale);
		} else {
			setLocale(detectLocale());
		}
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
