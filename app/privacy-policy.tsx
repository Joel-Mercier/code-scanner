import { ThemedText } from "@/components/ui/ThemedText";
import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function PrivacyPolicyScreen() {
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
				<ThemedText variant="title">{t("app.privacy_policy.title")}</ThemedText>
				<View style={{ width: 24, marginLeft: Spacings.lg }} />
			</View>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: insets.bottom }}
			>
				<ThemedText style={styles.mainTitle} variant="title">
					{t("app.privacy_policy.title")}
				</ThemedText>
				<ThemedText variant="small" style={styles.date}>
					{t("app.privacy_policy.edited_at")}
				</ThemedText>
				<ThemedText variant="title" style={styles.sectionTitle}>
					{t("app.privacy_policy.introduction_title")}
				</ThemedText>
				<ThemedText>{t("app.privacy_policy.introduction_content")}</ThemedText>
				<ThemedText>
					{t("app.privacy_policy.introduction_content_2")}
				</ThemedText>
				<ThemedText>
					{t("app.privacy_policy.introduction_content_3")}
				</ThemedText>
				<ThemedText>
					{t("app.privacy_policy.introduction_content_4")}
				</ThemedText>
				<ThemedText variant="title" style={styles.sectionTitle}>
					{t("app.privacy_policy.data_processing_title")}
				</ThemedText>
				<ThemedText>
					{t("app.privacy_policy.data_processing_content")}
				</ThemedText>
				<ThemedText>
					{t("app.privacy_policy.data_processing_content_2")}
				</ThemedText>
				<ThemedText>
					{t("app.privacy_policy.data_processing_content_3")}
				</ThemedText>
				<ThemedText>
					{t("app.privacy_policy.data_processing_content_4")}
				</ThemedText>
				<ThemedText variant="title" style={styles.sectionTitle}>
					{t("app.privacy_policy.external_service_title")}
				</ThemedText>
				<ThemedText>
					{t("app.privacy_policy.external_service_content")}
				</ThemedText>
				<ThemedText>
					{t("app.privacy_policy.external_service_content_2")}
				</ThemedText>
				<ThemedText>
					{t("app.privacy_policy.external_service_content_3")}
				</ThemedText>
				<ThemedText>
					{t("app.privacy_policy.external_service_content_4")}
				</ThemedText>
				<ThemedText>
					{t("app.privacy_policy.external_service_content_5")}
				</ThemedText>
				<ThemedText>
					{t("app.privacy_policy.external_service_content_6")}
				</ThemedText>
				<ThemedText variant="title" style={styles.sectionTitle}>
					{t("app.privacy_policy.legal_basis_title")}
				</ThemedText>
				<ThemedText>{t("app.privacy_policy.legal_basis_content")}</ThemedText>
				<ThemedText>{t("app.privacy_policy.legal_basis_content_2")}</ThemedText>
				<ThemedText>{t("app.privacy_policy.legal_basis_content_3")}</ThemedText>
				<ThemedText variant="title" style={styles.sectionTitle}>
					{t("app.privacy_policy.data_retention_title")}
				</ThemedText>
				<ThemedText>
					{t("app.privacy_policy.data_retention_content")}
				</ThemedText>
				<ThemedText>
					{t("app.privacy_policy.data_retention_content_2")}
				</ThemedText>
				<ThemedText variant="title" style={styles.sectionTitle}>
					{t("app.privacy_policy.data_sharing_title")}
				</ThemedText>
				<ThemedText>{t("app.privacy_policy.data_sharing_content")}</ThemedText>
				<ThemedText>
					{t("app.privacy_policy.data_sharing_content_2")}
				</ThemedText>
				<ThemedText>
					{t("app.privacy_policy.data_sharing_content_3")}
				</ThemedText>
				<ThemedText variant="title" style={styles.sectionTitle}>
					{t("app.privacy_policy.data_transfer_title")}
				</ThemedText>
				<ThemedText>{t("app.privacy_policy.data_transfer_content")}</ThemedText>
				<ThemedText>
					{t("app.privacy_policy.data_transfer_content_2")}
				</ThemedText>
				<ThemedText>
					{t("app.privacy_policy.data_transfer_content_3")}
				</ThemedText>
				<ThemedText variant="title" style={styles.sectionTitle}>
					{t("app.privacy_policy.security_title")}
				</ThemedText>
				<ThemedText>{t("app.privacy_policy.security_content")}</ThemedText>
				<ThemedText>{t("app.privacy_policy.security_content_2")}</ThemedText>
				<ThemedText variant="title" style={styles.sectionTitle}>
					{t("app.privacy_policy.changes_title")}
				</ThemedText>
				<ThemedText>{t("app.privacy_policy.changes_content")}</ThemedText>
				<ThemedText>{t("app.privacy_policy.changes_content_2")}</ThemedText>
				<ThemedText variant="title" style={styles.sectionTitle}>
					{t("app.privacy_policy.contact_us_title")}
				</ThemedText>
				<ThemedText>{t("app.privacy_policy.contact_us_content")}</ThemedText>
				<ThemedText>📧 [Your Contact Email]</ThemedText>
				<ThemedText>🌐 [Your Website, if applicable]</ThemedText>
				<ThemedText variant="title" style={styles.sectionTitle}>
					{t("app.privacy_policy.supervisory_authority_title")}
				</ThemedText>
				<ThemedText>
					{t("app.privacy_policy.supervisory_authority_content")}
				</ThemedText>
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
	mainTitle: {
		fontSize: 24,
	},
	date: {
		color: Colors.mutedText,
	},
	sectionTitle: {
		color: Colors.primary,
		marginBottom: Spacings.md,
		marginTop: Spacings.lg,
	},
});
