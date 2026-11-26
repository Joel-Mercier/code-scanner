import { type ErrorBoundaryProps, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "@/components/ui/StatusBar";
import {
	makeStyles,
	radii,
	SCREEN_GAP,
	useSharedStyles,
	useTheme,
} from "@/theme";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { Text } from "./Text";

/**
 * Shown in place of a screen that crashed while rendering (expo-router
 * `ErrorBoundary`). The rest of the app, and the collection, are unaffected.
 */
export function ErrorScreen({ error, retry }: ErrorBoundaryProps) {
	const { colors } = useTheme();
	const shared = useSharedStyles();
	const styles = useStyles();
	const { t } = useTranslation();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const message = error?.message?.trim();

	return (
		<View style={shared.screen}>
			<StatusBar />
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={[
					styles.content,
					{
						paddingTop: insets.top + 48,
						paddingBottom: insets.bottom + SCREEN_GAP,
					},
				]}
			>
				<View style={styles.icon}>
					<Icon name="alert" size={28} color={colors.danger} />
				</View>
				<Text size={28} weight="semibold" tracking={-0.025} align="center">
					{t("app.error.title")}
				</Text>
				<Text size={15} leading={1.45} color={colors.muted} align="center">
					{t("app.error.body")}
				</Text>
				{message ? (
					<View style={[shared.well, styles.details]}>
						<Text size={11} mono color={colors.muted} tracking={0.08}>
							{t("app.error.details").toUpperCase()}
						</Text>
						<Text size={13} mono selectable numberOfLines={6}>
							{message}
						</Text>
					</View>
				) : null}
				<View style={styles.actions}>
					<Button label={t("app.error.retry")} onPress={retry} />
					<Button
						variant="secondary"
						icon="scan"
						label={t("app.error.home")}
						onPress={() =>
							router.canDismiss() ? router.dismissAll() : router.replace("/")
						}
					/>
				</View>
			</ScrollView>
		</View>
	);
}

/** A tile that couldn't be drawn: a dashed square with a warning. */
export function BrokenTile({ size, label }: { size: number; label: string }) {
	const { colors } = useTheme();
	const shared = useSharedStyles();
	const styles = useStyles();
	return (
		<View
			accessible
			accessibilityLabel={label}
			style={[
				shared.dashed,
				shared.center,
				styles.tile,
				{ width: size, height: size },
			]}
		>
			<Icon name="alert" size={18} color={colors.muted} />
		</View>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	content: {
		flexGrow: 1,
		justifyContent: "center",
		paddingHorizontal: 24,
		gap: 10,
	},
	icon: {
		alignSelf: "center",
		width: 64,
		height: 64,
		borderRadius: 20,
		backgroundColor: colors.dangerSoft,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 8,
	},
	details: { marginTop: 14 },
	actions: { marginTop: 18, gap: 10 },
	tile: { borderRadius: radii.lg },
}));
