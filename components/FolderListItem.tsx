import { ThemedText } from "@/components/ui/ThemedText";
import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import type { Folder as FolderType } from "@/stores/documents";
import { Link } from "expo-router";
import { Folder } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

interface FolderListItemProps {
	folder: FolderType;
	index: number;
}

export default function FolderListItem({ folder, index }: FolderListItemProps) {
	return (
		<Link href={`/folders/${folder.id}`} asChild>
			<Pressable style={styles.container}>
				<Folder size={26} color={Colors.primary} fill={Colors.primary} />
				<View>
					<ThemedText variant="title" style={styles.title} numberOfLines={1}>
						{folder.name}
					</ThemedText>
					<ThemedText
						variant="small"
						style={styles.documentsCount}
						numberOfLines={1}
					>
						{folder.childrenDocuments?.length || 0} documents
					</ThemedText>
				</View>
			</Pressable>
		</Link>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacings.md,
		paddingHorizontal: Spacings.md,
		paddingVertical: Spacings.md,
		backgroundColor: Colors.background,
		borderRadius: Spacings.sm,
	},
	title: {
		fontSize: 18,
	},
	documentsCount: {
		color: Colors.mutedText,
	},
});
