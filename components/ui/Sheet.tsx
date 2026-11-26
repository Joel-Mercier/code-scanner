import {
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
	BottomSheetModal,
	BottomSheetScrollView,
	useBottomSheetTimingConfigs,
} from "@gorhom/bottom-sheet";
import { type ReactNode, type Ref, useState } from "react";
import { useTranslation } from "react-i18next";
import { useWindowDimensions } from "react-native";
import Animated, {
	type EntryExitAnimationFunction,
	type SharedValue,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomSheetBackHandler } from "@/hooks/useBottomSheetBackHandler";
import { boxShadow, makeStyles, radii, SCREEN_GAP, useTheme } from "@/theme";
import { easeSheet } from "@/theme/motion";
import { IconButton } from "./IconButton";

/** A sheet's current page, from `useSheetPages`. */
type SheetPage = {
	key: string;
	direction: SharedValue<number>;
	/** Goes back to the page this one was opened from; unset on a first page. */
	back?: () => void;
};

/**
 * Steps of one sheet. Going to a deeper step slides it in from the right,
 * going back slides it in from the left, while the sheet resizes to fit: one
 * sheet morphs instead of a second one opening over it. A step opened from
 * another gets a back arrow (and the hardware back) to its parent.
 */
export function useSheetPages<P extends string>(
	initial: P,
	depth: (page: P) => number,
) {
	const [page, setPage] = useState<P>(initial);
	// The pages above this one, shallowest first.
	const [trail, setTrail] = useState<P[]>([]);
	const direction = useSharedValue(0);
	const go = (next: P) => {
		const forward = depth(next) > depth(page);
		direction.set(depth(next) >= depth(page) ? 1 : -1);
		setTrail(
			forward
				? [...trail, page]
				: trail.filter((above) => depth(above) < depth(next)),
		);
		setPage(next);
	};
	const parent = trail.at(-1);
	return {
		page,
		/** Slides to `next`. */
		go,
		/** Shows `next` without sliding (before presenting the sheet). */
		reset: (next: P) => {
			direction.set(0);
			setTrail([]);
			setPage(next);
		},
		sheetPage: {
			key: page,
			direction,
			back: parent === undefined ? undefined : () => go(parent),
		} satisfies SheetPage,
	};
}

const PAGE_TIMING = { duration: 420, easing: easeSheet };

/** Enters from the side it comes from; nothing on the first page. */
const pageIn =
	(
		direction: SharedValue<number>,
		distance: number,
	): EntryExitAnimationFunction =>
	() => {
		"worklet";
		const side = direction.get();
		if (side === 0) return { initialValues: {}, animations: {} };
		return {
			initialValues: {
				opacity: 0,
				transform: [{ translateX: distance * side }],
			},
			animations: {
				opacity: withTiming(1, PAGE_TIMING),
				transform: [{ translateX: withTiming(0, PAGE_TIMING) }],
			},
		};
	};

/** Leaves the other way (read when it leaves, so it knows the direction). */
const pageOut =
	(
		direction: SharedValue<number>,
		distance: number,
	): EntryExitAnimationFunction =>
	() => {
		"worklet";
		const side = direction.get();
		return {
			initialValues: { opacity: 1, transform: [{ translateX: 0 }] },
			animations: {
				opacity: withTiming(0, PAGE_TIMING),
				transform: [
					{
						translateX: withTiming(
							side === 0 ? 0 : -distance * side,
							PAGE_TIMING,
						),
					},
				],
			},
		};
	};

type SheetProps = {
	ref: Ref<BottomSheetModal>;
	children: ReactNode;
	/** Slides between pages when it changes (see `useSheetPages`). */
	page?: SheetPage;
	onDismiss?: () => void;
	/** Turn off to keep drags inside the content (e.g. a colour panel) from moving the sheet. */
	enableContentPanningGesture?: boolean;
	/** Horizontal padding of the content. */
	inset?: number;
	gap?: number;
};

function Backdrop(props: BottomSheetBackdropProps) {
	const { colors } = useTheme();
	return (
		<BottomSheetBackdrop
			{...props}
			appearsOnIndex={0}
			disappearsOnIndex={-1}
			opacity={1}
			style={[props.style, { backgroundColor: colors.scrim }]}
		/>
	);
}

/** `.v-sheet`: slides up over a dimmed screen. */
export function Sheet({
	ref,
	children,
	onDismiss,
	enableContentPanningGesture = true,
	inset = 20,
	gap = 18,
	page,
}: SheetProps) {
	const { shadows } = useTheme();
	const { width } = useWindowDimensions();
	const styles = useStyles();
	const insets = useSafeAreaInsets();
	const animationConfigs = useBottomSheetTimingConfigs({
		duration: 500,
		easing: easeSheet,
	});
	const sheetRef = ref as React.RefObject<BottomSheetModal | null>;
	const { t } = useTranslation();
	const { handleSheetPositionChange } = useBottomSheetBackHandler(
		sheetRef,
		page?.back,
	);

	return (
		<BottomSheetModal
			ref={ref}
			onChange={handleSheetPositionChange}
			onDismiss={onDismiss}
			animationConfigs={animationConfigs}
			backdropComponent={Backdrop}
			backgroundStyle={[styles.background, boxShadow(shadows.sheet)]}
			handleStyle={styles.handleArea}
			handleIndicatorStyle={styles.handle}
			topInset={insets.top + 24}
			keyboardBlurBehavior="restore"
			enableContentPanningGesture={enableContentPanningGesture}
		>
			<BottomSheetScrollView
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingHorizontal: inset,
					paddingTop: 8,
					paddingBottom: insets.bottom + SCREEN_GAP,
					gap: page ? 0 : gap,
				}}
			>
				{page ? (
					<Animated.View
						key={page.key}
						entering={pageIn(page.direction, width * 0.6)}
						exiting={pageOut(page.direction, width * 0.6)}
						style={{ gap }}
					>
						{page.back && (
							<IconButton
								icon="back"
								accessibilityLabel={t("app.common.back")}
								size={40}
								iconSize={18}
								onPress={page.back}
							/>
						)}
						{children}
					</Animated.View>
				) : (
					children
				)}
			</BottomSheetScrollView>
		</BottomSheetModal>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	background: {
		backgroundColor: colors.canvas,
		borderTopLeftRadius: radii.sheet,
		borderTopRightRadius: radii.sheet,
	},
	handleArea: { paddingTop: 10, paddingBottom: 0 },
	handle: { backgroundColor: colors.dashed, width: 40, height: 4 },
}));
