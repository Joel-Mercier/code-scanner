import { Alert, Linking } from "react-native";
import i18n from "@/i18n";
import { attempt } from "@/lib/attempt";
import type { GalleryAccess } from "@/services/gallery";
import { toast } from "./Toast";

/**
 * Runs a save to the photo gallery and tells the user how it went: `saved`
 * on success, a way to the settings when the permission is blocked.
 */
export const reportGallerySave = async (
	save: () => Promise<GalleryAccess>,
	saved: string,
) => {
	const t = (key: string) => i18n.t(key);
	const result = await attempt(save);
	if (!result.ok) {
		toast(t("app.common.something_went_wrong"), "warning");
	} else if (result.value === "granted") {
		toast(saved);
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
