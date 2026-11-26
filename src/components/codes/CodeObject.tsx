import { StyleSheet, View } from "react-native";
import type { DerivedValue } from "react-native-reanimated";
import { Icon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { Turntable } from "@/components/ui/Turntable";
import { describeItem } from "@/domain/codes/describe";
import { hasPaper } from "@/domain/codes/style";
import { catalogueNumber } from "@/domain/library/items";
import type { CodeItem } from "@/domain/library/types";
import { useTheme } from "@/theme";
import { CodeFace } from "./CodeFace";
import { kindIcons } from "./kindIcons";

/** A code printed on a thick white tile, its kind on the back. */
export function CodeObject({
	item,
	size,
	layers,
	faceDepth,
	rotateX,
	rotateY,
}: {
	item: CodeItem;
	size: number;
	/** Depths of the slabs that give the tile its thickness. */
	layers: number[];
	faceDepth: number;
	rotateX: DerivedValue<number>;
	rotateY: DerivedValue<number>;
}) {
	const { colors } = useTheme();
	const padding = size * (hasPaper(item.style) ? 0.082 : 0.13);
	return (
		<Turntable
			width={size}
			height={size}
			radius={32}
			layers={layers}
			faceDepth={faceDepth}
			rotateX={rotateX}
			rotateY={rotateY}
			faceStyle={{ padding }}
			frontStyle={{
				backgroundColor: colors.object,
				borderColor: colors.objectEdge,
			}}
			front={
				<CodeFace
					format={item.format}
					data={item.data}
					style={item.style}
					size={size - padding * 2}
				/>
			}
			back={
				<View style={styles.back}>
					<Icon
						name={kindIcons[describeItem(item).kind]}
						size={size * 0.22}
						color={colors.accent}
						strokeWidth={1.5}
					/>
					<Text size={11} mono color={colors.muted}>
						No. {catalogueNumber(item)}
					</Text>
				</View>
			}
		/>
	);
}

const styles = StyleSheet.create({
	back: { alignItems: "center", justifyContent: "center", gap: 14 },
});
