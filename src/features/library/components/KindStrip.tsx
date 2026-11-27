import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { kindIcons } from "@/components/codes/kindIcons";
import { Icon } from "@/components/ui/Icon";
import { Pressable } from "@/components/ui/Pressable";
import { haptics } from "@/lib/haptics";
import { boxShadow, makeStyles, useSharedStyles, useTheme } from "@/theme";
import { type Kind, stripKinds } from "../rows";

/**
 * Every kind of object, lit when the collection holds one. Tapping a lit
 * kind shows only that kind; tapping it again shows everything.
 */
export function KindStrip({
	found,
	selected,
	onSelect,
}: {
	found: Set<Kind>;
	selected: Kind | null;
	onSelect: (kind: Kind | null) => void;
}) {
	const { colors, shadows } = useTheme();
	const shared = useSharedStyles();
	const styles = useStyles();
	const { t } = useTranslation();
	return (
		<View style={styles.kinds}>
			{stripKinds(found).map((kind) => {
				const has = found.has(kind);
				const active = kind === selected;
				const label = t(
					kind === "doc" ? "app.library.document" : `app.kinds.${kind}`,
				);
				return (
					<Pressable
						key={kind}
						accessibilityRole="button"
						accessibilityLabel={
							has ? label : t("app.library.kind_missing", { kind: label })
						}
						accessibilityState={{ selected: active, disabled: !has }}
						disabled={!has}
						pressedScale={0.9}
						onPress={() => {
							haptics.select();
							onSelect(active ? null : kind);
						}}
						style={[
							shared.center,
							styles.kind,
							!has
								? shared.dashed
								: active
									? styles.kindActive
									: [styles.kindFound, boxShadow(shadows.chip)],
							selected && !active && styles.kindDimmed,
						]}
					>
						{has && (
							<Icon
								name={kindIcons[kind]}
								size={14}
								color={active ? colors.canvas : colors.ink}
							/>
						)}
					</Pressable>
				);
			})}
		</View>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	kinds: {
		flexDirection: "row",
		gap: 4,
		paddingTop: 14,
		paddingHorizontal: 20,
	},
	kind: { flex: 1, aspectRatio: 1, borderRadius: 9 },
	kindFound: { backgroundColor: colors.surface },
	kindActive: { backgroundColor: colors.ink },
	kindDimmed: { opacity: 0.45 },
}));
