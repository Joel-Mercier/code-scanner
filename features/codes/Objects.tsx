import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import type { DerivedValue } from "react-native-reanimated";
import { CodeFace, hasPaper } from "@/components/codes/CodeFace";
import { Icon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { Turntable } from "@/components/ui/Turntable";
import { Paper } from "@/features/scan/PaperStack";
import { type CodeItem, catalogueNumber, type DocItem } from "@/stores/library";
import { useTheme } from "@/theme";
import { describeItem, kindIcons } from "./kinds";

type Rotation = {
	rotateX: DerivedValue<number>;
	rotateY: DerivedValue<number>;
};

/** A code printed on a thick white tile, its kind on the back. */
export function CodeObject({
	item,
	size,
	layers,
	faceDepth,
	...rotation
}: Rotation & {
	item: CodeItem;
	size: number;
	layers: number[];
	faceDepth: number;
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
			{...rotation}
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

/** A scanned page as a thin sheet, "PDF" on the back. */
export function DocObject({
	item,
	width,
	...rotation
}: Rotation & { item: DocItem; width: number }) {
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
			{...rotation}
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
