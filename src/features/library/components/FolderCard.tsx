import Animated from "react-native-reanimated";
import { FolderBadge } from "@/components/library/FolderBadge";
import { Pressable } from "@/components/ui/Pressable";
import { Text } from "@/components/ui/Text";
import type { Folder } from "@/domain/library/types";
import { makeStyles, radii, useSharedStyles, useTheme } from "@/theme";
import { enter, stagger } from "@/theme/motion";

/** A folder in the grid: its badge, name and item count. */
export function FolderCard({
	folder,
	count,
	index,
	onPress,
	onLongPress,
}: {
	folder: Folder;
	count: number;
	index: number;
	onPress: () => void;
	onLongPress: () => void;
}) {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	return (
		<Animated.View
			entering={enter.pop(stagger(index, 50))}
			style={styles.folderCell}
		>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={folder.name}
				onPress={onPress}
				onLongPress={onLongPress}
				haptic
				style={[shared.card, styles.folder]}
			>
				<FolderBadge color={folder.color} icon={folder.icon} />
				<Text size={15} weight="medium" numberOfLines={1} style={shared.flex}>
					{folder.name}
				</Text>
				<Text size={12} mono color={colors.muted}>
					{count}
				</Text>
			</Pressable>
		</Animated.View>
	);
}

const useStyles = makeStyles(() => ({
	folderCell: { width: "48%", flexGrow: 1 },
	folder: {
		height: 60,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 14,
		borderRadius: radii.md,
	},
}));
