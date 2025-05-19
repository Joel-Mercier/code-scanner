import { Colors } from "@/constants/Colors";
import type { TextProps } from "react-native";
import { StyleSheet, Text } from "react-native";

export type ThemedTextProps = TextProps & {
	variant?: "default" | "title" | "subtitle" | "link";
};

export function ThemedText({
	variant = "default",
	style,
	...rest
}: ThemedTextProps) {
	return <Text style={[styles[variant], style]} {...rest} />;
}

const styles = StyleSheet.create({
	default: {
		fontFamily: "Inter_400Regular",
		fontSize: 16,
		lineHeight: 24,
		color: Colors.white,
	},
	title: {
		fontFamily: "Inter_700Bold",
		fontSize: 24,
		fontWeight: "bold",
		lineHeight: 28,
		color: Colors.white,
	},
	subtitle: {
		fontFamily: "Inter_400Regular",
		fontSize: 20,
		fontWeight: "bold",
		color: Colors.white,
	},
	link: {
		fontFamily: "Inter_400Regular",
		lineHeight: 30,
		fontSize: 16,
		color: "#0a7ea4",
	},
});
