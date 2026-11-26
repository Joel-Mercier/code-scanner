import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import Animated from "react-native-reanimated";
import { Header } from "@/components/ui/Header";
import { Icon, type IconName } from "@/components/ui/Icon";
import { StatusBar } from "@/components/ui/StatusBar";
import { LargeTitle, Text } from "@/components/ui/Text";
import {
	makeStyles,
	radii,
	useScreenInsets,
	useSharedStyles,
	useTheme,
} from "@/theme";
import { enter } from "@/theme/motion";

type Permission = { icon: IconName; name: string; text: string };
type Section = {
	title: string;
	body?: string[];
	permissions?: Permission[];
};

export function PrivacyScreen() {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const edges = useScreenInsets();
	const sections = t("app.privacy.sections", {
		returnObjects: true,
	}) as Section[];

	return (
		<View style={shared.screen}>
			<StatusBar />
			<Header />
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={edges.content}
			>
				<Animated.View entering={enter.up()} style={shared.titleBlock}>
					<LargeTitle>{t("app.privacy.title")}</LargeTitle>
				</Animated.View>

				<Animated.View
					entering={enter.lift(60)}
					style={[shared.floating, styles.headline]}
				>
					<View style={[shared.iconTile, styles.shield]}>
						<Icon name="shield" size={22} color={colors.accent} />
					</View>
					<View style={styles.headlineText}>
						<Text size={20} weight="semibold" tracking={-0.015} leading={1.25}>
							{t("app.privacy.headline")}
						</Text>
						<Text size={11} mono color={colors.muted}>
							{t("app.privacy.updated").toUpperCase()}
						</Text>
					</View>
				</Animated.View>

				<View style={styles.sections}>
					{sections.map((section, index) => (
						<Animated.View
							key={section.title}
							entering={enter.up(120 + index * 50)}
							style={[
								styles.section,
								index === 0 && styles.first,
								index < sections.length - 1 && styles.divider,
							]}
						>
							<Text size={12} mono color={colors.accent} style={styles.number}>
								{String(index + 1).padStart(2, "0")}
							</Text>
							<View style={styles.sectionBody}>
								<Text size={17} weight="semibold">
									{section.title}
								</Text>
								{section.body?.map((paragraph) => (
									<Text
										key={paragraph}
										size={15}
										leading={1.55}
										color={colors.body}
									>
										{paragraph}
									</Text>
								))}
								{section.permissions && (
									<View style={styles.permissions}>
										{section.permissions.map((permission) => (
											<View key={permission.name} style={styles.permission}>
												<View
													style={[
														shared.card,
														shared.center,
														styles.permissionIcon,
													]}
												>
													<Icon name={permission.icon} size={17} />
												</View>
												<Text
													size={15}
													leading={1.5}
													color={colors.body}
													style={shared.flex}
												>
													<Text size={15} weight="medium">
														{permission.name}
													</Text>{" "}
													{permission.text}
												</Text>
											</View>
										))}
									</View>
								)}
							</View>
						</Animated.View>
					))}
				</View>
			</ScrollView>
		</View>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	headline: {
		marginTop: 22,
		marginHorizontal: 16,
		padding: 20,
		borderRadius: radii.xl,
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 16,
	},
	shield: {
		width: 44,
		height: 44,
		borderRadius: 14,
		backgroundColor: colors.accentSoft,
	},
	headlineText: { flex: 1, gap: 6 },
	sections: { marginTop: 28, paddingHorizontal: 20 },
	section: { flexDirection: "row", paddingVertical: 22 },
	first: { paddingTop: 0 },
	divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
	number: { width: 34, paddingTop: 3 },
	sectionBody: { flex: 1, gap: 8 },
	permissions: { gap: 10, marginTop: 4 },
	permission: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
	permissionIcon: { width: 36, height: 36, borderRadius: radii.tile },
}));
