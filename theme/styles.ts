import { radii } from "./tokens";
import { makeStyles } from "./useTheme";

/**
 * Style fragments shared across screens. Combine them with local styles:
 * `style={[shared.card, styles.folder]}`.
 */
export const useSharedStyles = makeStyles(({ colors, shadows }) => ({
	/** A full screen on the page colour. */
	screen: { flex: 1, backgroundColor: colors.canvas },
	flex: { flex: 1 },
	center: { alignItems: "center", justifyContent: "center" },
	row: { flexDirection: "row", alignItems: "center" },
	/** The large title block under the header ("Collection", "Settings"…). */
	titleBlock: { paddingHorizontal: 20 },
	/** White card with a hairline border (lists, details, folders). */
	card: {
		backgroundColor: colors.surface,
		borderRadius: radii.lg,
		borderWidth: 1,
		borderColor: colors.borderSoft,
	},
	/** White card floating on a soft shadow (tiles, highlights). */
	floating: {
		backgroundColor: colors.surface,
		borderRadius: radii.lg,
		boxShadow: shadows.card,
	},
	/** The white tile codes are printed on, in both themes. */
	object: {
		backgroundColor: colors.object,
		borderRadius: radii.lg,
		boxShadow: shadows.card,
	},
	/** Hairline between rows. */
	divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
	/** An empty slot or a "+ add" affordance. */
	dashed: {
		borderWidth: 1,
		borderStyle: "dashed",
		borderColor: colors.dashed,
	},
	/** A soft square behind an icon; set its size where used. */
	iconTile: {
		backgroundColor: colors.tile,
		alignItems: "center",
		justifyContent: "center",
	},
	/** A sunken block of secondary content (raw data, error details). */
	well: {
		paddingVertical: 14,
		paddingHorizontal: 16,
		borderRadius: radii.lg,
		backgroundColor: colors.well,
		gap: 6,
	},
	/** A small rounded label ("3 PAGES", "PDF"). */
	chip: {
		height: 30,
		paddingHorizontal: 12,
		borderRadius: radii.pill,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.borderSoft,
		justifyContent: "center",
	},
	/** A text field (and field-like buttons such as the date picker). */
	input: {
		minHeight: 52,
		borderRadius: radii.md,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		paddingHorizontal: 16,
	},
	/** A "warning" banner. */
	warning: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		padding: 12,
		borderRadius: radii.sm,
		backgroundColor: colors.dangerSoft,
	},
}));
