import { ThemedText } from "@/components/ui/ThemedText";
import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import useApp from "@/stores/appStore";
import * as Application from "expo-application";
import { Link, useRouter } from "expo-router";
import {
	ArrowLeft,
	ChevronRight,
	CircleQuestionMark,
	Globe,
	Info,
	Shield,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function SettingsScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const locale = useApp.use.locale();
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
				<ThemedText style={[styles.sectionTitle, { marginTop: 0 }]}>
					{t("app.settings.general")}
				</ThemedText>
				<View style={styles.fieldsWrapper}>
					<Link href={"/languages"} asChild>
						<Pressable
							style={{ ...styles.fieldContainer, borderBottomWidth: 0 }}
						>
							<View style={styles.fieldWrapper}>
								<View style={styles.iconWrapper}>
									<Globe size={20} color={Colors.white} />
								</View>
								<View>
									<ThemedText style={styles.fieldLabel}>
										{t("app.settings.language")}
									</ThemedText>
									<ThemedText style={styles.fieldValue}>
										{t(`app.languages.${locale}`, {
											lng: locale,
										})}
									</ThemedText>
								</View>
							</View>

							<ChevronRight size={16} color={Colors.mutedText} />
						</Pressable>
					</Link>
				</View>
				<ThemedText style={styles.sectionTitle}>
					{t("app.settings.support")}
				</ThemedText>
				<View style={styles.fieldsWrapper}>
					<Link href={"/help-faq"} asChild>
						<Pressable style={styles.fieldContainer}>
							<View style={styles.fieldWrapper}>
								<View style={styles.iconWrapper}>
									<CircleQuestionMark size={20} color={Colors.white} />
								</View>
								<ThemedText style={styles.fieldLabel}>
									{t("app.settings.help_faq")}
								</ThemedText>
							</View>
							<ChevronRight size={16} color={Colors.mutedText} />
						</Pressable>
					</Link>
					<Link href={"/privacy-policy"} asChild>
						<Pressable
							style={{ ...styles.fieldContainer, borderBottomWidth: 0 }}
						>
							<View style={styles.fieldWrapper}>
								<View style={styles.iconWrapper}>
									<Shield size={20} color={Colors.white} />
								</View>
								<ThemedText style={styles.fieldLabel}>
									{t("app.settings.privacy_policy")}
								</ThemedText>
							</View>
							<ChevronRight size={16} color={Colors.mutedText} />
						</Pressable>
					</Link>
				</View>
				<ThemedText style={styles.sectionTitle}>
					{t("app.settings.about")}
				</ThemedText>
				<View style={styles.fieldsWrapper}>
					<View style={[styles.fieldContainer, { borderBottomWidth: 0 }]}>
						<View style={styles.fieldWrapper}>
							<View style={styles.iconWrapper}>
								<Info size={20} color={Colors.white} />
							</View>
							<ThemedText style={styles.fieldLabel}>
								{t("app.settings.app_version")}
							</ThemedText>
						</View>
						<ThemedText style={styles.fieldValue}>
							{Application.nativeApplicationVersion}
						</ThemedText>
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
		paddingHorizontal: Spacings.md,
		borderBottomWidth: 1,
		borderBottomColor: Colors.backgroundSeparator,
		alignItems: "center",
		justifyContent: "space-between",
		flexDirection: "row",
		flex: 1,
		width: "100%",
	},
	fieldLabel: {
		fontFamily: "Inter_700Bold",
		fontSize: 14,
	},
	fieldValue: {
		fontFamily: "Inter_400Regular",
		fontSize: 14,
		color: Colors.mutedText,
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
	sectionTitle: {
		fontFamily: "Inter_400Regular",
		color: Colors.mutedText,
		textTransform: "uppercase",
		marginLeft: Spacings.md,
		marginBottom: Spacings.xs,
		fontSize: 12,
		marginTop: Spacings.md,
	},
	fieldsWrapper: {
		backgroundColor: Colors.background,
		borderRadius: Spacings.md,
	},
	fieldWrapper: {
		flexDirection: "row",
		alignItems: "center",
	},
	iconWrapper: {
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: Colors.backgroundAccent,
		borderRadius: Spacings.sm,
		padding: Spacings.sm,
		marginRight: Spacings.md,
	},
});
