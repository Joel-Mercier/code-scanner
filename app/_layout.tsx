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
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const [fontsLoaded] = useFonts({
		Inter_300Light,
		Inter_400Regular,
		Inter_700Bold,
	});

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
						<Stack.Screen
							name="scanner-results"
							options={{ headerShown: false }}
						/>
						<Stack.Screen name="+not-found" />
					</Stack>
					<StatusBar style="auto" />
				</ThemeProvider>
			</BottomSheetModalProvider>
		</GestureHandlerRootView>
	);
}
