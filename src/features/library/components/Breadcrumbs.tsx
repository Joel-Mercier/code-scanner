import { View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { Pressable } from "@/components/ui/Pressable";
import { Text } from "@/components/ui/Text";
import { makeStyles, useTheme } from "@/theme";

/** "Collection / Travel /": the folders above this one, each a way back. */
export function Breadcrumbs({
	trail,
	onOpen,
}: {
	trail: { id: string | null; name: string }[];
	onOpen: (folderId: string | null) => void;
}) {
	const { colors } = useTheme();
	const styles = useStyles();
	return (
		<View accessibilityRole="toolbar" style={styles.crumbs}>
			{trail.map((crumb) => (
				<View key={crumb.id ?? "root"} style={styles.crumb}>
					<Pressable
						accessibilityRole="link"
						onPress={() => onOpen(crumb.id)}
						hitSlop={8}
						style={styles.crumbLink}
					>
						<Text size={12} mono color={colors.muted} numberOfLines={1}>
							{crumb.name.toUpperCase()}
						</Text>
					</Pressable>
					<Icon name="chevronRight" size={13} color={colors.faint} />
				</View>
			))}
		</View>
	);
}

const useStyles = makeStyles(() => ({
	crumbs: {
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "center",
		marginBottom: 4,
	},
	crumb: { flexDirection: "row", alignItems: "center", gap: 2 },
	crumbLink: { paddingVertical: 4, paddingRight: 2, maxWidth: 180 },
}));
