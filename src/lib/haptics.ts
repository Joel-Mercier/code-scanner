import * as Haptics from "expo-haptics";

let enabled = true;

/** Driven by the "Haptics" setting (see `stores/settings`). */
export const setHapticsEnabled = (value: boolean) => {
	enabled = value;
};

export const haptics = {
	tap: () => {
		if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	},
	pop: () => {
		if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
	},
	select: () => {
		if (enabled) Haptics.selectionAsync();
	},
	success: () => {
		if (enabled)
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
	},
	warning: () => {
		if (enabled)
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
	},
};
