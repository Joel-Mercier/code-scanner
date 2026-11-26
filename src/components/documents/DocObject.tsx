import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import type { DerivedValue } from "react-native-reanimated";
import { Icon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { Turntable } from "@/components/ui/Turntable";
import { catalogueNumber } from "@/domain/library/items";
import type { DocItem } from "@/domain/library/types";
import { useTheme } from "@/theme";
import { Paper } from "./Paper";

/** A scanned page as a thin sheet, "PDF" on the back. */
export function DocObject({
	item,
	width,
	rotateX,
	rotateY,
}: {
	item: DocItem;
	width: number;
	rotateX: DerivedValue<number>;
	rotateY: DerivedValue<number>;
}) {
	const { colors } = useTheme();
	const height = width * (262 / 196);
	return (
		<Turntable
			width={width}
			height={height}
			radius={6}
			layers={[-3, -1.5, 0, 1.5]}
			layerColor={colors.paperEdge}
			faceDepth={3}
			rotateX={rotateX}
			rotateY={rotateY}
			front={
				item.pages[0] ? (
					<Image
						source={item.pages[0]}
						style={StyleSheet.absoluteFill}
						contentFit="cover"
					/>
				) : (
					<Paper width={width} height={height} scale={width / 168} />
				)
			}
			back={
				<View style={styles.back}>
					<Icon name="file" size={44} color={colors.accent} strokeWidth={1.5} />
					<Text size={11} mono color={colors.muted}>
						No. {catalogueNumber(item)} · {item.pdfUri ? "PDF" : "JPG"}
					</Text>
				</View>
			}
		/>
	);
}

const styles = StyleSheet.create({
	back: { alignItems: "center", justifyContent: "center", gap: 14 },
});
