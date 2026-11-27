import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { inspectUrl } from "@/domain/codes/url";
import { makeStyles, useSharedStyles, useTheme } from "@/theme";

/**
 * Where a link really goes, and what looks off about it (lookalike names,
 * hidden hosts, shorteners), before it's opened.
 */
export function UrlCheck({ url }: { url: string }) {
	const { colors } = useTheme();
	const shared = useSharedStyles();
	const styles = useStyles();
	const { t } = useTranslation();
	const check = inspectUrl(url);
	if (!check) return null;
	return (
		<View style={styles.check}>
			<View style={shared.row}>
				<Icon
					name={check.warnings.length ? "alert" : "globe"}
					size={16}
					color={check.warnings.length ? colors.danger : colors.muted}
				/>
				<Text size={13} color={colors.muted} style={styles.host}>
					{t("app.url.opens", { host: check.host })}
				</Text>
			</View>
			{check.warnings.map((warning) => (
				<View key={warning} style={shared.warning}>
					<Icon name="alert" size={18} color={colors.danger} />
					<Text size={13} leading={1.4} color={colors.body} style={shared.flex}>
						{t(`app.url.warnings.${warning}`, { host: check.host })}
					</Text>
				</View>
			))}
		</View>
	);
}

const useStyles = makeStyles(() => ({
	check: { gap: 8 },
	host: { flexShrink: 1, marginLeft: 8 },
}));
