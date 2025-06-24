import "@/config/i18n";
import i18n, {
	SupportedLanguages,
	type TSupportedLanguages,
} from "@/config/i18n";
import { useColorScheme } from "@/hooks/useColorScheme";
import useApp from "@/stores/appStore";
import {
	Inter_300Light,
	Inter_400Regular,
	Inter_700Bold,
	useFonts,
} from "@expo-google-fonts/inter";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import NetInfo from "@react-native-community/netinfo";
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { PortalHost } from "@rn-primitives/portal";
import {
	QueryClient,
	QueryClientProvider,
	onlineManager,
} from "@tanstack/react-query";
import { getLocales } from "expo-localization";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
	fade: true,
});

const queryClient = new QueryClient();

onlineManager.setEventListener((setOnline) => {
	return NetInfo.addEventListener((state) => {
		setOnline(!!state.isConnected);
	});
});

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const [fontsLoaded] = useFonts({
		Inter_300Light,
		Inter_400Regular,
		Inter_700Bold,
	});
	const locale = useApp.use.locale();
	const setLocale = useApp.use.setLocale();

	useEffect(() => {
		if (fontsLoaded) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded]);

	useEffect(() => {
		if (locale) {
			i18n.changeLanguage(locale);
		} else {
			const userLocales = getLocales();
			if (
				userLocales.some(
					(userLocale) =>
						userLocale.languageCode &&
						(SupportedLanguages as string[]).includes(userLocale.languageCode),
				)
			) {
				const firstMatchingLocale = userLocales.filter(
					(userLocale) =>
						userLocale.languageCode &&
						(SupportedLanguages as string[]).includes(userLocale.languageCode),
				)[0].languageCode as TSupportedLanguages;
				setLocale(firstMatchingLocale);
				i18n.changeLanguage(firstMatchingLocale);
			} else {
				setLocale("en");
				i18n.changeLanguage("en");
			}
		}
	}, []);

	if (!fontsLoaded) {
		// Async font loading only occurs in development.
		return null;
	}

	return (
		<QueryClientProvider client={queryClient}>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<BottomSheetModalProvider>
					<ThemeProvider
						value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
					>
						<Stack>
							<Stack.Screen name="index" options={{ headerShown: false }} />
							<Stack.Screen name="history" options={{ headerShown: false }} />
							<Stack.Screen
								name="qr-code"
								options={{
									headerShown: false,
									presentation: "transparentModal",
									animation: "fade_from_bottom",
								}}
							/>
							<Stack.Screen
								name="barcode"
								options={{
									headerShown: false,
									presentation: "transparentModal",
									animation: "fade_from_bottom",
								}}
							/>
							<Stack.Screen name="new-code" options={{ headerShown: false }} />
							<Stack.Screen name="settings" options={{ headerShown: false }} />
							<Stack.Screen name="+not-found" />
						</Stack>
						<PortalHost />
						<StatusBar style="auto" />
					</ThemeProvider>
				</BottomSheetModalProvider>
			</GestureHandlerRootView>
		</QueryClientProvider>
	);
}
