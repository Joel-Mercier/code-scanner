import * as Application from "expo-application";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import Animated from "react-native-reanimated";
import { AppMark } from "@/components/ui/AppMark";
import { Header } from "@/components/ui/Header";
import { ListCard, ListRow } from "@/components/ui/List";
import { Segmented } from "@/components/ui/Segmented";
import { StatusBar } from "@/components/ui/StatusBar";
import { Switch } from "@/components/ui/Switch";
import { Eyebrow, LargeTitle, Text } from "@/components/ui/Text";
import type { Locale } from "@/i18n";
import useSettings, { type ThemePreference } from "@/stores/settings";
import {
	makeStyles,
	useScreenInsets,
	useSharedStyles,
	useTheme,
} from "@/theme";
import { enter } from "@/theme/motion";

export function SettingsScreen() {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const router = useRouter();
	const edges = useScreenInsets();
	const locale = useSettings((state) => state.locale) ?? "en";
	const setLocale = useSettings((state) => state.setLocale);
	const hapticsEnabled = useSettings((state) => state.haptics);
	const setHaptics = useSettings((state) => state.setHaptics);
	const motion3d = useSettings((state) => state.motion3d);
	const setMotion3d = useSettings((state) => state.setMotion3d);
	const theme = useSettings((state) => state.theme);
	const setTheme = useSettings((state) => state.setTheme);

	return (
		<View style={shared.screen}>
			<StatusBar />
			<Header />
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={[styles.content, edges.content]}
			>
				<Animated.View entering={enter.up()} style={shared.titleBlock}>
					<LargeTitle>{t("app.settings.title")}</LargeTitle>
				</Animated.View>

				<Animated.View entering={enter.up(50)} style={styles.section}>
					<Eyebrow style={styles.label}>{t("app.settings.language")}</Eyebrow>
					<Segmented<Locale>
						value={locale}
						onChange={setLocale}
						height={46}
						accessibilityLabel={t("app.settings.language")}
						options={[
							{ value: "en", label: "English" },
							{ value: "fr", label: "Français" },
						]}
					/>
				</Animated.View>

				<Animated.View entering={enter.up(75)} style={styles.section}>
					<Eyebrow style={styles.label}>{t("app.settings.appearance")}</Eyebrow>
					<Segmented<ThemePreference>
						value={theme}
						onChange={setTheme}
						height={46}
						accessibilityLabel={t("app.settings.appearance")}
						options={[
							{
								value: "system",
								label: t("app.settings.theme_system"),
								icon: "device",
							},
							{
								value: "light",
								label: t("app.settings.theme_light"),
								icon: "sun",
							},
							{
								value: "dark",
								label: t("app.settings.theme_dark"),
								icon: "moon",
							},
						]}
					/>
				</Animated.View>

				<Animated.View entering={enter.up(100)} style={styles.section}>
					<Eyebrow style={styles.label}>{t("app.settings.general")}</Eyebrow>
					<ListCard>
						<ListRow
							icon="vibrate"
							iconTile={36}
							label={t("app.settings.haptics")}
							height={64}
							trailing={
								<Switch
									value={hapticsEnabled}
									onChange={setHaptics}
									accessibilityLabel={t("app.settings.haptics")}
								/>
							}
						/>
						<ListRow
							icon="cube"
							iconTile={36}
							label={t("app.settings.motion3d")}
							height={64}
							trailing={
								<Switch
									value={motion3d}
									onChange={setMotion3d}
									accessibilityLabel={t("app.settings.motion3d")}
								/>
							}
						/>
						<ListRow
							icon="help"
							iconTile={36}
							label={t("app.help.title")}
							height={64}
							chevron
							onPress={() => router.push("/settings/help")}
						/>
						<ListRow
							icon="shield"
							iconTile={36}
							label={t("app.privacy.title")}
							height={64}
							chevron
							last
							onPress={() => router.push("/settings/privacy")}
						/>
					</ListCard>
				</Animated.View>

				<Animated.View entering={enter.up(180)} style={styles.footer}>
					<Animated.View entering={enter.lift(200)} style={styles.markWrap}>
						<AppMark />
					</Animated.View>
					<Text size={18} weight="semibold">
						Code Scanner
					</Text>
					<Text size={12} mono color={colors.muted}>
						{t("app.settings.version", {
							version: Application.nativeApplicationVersion ?? "dev",
						}).toUpperCase()}
					</Text>
					<Text
						size={14}
						leading={1.5}
						color={colors.muted}
						align="center"
						style={styles.offline}
					>
						{t("app.settings.offline")}
					</Text>
				</Animated.View>
			</ScrollView>
		</View>
	);
}

const useStyles = makeStyles(() => ({
	content: { flexGrow: 1 },
	section: { marginTop: 24, marginHorizontal: 16, gap: 10 },
	label: { paddingHorizontal: 4 },
	footer: {
		marginTop: "auto",
		paddingTop: 40,
		paddingHorizontal: 32,
		alignItems: "center",
		gap: 6,
	},
	markWrap: { marginBottom: 10 },
	offline: { marginTop: 8 },
}));
