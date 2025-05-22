import { useColorScheme } from "@/hooks/useColorScheme";
import {
	Inter_300Light,
	Inter_400Regular,
	Inter_700Bold,
	useFonts,
} from "@expo-google-fonts/inter";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
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

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const [fontsLoaded] = useFonts({
		Inter_300Light,
		Inter_400Regular,
		Inter_700Bold,
	});

	useEffect(() => {
		if (fontsLoaded) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded]);

	if (!fontsLoaded) {
		// Async font loading only occurs in development.
		return null;
	}

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<BottomSheetModalProvider>
				<ThemeProvider
					value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
				>
					<Stack>
						<Stack.Screen name="index" options={{ headerShown: false }} />
						<Stack.Screen name="history" options={{ headerShown: false }} />
						<Stack.Screen name="+not-found" />
					</Stack>
					<StatusBar style="auto" />
				</ThemeProvider>
			</BottomSheetModalProvider>
		</GestureHandlerRootView>
	);
}
