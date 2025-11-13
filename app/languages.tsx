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

export default function LanguagesScreen() {
	const { t } = useTranslation();
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
				<ThemedText variant="title">{t("app.languages.title")}</ThemedText>
				<View style={{ width: 24, marginLeft: Spacings.lg }} />
			</View>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: insets.bottom }}
			>
				<View style={styles.fieldContainer}>
					<View style={styles.typeButtonWrapper}>
						{SupportedLanguages.map((language) => (
							<Pressable
								key={language}
								onPress={() => setLocale(language)}
								style={[
									styles.typeButtonContainer,
									{
										borderColor:
											locale === language
												? Colors.primary
												: Colors.backgroundAccentLight,
										backgroundColor:
											locale === language
												? `${Colors.primary}33`
												: "transparent",
									},
								]}
							>
								<ThemedText>
									{t(`app.languages.${language}`, {
										lng: language,
									})}
								</ThemedText>
								<View
									style={[
										styles.indicator,
										{
											borderWidth: locale === language ? 4 : 2,
											borderColor:
												locale === language
													? Colors.primary
													: Colors.backgroundAccentLight,
											backgroundColor:
												locale === language ? Colors.white : "transparent",
										},
									]}
								/>
							</Pressable>
						))}
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingVertical: Spacings.md,
		paddingHorizontal: Spacings.md,
		backgroundColor: Colors.darkBackground,
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
		gap: Spacings.md,
	},
	typeButtonContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderRadius: Spacings.sm,
		padding: Spacings.md,
		gap: Spacings.sm,
		borderWidth: 1,
		borderColor: Colors.backgroundAccentLight,
	},
	indicator: {
		width: Spacings.md,
		height: Spacings.md,
		borderRadius: Spacings.md,
		borderWidth: 2,
		borderColor: Colors.backgroundAccentLight,
	},
});
