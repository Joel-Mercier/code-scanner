import { useSafeAreaInsets } from "react-native-safe-area-context";

/** The header's round buttons. */
export const HEADER_ROW = 46;
/** Space between the safe area and the header's buttons. */
export const HEADER_TOP = 6;
/**
 * Breathing room between the chrome and the content: under the header at the
 * top, above the safe area at the bottom.
 */
export const SCREEN_GAP = 20;

/**
 * Where a screen's content starts and ends. The header floats over the
 * content, so scrolling content starts below it and ends the same gap above
 * the bottom edge.
 */
export function useScreenInsets() {
	const insets = useSafeAreaInsets();
	const header = insets.top + HEADER_TOP + HEADER_ROW;
	const top = header + SCREEN_GAP;
	const bottom = insets.bottom + SCREEN_GAP;
	return {
		/** Bottom of the header's buttons. */
		header,
		top,
		bottom,
		/** For a scroll view's `contentContainerStyle`. */
		content: { paddingTop: top, paddingBottom: bottom },
	};
}
