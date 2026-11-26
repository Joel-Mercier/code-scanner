import { Alert, Linking } from "react-native";
import { saveCodeToGallery } from "@/components/codes/exportCode";
import { toast } from "@/components/ui/Toast";
import type { CodeItem } from "@/domain/library/types";
import i18n from "@/i18n";
import { attempt } from "@/lib/attempt";

/**
 * Saves a PNG of the code to the photo gallery, and tells the user how it
 * went (with a way to the settings when the permission is blocked).
 */
export const saveToGallery = async (item: CodeItem) => {
	const t = (key: string) => i18n.t(key);
	const result = await attempt(() =>
		saveCodeToGallery(item.format, item.data, item.style),
	);
	if (!result.ok) {
		toast(t("app.common.something_went_wrong"), "warning");
	} else if (result.value === "granted") {
		toast(t("app.code.saved_to_gallery"));
	} else if (result.value === "blocked") {
		Alert.alert(
			t("app.common.permission_needed"),
			t("app.code.gallery_blocked"),
			[
				{ text: t("app.common.cancel"), style: "cancel" },
				{
					text: t("app.common.open_settings"),
					onPress: () => Linking.openSettings(),
				},
			],
		);
	} else {
		toast(t("app.common.permission_needed"), "warning");
	}
};
