import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { CodeFace, hasPaper, PageThumb } from "@/components/codes/CodeFace";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { BrokenTile } from "@/components/ui/ErrorScreen";
import { Pressable } from "@/components/ui/Pressable";
import { Text } from "@/components/ui/Text";
import { describeItem } from "@/features/codes/kinds";
import { catalogueNumber, type LibraryItem } from "@/stores/library";
import { makeStyles, useSharedStyles, useTheme } from "@/theme";
import { enter } from "@/theme/motion";
import { itemTitle } from "./itemText";

/** How long a capture keeps its blue "new" dot. */
const NEW_FOR = 24 * 60 * 60 * 1000;

export const isNew = (item: LibraryItem) =>
	Date.now() - item.createdAt < NEW_FOR;

/** A code or a page sitting on a white square card. */
export function ItemThumb(props: { item: LibraryItem; size: number }) {
	const { t } = useTranslation();
	return (
		<ErrorBoundary
			resetKeys={[props.item]}
			fallback={() => (
				<BrokenTile size={props.size} label={t("app.error.item")} />
			)}
		>
			<Thumb {...props} />
		</ErrorBoundary>
	);
}

function Thumb({ item, size }: { item: LibraryItem; size: number }) {
	const shared = useSharedStyles();
	if (item.kind === "doc") {
		return (
			<View
				style={[shared.floating, shared.center, { width: size, height: size }]}
			>
				<PageThumb uri={item.pages[0]} width={size * 0.44} />
			</View>
		);
	}
	const padding = size * (hasPaper(item.style) ? 0.11 : 0.165);
	return (
		<View
			style={[
				shared.object,
				shared.center,
				{ width: size, height: size, padding },
			]}
		>
			<CodeFace
				format={item.format}
				data={item.data}
				style={item.style}
				size={size - padding * 2}
				thumbnail
			/>
		</View>
	);
}

/** Caption line heights of a `full` tile, fixed so the tile's height is known. */
const TITLE = { size: 13, leading: 1.35 };
const META = { size: 10.5, leading: 1.35 };
const TILE_GAP = 8;
const CAPTION_GAP = 2;

/**
 * Height of a `full` tile of `size`, at the system text scale, so a list can
 * lay its rows out without measuring them.
 */
export const fullTileHeight = (size: number, fontScale: number) =>
	size +
	TILE_GAP +
	(TITLE.size * TITLE.leading + META.size * META.leading) * fontScale +
	CAPTION_GAP;

type ItemTileProps = {
	item: LibraryItem;
	size: number;
	/** `short`: just "044 · Wi-Fi" (home); `full`: title + kind (collection). */
	caption?: "short" | "full";
	showNew?: boolean;
	delay?: number;
	onPress: () => void;
	onLongPress?: () => void;
};

/** A tile in a grid; a tile that fails to draw doesn't break the grid. */
export function ItemTile(props: ItemTileProps) {
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	return (
		<ErrorBoundary
			resetKeys={[props.item]}
			fallback={() => (
				<View style={[styles.tile, { width: props.size }]}>
					<BrokenTile size={props.size} label={t("app.error.item")} />
					<Text size={11} mono color={colors.muted} numberOfLines={1}>
						{t("app.error.item_short")}
					</Text>
				</View>
			)}
		>
			<Tile {...props} />
		</ErrorBoundary>
	);
}

function Tile({
	item,
	size,
	caption = "full",
	showNew = false,
	delay = 0,
	onPress,
	onLongPress,
}: ItemTileProps) {
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const number = catalogueNumber(item);
	const kind = String(
		item.kind === "doc"
			? caption === "short"
				? t("app.document.pages", { count: item.pages.length })
				: t("app.library.doc_short")
			: describeItem(item).subtitle,
	);

	return (
		<Animated.View entering={enter.lift(delay)} style={{ width: size }}>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={itemTitle(item)}
				onPress={onPress}
				onLongPress={onLongPress}
				haptic
				style={styles.tile}
			>
				<ItemThumb item={item} size={size} />
				{showNew && (
					<View style={styles.new} accessibilityLabel={t("app.library.new")} />
				)}
				{caption === "short" ? (
					<Text size={11} mono color={colors.muted} numberOfLines={1}>
						{number} · {kind}
					</Text>
				) : (
					<View style={styles.caption}>
						<Text
							size={TITLE.size}
							leading={TITLE.leading}
							weight="medium"
							numberOfLines={1}
						>
							{itemTitle(item)}
						</Text>
						<Text
							size={META.size}
							leading={META.leading}
							mono
							color={colors.muted}
							numberOfLines={1}
						>
							{number} · {kind.toUpperCase()}
						</Text>
					</View>
				)}
			</Pressable>
		</Animated.View>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	tile: { gap: TILE_GAP },
	new: {
		position: "absolute",
		top: 10,
		right: 10,
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: colors.accent,
	},
	caption: { gap: CAPTION_GAP },
}));
