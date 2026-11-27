import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { CodeFace } from "@/components/codes/CodeFace";
import { PageThumb } from "@/components/documents/PageThumb";
import { useRevealed } from "@/components/lock/hooks";
import { BrokenTile } from "@/components/ui/BrokenTile";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Icon } from "@/components/ui/Icon";
import { Pressable } from "@/components/ui/Pressable";
import { Text } from "@/components/ui/Text";
import { describeItem } from "@/domain/codes/describe";
import { hasPaper } from "@/domain/codes/style";
import { docTypeLabel } from "@/domain/library/documents";
import {
	catalogueNumber,
	isLocked,
	isPinned,
	shownTitle,
} from "@/domain/library/items";
import type { LibraryItem } from "@/domain/library/types";
import { withAlpha } from "@/lib/color";
import { pageUri } from "@/services/documents";
import { makeStyles, radii, useSharedStyles, useTheme } from "@/theme";
import { enter, transition } from "@/theme/motion";

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
	const { colors } = useTheme();
	const revealed = useRevealed(item);
	if (!revealed) {
		// A locked item shows nothing of what it holds: a lock on its card.
		return (
			<View
				style={[
					item.kind === "doc" ? shared.floating : shared.object,
					shared.center,
					{ width: size, height: size },
				]}
			>
				<Icon
					name="lock"
					size={Math.max(16, Math.round(size * 0.26))}
					color={colors.faint}
				/>
			</View>
		);
	}
	if (item.kind === "doc") {
		return (
			<View
				style={[shared.floating, shared.center, { width: size, height: size }]}
			>
				<PageThumb
					uri={item.pages[0] && pageUri(item, item.pages[0])}
					width={size * 0.44}
				/>
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
	/** A blue dot in the corner (the latest capture). */
	showNew?: boolean;
	delay?: number;
	/** In a multi-select: the tile shows a check circle and taps toggle it. */
	selecting?: boolean;
	selected?: boolean;
	onPress: () => void;
	onLongPress?: () => void;
};

/** How far a picked thumbnail shrinks inside its ring. */
const PICKED_SCALE = 0.88;

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
	selecting = false,
	selected = false,
	onPress,
	onLongPress,
}: ItemTileProps) {
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const revealed = useRevealed(item);
	const title = shownTitle(item, revealed);
	const number = catalogueNumber(item);
	const kind = String(
		item.kind === "doc"
			? caption === "short"
				? t("app.document.pages", { count: item.pages.length })
				: item.docType
					? docTypeLabel(item.docType)
					: t("app.library.doc_short")
			: describeItem(item).subtitle,
	);

	return (
		<Animated.View entering={enter.lift(delay)} style={{ width: size }}>
			<Pressable
				accessibilityRole={selecting ? "checkbox" : "button"}
				accessibilityLabel={
					isLocked(item) ? `${title}, ${t("app.lock.locked")}` : title
				}
				accessibilityState={selecting ? { checked: selected } : undefined}
				onPress={onPress}
				onLongPress={onLongPress}
				haptic
				style={styles.tile}
			>
				<View style={{ width: size, height: size }}>
					<Animated.View
						style={[
							styles.ring,
							{ opacity: selected ? 1 : 0 },
							transition("opacity", 220),
						]}
					/>
					<Animated.View
						style={[
							{ transform: [{ scale: selected ? PICKED_SCALE : 1 }] },
							transition("transform", 260),
						]}
					>
						<ItemThumb item={item} size={size} />
					</Animated.View>
					{selecting && (
						<Animated.View
							entering={enter.pop()}
							style={[styles.check, selected && styles.checked]}
						>
							{selected && (
								<Icon
									name="check"
									size={13}
									color={colors.onAccent}
									strokeWidth={3}
								/>
							)}
						</Animated.View>
					)}
				</View>
				{(isPinned(item) || isLocked(item)) && !selecting && (
					<View style={styles.badges}>
						{isPinned(item) && (
							<View
								style={styles.badge}
								accessibilityLabel={t("app.library.pinned_label")}
							>
								<Icon
									name="pin"
									size={11}
									color={colors.muted}
									strokeWidth={2}
								/>
							</View>
						)}
						{isLocked(item) && revealed && (
							<View style={styles.badge}>
								<Icon
									name="lock"
									size={11}
									color={colors.muted}
									strokeWidth={2}
								/>
							</View>
						)}
					</View>
				)}
				{showNew && !selecting && (
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
							{title}
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
	badges: {
		position: "absolute",
		top: 7,
		left: 7,
		flexDirection: "row",
		gap: 4,
	},
	badge: {
		width: 20,
		height: 20,
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: withAlpha(colors.surface, 0.9),
	},
	ring: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		borderRadius: radii.lg,
		borderWidth: 2,
		borderColor: colors.accent,
		backgroundColor: colors.accentSoft,
	},
	check: {
		position: "absolute",
		top: 8,
		right: 8,
		width: 22,
		height: 22,
		borderRadius: 11,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1.5,
		borderColor: colors.faint,
		backgroundColor: withAlpha(colors.surface, 0.85),
	},
	checked: {
		borderWidth: 2,
		borderColor: colors.surface,
		backgroundColor: colors.accent,
	},
}));
