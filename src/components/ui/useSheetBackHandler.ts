import type {
	BottomSheetModal,
	BottomSheetModalProps,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useRef } from "react";
import { BackHandler, type EventSubscription } from "react-native";

/**
 * Android's back button dismisses the sheet while it is visible.
 * @param bottomSheetRef the sheet to dismiss
 * @param onBack when set, the back press calls it instead (a nested page going back to its parent)
 */
export const useSheetBackHandler = (
	bottomSheetRef: React.RefObject<BottomSheetModal | null>,
	onBack?: () => void,
) => {
	const backHandlerSubscriptionRef = useRef<EventSubscription | null>(null);
	// Read at press time: the listener outlives the page it was added on.
	const onBackRef = useRef(onBack);
	useEffect(() => {
		onBackRef.current = onBack;
	}, [onBack]);
	const handleSheetPositionChange = useCallback<
		NonNullable<BottomSheetModalProps["onChange"]>
	>(
		(index) => {
			const isBottomSheetVisible = index >= 0;
			if (isBottomSheetVisible && !backHandlerSubscriptionRef.current) {
				backHandlerSubscriptionRef.current = BackHandler.addEventListener(
					"hardwareBackPress",
					() => {
						if (onBackRef.current) onBackRef.current();
						else bottomSheetRef.current?.dismiss();
						return true;
					},
				);
			} else if (!isBottomSheetVisible) {
				backHandlerSubscriptionRef.current?.remove();
				backHandlerSubscriptionRef.current = null;
			}
		},
		[bottomSheetRef, backHandlerSubscriptionRef],
	);
	return { handleSheetPositionChange };
};
