import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { Text } from "@/components/ui/Text";
import { makeStyles, useTheme } from "@/theme";
import { enter } from "@/theme/motion";
import { PaperStack } from "./PaperStack";

/** The docs mode backdrop: a floating stack of pages and a short pitch. */
export function DocsIntro({ top }: { top: number }) {
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	return (
		<>
			<View style={[styles.stack, { top }]}>
				<PaperStack />
			</View>
			<View style={styles.copy}>
				<Animated.View entering={enter.up(250)}>
					<Text size={28} weight="semibold" tracking={-0.025} align="center">
						{t("app.scan.docs_title")}
					</Text>
				</Animated.View>
				<Animated.View entering={enter.up(320)}>
					<Text size={15} leading={1.45} color={colors.muted} align="center">
						{t("app.scan.docs_subtitle")}
					</Text>
				</Animated.View>
			</View>
		</>
	);
}

const useStyles = makeStyles(() => ({
	stack: { position: "absolute", left: 0, right: 0, alignItems: "center" },
	copy: {
		position: "absolute",
		left: 24,
		right: 24,
		bottom: 32,
		gap: 8,
		alignItems: "center",
	},
}));
