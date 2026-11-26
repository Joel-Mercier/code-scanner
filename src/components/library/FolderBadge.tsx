import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import type { FolderColor, FolderIcon } from "@/domain/library/types";
import { useTheme } from "@/theme";

/** A folder's icon on its tinted tile. */
export function FolderBadge({
	color,
	icon,
	size = 32,
}: {
	color: FolderColor;
	icon: FolderIcon;
	size?: number;
}) {
	const { folderColors } = useTheme();
	const { tint, ink } = folderColors[color];
	return (
		<View
			style={[
				styles.badge,
				{
					width: size,
					height: size,
					borderRadius: size * 0.31,
					backgroundColor: tint,
				},
			]}
		>
			<Icon name={icon} size={size * 0.5} color={ink} />
		</View>
	);
}

const styles = StyleSheet.create({
	badge: { alignItems: "center", justifyContent: "center" },
});
