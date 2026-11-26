import * as Haptics from "expo-haptics";
import useApp from "@/stores/appStore";

const enabled = () => useApp.getState().haptics;

export const haptics = {
	tap: () => {
		if (enabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	},
	pop: () => {
		if (enabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
	},
	select: () => {
		if (enabled()) Haptics.selectionAsync();
	},
	success: () => {
		if (enabled())
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
	},
	warning: () => {
		if (enabled())
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
	},
};
