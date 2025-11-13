import { ThemedText } from "@/components/ui/ThemedText";
import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronDown } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function HelpFaqScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.headerContainer}>
				<Pressable
					onPress={() => router.back()}
					style={{ marginRight: Spacings.lg }}
				>
					<ArrowLeft size={24} color="white" />
				</Pressable>
				<ThemedText variant="title">{t("app.help_faq.title")}</ThemedText>
				<View style={{ width: 24, marginLeft: Spacings.lg }} />
			</View>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: insets.bottom }}
			>
				<ThemedText style={styles.sectionTitle}>
					{t("app.help_faq.faq")}
				</ThemedText>
				<View style={styles.fieldsWrapper}>
					<Pressable style={styles.fieldContainer}>
						<ThemedText style={styles.fieldLabel}>
							{t("app.help_faq.question_1.question")}
						</ThemedText>
						<ChevronDown size={16} color={Colors.mutedText} />
					</Pressable>
					<Pressable style={{ ...styles.fieldContainer, borderBottomWidth: 0 }}>
						<ThemedText style={styles.fieldLabel}>
							{t("app.help_faq.question_2.question")}
						</ThemedText>
						<ChevronDown size={16} color={Colors.mutedText} />
					</Pressable>
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
		fontFamily: "Inter_400Regular",
		fontSize: 14,
	},
	fieldValue: {
		fontFamily: "Inter_400Regular",
		fontSize: 14,
		color: Colors.mutedText,
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
});
