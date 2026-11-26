import type { ReactNode } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";
import { makeStyles, useSharedStyles, useTheme } from "@/theme";
import { Icon, type IconName } from "./Icon";
import { Pressable } from "./Pressable";
import { Text } from "./Text";

/** A card of rows separated by hairlines. */
export function ListCard({
	children,
	style,
}: {
	children: ReactNode;
	style?: StyleProp<ViewStyle>;
}) {
	const shared = useSharedStyles();
	const styles = useStyles();
	return <View style={[shared.card, styles.card, style]}>{children}</View>;
}

type ListRowProps = {
	label: string;
	description?: string;
	icon?: IconName;
	/** Draws the icon in a soft tile (settings, pickers) instead of bare. */
	iconTile?: number;
	trailing?: ReactNode;
	chevron?: boolean;
	last?: boolean;
	height?: number;
	onPress?: () => void;
	accessibilityLabel?: string;
};

export function ListRow({
	label,
	description,
	icon,
	iconTile,
	trailing,
	chevron,
	last,
	height = 56,
	onPress,
	accessibilityLabel,
}: ListRowProps) {
	const { colors } = useTheme();
	const shared = useSharedStyles();
	const styles = useStyles();
	const content = (
		<View style={[styles.row, { minHeight: height }, !last && shared.divider]}>
			{icon &&
				(iconTile ? (
					<View
						style={[
							shared.iconTile,
							{
								width: iconTile,
								height: iconTile,
								borderRadius: iconTile * 0.3,
							},
						]}
					>
						<Icon name={icon} size={18} />
					</View>
				) : (
					<Icon name={icon} size={20} />
				))}
			<View style={styles.text}>
				<Text size={16} weight={description ? "medium" : "regular"}>
					{label}
				</Text>
				{description && (
					<Text size={13} color={colors.muted}>
						{description}
					</Text>
				)}
			</View>
			{trailing}
			{chevron && <Icon name="chevronRight" size={18} color={colors.muted} />}
		</View>
	);
	if (!onPress) return content;
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel ?? label}
			pressedScale={0.98}
			haptic
			onPress={onPress}
		>
			{content}
		</Pressable>
	);
}

/** Label/value rows (the design's `<dl>`). */
export function DetailRows({ rows }: { rows: [string, ReactNode][] }) {
	const { colors } = useTheme();
	const shared = useSharedStyles();
	const styles = useStyles();
	return (
		<ListCard>
			{rows.map(([label, value], index) => (
				<View
					key={label}
					style={[styles.detail, index < rows.length - 1 && shared.divider]}
				>
					<Text size={15} color={colors.muted}>
						{label}
					</Text>
					{typeof value === "string" ? (
						<Text
							size={14}
							mono
							selectable
							numberOfLines={3}
							style={styles.value}
						>
							{value}
						</Text>
					) : (
						value
					)}
				</View>
			))}
		</ListCard>
	);
}

const useStyles = makeStyles(() => ({
	card: { paddingHorizontal: 16 },
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		paddingVertical: 8,
	},
	text: { flex: 1, gap: 2 },
	detail: {
		minHeight: 52,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 16,
		paddingVertical: 8,
	},
	value: { flexShrink: 1, textAlign: "right" },
}));
