import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { boxShadow, makeStyles, radii, useTheme } from "@/theme";
import { enter, exit } from "@/theme/motion";
import { Icon, type IconName } from "./Icon";
import { IconButton } from "./IconButton";
import { Pressable } from "./Pressable";
import { Text } from "./Text";

/** The bar's own height; a list under it reserves this plus `SELECTION_BAR_GAP`. */
export const SELECTION_BAR_HEIGHT = 64;
/** Space between the bar and the safe area. */
export const SELECTION_BAR_GAP = 12;

export type SelectionAction = {
	key: string;
	icon: IconName;
	label: string;
	onPress: () => void;
	/** `danger`: a destructive action (delete), in red. */
	tone?: "default" | "danger";
	disabled?: boolean;
};

type SelectionBarProps = {
	/** What's picked, e.g. "3 selected". */
	label: string;
	actions: SelectionAction[];
	/** Leaves the selection mode. */
	onCancel: () => void;
};

/**
 * A toolbar floating at the bottom of the screen while items are picked: ✕ to
 * leave, the count, then the bulk actions. Mount it only while selecting; it
 * rises in and sinks away.
 */
export function SelectionBar({ label, actions, onCancel }: SelectionBarProps) {
	const { shadows } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const insets = useSafeAreaInsets();
	return (
		<Animated.View
			entering={enter.up(0, 320)}
			exiting={exit.sink()}
			accessibilityRole="toolbar"
			style={[
				styles.bar,
				boxShadow(shadows.raised),
				{ bottom: insets.bottom + SELECTION_BAR_GAP },
			]}
		>
			<IconButton
				icon="close"
				accessibilityLabel={t("app.common.cancel")}
				variant="solid"
				size={44}
				iconSize={18}
				onPress={onCancel}
				style={styles.cancel}
			/>
			<View style={styles.count}>
				<Animated.View key={label} entering={enter.fade()}>
					<Text
						size={15}
						weight="semibold"
						numberOfLines={1}
						accessibilityLiveRegion="polite"
					>
						{label}
					</Text>
				</Animated.View>
			</View>
			{actions.map(({ key, ...action }) => (
				<Action key={key} {...action} />
			))}
		</Animated.View>
	);
}

function Action({
	icon,
	label,
	onPress,
	tone,
	disabled,
}: Omit<SelectionAction, "key">) {
	const { colors } = useTheme();
	const styles = useStyles();
	const color = tone === "danger" ? colors.danger : colors.ink;
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{ disabled }}
			disabled={disabled}
			onPress={onPress}
			haptic
			pressedScale={0.92}
			style={[styles.action, disabled && styles.disabled]}
		>
			<Icon name={icon} size={20} color={color} />
			<Text size={11} weight="medium" color={color} numberOfLines={1}>
				{label}
			</Text>
		</Pressable>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	bar: {
		position: "absolute",
		left: 16,
		right: 16,
		height: SELECTION_BAR_HEIGHT,
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingLeft: 10,
		paddingRight: 6,
		borderRadius: radii.xl,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.borderSoft,
		zIndex: 20,
	},
	cancel: { backgroundColor: colors.tile },
	count: { flex: 1, paddingHorizontal: 8 },
	action: {
		minWidth: 64,
		height: 52,
		paddingHorizontal: 8,
		alignItems: "center",
		justifyContent: "center",
		gap: 3,
		borderRadius: radii.md,
	},
	disabled: { opacity: 0.4 },
}));
