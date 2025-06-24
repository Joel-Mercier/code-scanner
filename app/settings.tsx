import { ThemedText } from "@/components/ui/ThemedText";
import { SupportedLanguages } from "@/config/i18n";
import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import useApp from "@/stores/appStore";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function SettingsScreen() {
	const { t, i18n } = useTranslation();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const locale = useApp.use.locale();
	const setLocale = useApp.use.setLocale();
	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.headerContainer}>
				<Pressable
					onPress={() => router.back()}
					style={{ marginRight: Spacings.lg }}
				>
					<ArrowLeft size={24} color="white" />
				</Pressable>
				<ThemedText variant="title">{t("app.settings.title")}</ThemedText>
				<View style={{ width: 24, marginLeft: Spacings.lg }} />
			</View>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: insets.bottom }}
			>
				<View style={styles.fieldContainer}>
					<ThemedText style={styles.fieldLabel}>
						{t("app.settings.form.language.label")}
					</ThemedText>
					<View style={styles.typeButtonWrapper}>
						{SupportedLanguages.map((language) => (
							<Pressable
								key={language}
								onPress={() => setLocale(language)}
								style={[
									styles.typeButtonContainer,
									{
										backgroundColor:
											locale === language ? Colors.slate["700"] : "transparent",
									},
								]}
							>
								<ThemedText>
									{t(`app.settings.form.language.options.${language}`)}
								</ThemedText>
							</Pressable>
						))}
					</View>
				</View>
				{/* <Button
					key={"en"}
					buttonColor={Colors.primary}
					textColor={Colors.white}
					onPress={() => setLocale("en")}
					title={"en"}
					reduceMotion="system"
					style={{ marginVertical: Spacings.sm }}
				/>
				<Button
					key={"fr"}
					buttonColor={Colors.primary}
					textColor={Colors.white}
					onPress={() => setLocale("fr")}
					title={"fr"}
					reduceMotion="system"
					style={{ marginVertical: Spacings.sm }}
				/> */}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingVertical: 24,
		paddingHorizontal: 24,
		backgroundColor: Colors.slate["950"],
	},
	headerContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: Spacings.lg,
	},
	fieldContainer: {
		paddingVertical: Spacings.md,
	},
	fieldLabel: {
		marginBottom: Spacings.md,
		fontFamily: "Inter_700Bold",
		fontSize: 14,
	},
	typeButtonWrapper: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: Spacings.md,
	},
	typeButtonContainer: {
		flex: 0.333,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 24,
		padding: Spacings.sm,
		gap: Spacings.sm,
	},
});
