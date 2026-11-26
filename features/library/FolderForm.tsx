import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Pressable } from "@/components/ui/Pressable";
import { Eyebrow, Text } from "@/components/ui/Text";
import { TextField } from "@/components/ui/TextField";
import { type Folder, type FolderIcon, folderIcons } from "@/stores/library";
import {
	boxShadow,
	type FolderColor,
	folderColorKeys,
	readableOn,
	useTheme,
} from "@/theme";
import { enter } from "@/theme/motion";
import { haptics } from "@/utils/haptics";

/** The sheet's horizontal padding (see `Sheet`). */
const SHEET_INSET = 20;
const ICON_GAP = 8;

type FolderFormValues = Pick<Folder, "name" | "color" | "icon">;

type FolderFormProps = {
	initial?: Partial<FolderFormValues>;
	title: string;
	/** A caption under the title; nothing when omitted. */
	subtitle?: string;
	submitLabel: string;
	onSubmit: (values: FolderFormValues) => void;
};

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

export function FolderForm({
	initial,
	title,
	subtitle,
	submitLabel,
	onSubmit,
}: FolderFormProps) {
	const { colors, shadows, folderColors } = useTheme();
	const { t } = useTranslation();
	const [name, setName] = useState(initial?.name ?? "");
	const [color, setColor] = useState<FolderColor>(initial?.color ?? "blue");
	const [icon, setIcon] = useState<FolderIcon>(initial?.icon ?? "folder");
	const valid = name.trim().length > 0;
	const { tint, ink } = folderColors[color];
	// Six square cells per row across the sheet's content width.
	const { width } = useWindowDimensions();
	const cell = Math.floor((width - SHEET_INSET * 2 - ICON_GAP * 5) / 6);

	return (
		<>
			<View style={styles.header}>
				<View style={[styles.preview, { backgroundColor: tint }]}>
					<Animated.View key={`${icon}-${color}`} entering={enter.pop()}>
						<Icon name={icon} size={28} color={ink} />
					</Animated.View>
				</View>
				<View style={styles.headerText}>
					<Text size={24} weight="semibold" tracking={-0.02} numberOfLines={1}>
						{title}
					</Text>
					{subtitle ? (
						<Text size={12} mono color={colors.muted}>
							{subtitle}
						</Text>
					) : null}
				</View>
			</View>

			<View style={styles.field}>
				<Eyebrow>{t("app.folder.name")}</Eyebrow>
				<TextField
					inSheet
					value={name}
					onChangeText={setName}
					placeholder={t("app.folder.name_placeholder")}
					maxLength={40}
					returnKeyType="done"
				/>
			</View>

			<View style={styles.field}>
				<Eyebrow>{t("app.folder.color")}</Eyebrow>
				<View style={styles.row}>
					{folderColorKeys.map((option) => {
						const selected = option === color;
						const swatch = folderColors[option].ink;
						return (
							<Pressable
								key={option}
								accessibilityRole="radio"
								accessibilityLabel={t(`app.folder.colors.${option}`)}
								accessibilityState={{ selected }}
								pressedScale={0.92}
								onPress={() => {
									haptics.select();
									setColor(option);
								}}
								style={[
									styles.swatch,
									{ backgroundColor: swatch },
									selected && {
										boxShadow: `0px 0px 0px 3px ${colors.canvas}, 0px 0px 0px 5px ${swatch}`,
									},
								]}
							>
								{selected && (
									<Animated.View entering={enter.pop()}>
										<Icon
											name="check"
											size={18}
											color={readableOn(swatch)}
											strokeWidth={2.4}
										/>
									</Animated.View>
								)}
							</Pressable>
						);
					})}
				</View>
			</View>

			<View style={styles.field}>
				<Eyebrow>{t("app.folder.icon")}</Eyebrow>
				<View style={styles.icons}>
					{folderIcons.map((option) => {
						const selected = option === icon;
						return (
							<Pressable
								key={option}
								accessibilityRole="radio"
								accessibilityLabel={t(`app.folder.icons.${option}`)}
								accessibilityState={{ selected }}
								pressedScale={0.92}
								onPress={() => {
									haptics.select();
									setIcon(option);
								}}
								style={[
									styles.iconCell,
									{ width: cell, height: cell },
									selected
										? { backgroundColor: ink }
										: [
												{ backgroundColor: colors.surface },
												boxShadow(shadows.chip),
											],
								]}
							>
								<Icon
									name={option}
									size={20}
									color={selected ? readableOn(ink) : colors.ink}
								/>
							</Pressable>
						);
					})}
				</View>
			</View>

			<Button
				icon="folderPlus"
				label={submitLabel}
				disabled={!valid}
				onPress={() => onSubmit({ name: name.trim(), color, icon })}
			/>
		</>
	);
}

const styles = StyleSheet.create({
	header: { flexDirection: "row", alignItems: "center", gap: 14 },
	preview: {
		width: 64,
		height: 64,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	headerText: { flex: 1, gap: 2 },
	field: { gap: 10 },
	row: { flexDirection: "row", justifyContent: "space-between" },
	swatch: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
	},
	icons: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		rowGap: ICON_GAP,
	},
	iconCell: {
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	badge: { alignItems: "center", justifyContent: "center" },
});
