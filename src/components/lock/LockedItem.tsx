import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { Icon } from "@/components/ui/Icon";
import { StatusBar } from "@/components/ui/StatusBar";
import { Text } from "@/components/ui/Text";
import { catalogueNumber, shownTitle } from "@/domain/library/items";
import type { LibraryItem } from "@/domain/library/types";
import { makeStyles, useSharedStyles, useTheme } from "@/theme";
import { enter } from "@/theme/motion";
import { unlockItems } from "./unlock";

/**
 * What a locked item's screen shows until it is unlocked: its number and
 * the title it may show, and a way to unlock. It asks once on arrival.
 */
export function LockedItem({ item }: { item: LibraryItem }) {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();

	useEffect(() => {
		unlockItems();
	}, []);

	return (
		<View style={shared.screen}>
			<StatusBar />
			<Header />
			<View style={[shared.flex, shared.center, styles.body]}>
				<Animated.View
					entering={enter.pop()}
					style={[shared.iconTile, styles.badge]}
				>
					<Icon name="lock" size={30} />
				</Animated.View>
				<Animated.View entering={enter.up(120)} style={styles.text}>
					<Text size={12} mono color={colors.muted} align="center">
						{catalogueNumber(item)} · {t("app.lock.locked").toUpperCase()}
					</Text>
					<Text
						size={24}
						weight="semibold"
						tracking={-0.02}
						align="center"
						numberOfLines={2}
					>
						{shownTitle(item, false)}
					</Text>
					<Text size={15} leading={1.5} color={colors.body} align="center">
						{t("app.lock.locked_body")}
					</Text>
				</Animated.View>
				<Animated.View entering={enter.up(200)} style={styles.button}>
					<Button
						icon="lock"
						label={t("app.lock.unlock")}
						onPress={unlockItems}
					/>
				</Animated.View>
			</View>
		</View>
	);
}

const useStyles = makeStyles(() => ({
	body: { paddingHorizontal: 32, gap: 22 },
	badge: { width: 76, height: 76, borderRadius: 24 },
	text: { gap: 8, alignItems: "center" },
	button: { alignSelf: "stretch" },
}));
