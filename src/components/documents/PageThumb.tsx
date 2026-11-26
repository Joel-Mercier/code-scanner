import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { makeStyles } from "@/theme";

/** A small page: the first scanned page, framed like a sheet of paper. */
export function PageThumb({ uri, width }: { uri?: string; width: number }) {
	const styles = useStyles();
	return (
		<View
			style={[styles.page, { width, height: width * (4 / 3) }]}
			accessibilityIgnoresInvertColors
		>
			{uri && (
				<Image
					source={uri}
					style={StyleSheet.absoluteFill}
					contentFit="cover"
					transition={150}
				/>
			)}
		</View>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	page: {
		borderRadius: 3,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surface,
		overflow: "hidden",
	},
}));
