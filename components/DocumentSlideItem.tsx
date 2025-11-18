import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import { Dimensions, Image, StyleSheet, View } from "react-native";
import { ThemedText } from "./ui/ThemedText";

const width = Dimensions.get("window").width - Spacings.md * 2;

export default function DocumentSlideItem({
	item,
	index,
}: { item: string; index: number }) {
	return (
		<View style={styles.itemContainer}>
			<Image source={{ uri: item }} resizeMode="contain" style={styles.image} />
			<ThemedText numberOfLines={1}>{item}</ThemedText>
		</View>
	);
}

const styles = StyleSheet.create({
	itemContainer: {
		justifyContent: "center",
		alignItems: "center",
		gap: Spacings.md,
		width: width,
		backgroundColor: "blue",
		height: "100%",
		flex: 1,
		flexGrow: 1,
	},
	image: {
		width: "100%",
		height: "auto",
		backgroundColor: Colors.white,
	},
});
