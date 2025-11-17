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
import * as ScreenOrientation from "expo-screen-orientation";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";
import z from "zod";

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
	const setOrientation = useApp.use.setOrientation();
	const orientation = useApp.use.orientation();

	useEffect(() => {
		if (fontsLoaded) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded]);

	useEffect(() => {
		if (locale) {
			i18n.changeLanguage(locale);
			z.config(z.locales[locale]());
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
				z.config(z.locales[firstMatchingLocale]());
			} else {
				setLocale("en");
				i18n.changeLanguage("en");
				z.config(z.locales.en());
			}
		}
		ScreenOrientation.getOrientationAsync().then((orientation) => {
			setOrientation(orientation);
		});
		const screenOrientationSubscription =
			ScreenOrientation.addOrientationChangeListener(({ orientationInfo }) => {
				setOrientation(orientationInfo.orientation);
			});
		return () => {
			ScreenOrientation.removeOrientationChangeListener(
				screenOrientationSubscription,
			);
		};
	}, []);

	if (!fontsLoaded) {
		// Async font loading only occurs in development.
		return null;
	}

	return (
		<QueryClientProvider client={queryClient}>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<KeyboardProvider>
					<BottomSheetModalProvider>
						<ThemeProvider
							value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
						>
							<Stack
								screenOptions={{
									headerShown: false,
								}}
							>
								<Stack.Screen name="(tabs)" />
								<Stack.Screen name="document-scanner" />
								<Stack.Screen name="languages" />
								<Stack.Screen
									name="qr-code"
									options={{
										presentation: "transparentModal",
										animation: "fade_from_bottom",
									}}
								/>
								<Stack.Screen
									name="barcode"
									options={{
										presentation: "transparentModal",
										animation: "fade_from_bottom",
									}}
								/>
								<Stack.Screen
									name="document"
									options={{
										presentation: "transparentModal",
										animation: "fade_from_bottom",
									}}
								/>
								<Stack.Screen name="help-faq" />
								<Stack.Screen name="privacy-policy" />
								<Stack.Screen name="+not-found" />
							</Stack>
							<PortalHost />
							<SystemBars style="auto" />
						</ThemeProvider>
					</BottomSheetModalProvider>
				</KeyboardProvider>
			</GestureHandlerRootView>
		</QueryClientProvider>
	);
}
