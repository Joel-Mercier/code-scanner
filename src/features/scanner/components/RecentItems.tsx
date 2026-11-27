import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { itemHref } from "@/components/library/hrefs";
import { ItemTile } from "@/components/library/ItemTile";
import { useLibraryActions } from "@/components/library/useLibraryActions";
import { Icon } from "@/components/ui/Icon";
import { Pressable } from "@/components/ui/Pressable";
import { Text } from "@/components/ui/Text";
import { isNew, sortByRecent } from "@/domain/library/items";
import { haptics } from "@/lib/haptics";
import useLibrary from "@/stores/library";
import { makeStyles, radii, useSharedStyles, useTheme } from "@/theme";
import { enter } from "@/theme/motion";
import type { ScanMode } from "../hooks/useModeSwitch";

export const RECENT_GAP = 12;
const SLOTS = 3;

/**
 * The last three codes (or documents), and empty slots for the rest. A long
 * press opens a tile's actions (rename, share, move, delete).
 */
export function RecentItems({ mode, tile }: { mode: ScanMode; tile: number }) {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const router = useRouter();
	const items = useLibrary((state) => state.items);
	const actions = useLibraryActions();
	const codes = mode === "codes";

	const all = sortByRecent(Object.values(items));
	const newestId = all[0] && isNew(all[0]) ? all[0].id : null;
	const recent = all
		.filter((item) => (codes ? item.kind === "code" : item.kind === "doc"))
		.slice(0, SLOTS);

	return (
		<View style={styles.recent}>
			<View style={styles.header}>
				<Text size={15} weight="semibold">
					{t(codes ? "app.home.recent" : "app.home.recent_documents")}
				</Text>
				<Pressable
					accessibilityRole="link"
					onPress={() => router.push("/library")}
					style={styles.collectionLink}
				>
					<Text size={14} color={colors.muted}>
						{t("app.home.collection_count", { count: all.length })}
					</Text>
					<Icon name="chevronRight" size={16} color={colors.muted} />
				</Pressable>
			</View>
			<View style={styles.grid}>
				{recent.map((item, index) => (
					<ItemTile
						key={`${mode}-${item.id}`}
						item={item}
						size={tile}
						caption="short"
						showNew={item.id === newestId}
						delay={50 + index * 70}
						onPress={() => router.push(itemHref(item))}
						onLongPress={() => {
							haptics.pop();
							actions.openItem(item);
						}}
					/>
				))}
				{Array.from({ length: SLOTS - recent.length }, (_, index) => (
					<Animated.View
						key={`empty-${mode}-${index}`}
						entering={enter.fade(80 * index)}
						style={[
							shared.dashed,
							shared.center,
							styles.placeholder,
							{ width: tile, height: tile },
						]}
					>
						{index === 0 && recent.length === 0 && (
							<Text size={11} mono color={colors.muted} align="center">
								{t(codes ? "app.home.empty_codes" : "app.home.empty_docs")}
							</Text>
						)}
					</Animated.View>
				))}
			</View>
			{actions.element}
		</View>
	);
}

const useStyles = makeStyles(() => ({
	recent: { paddingTop: 20, paddingHorizontal: 20, gap: 12 },
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	collectionLink: {
		height: 32,
		flexDirection: "row",
		alignItems: "center",
		gap: 2,
	},
	grid: { flexDirection: "row", gap: RECENT_GAP },
	placeholder: { borderRadius: radii.lg, padding: 10 },
}));
