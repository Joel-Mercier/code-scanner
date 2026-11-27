import { saveCodeToGallery } from "@/components/codes/exportCode";
import { reportGallerySave } from "@/components/ui/galleryFeedback";
import type { CodeItem } from "@/domain/library/types";
import i18n from "@/i18n";

/**
 * Saves a PNG of the code to the photo gallery, and tells the user how it
 * went (with a way to the settings when the permission is blocked).
 */
export const saveToGallery = (item: CodeItem) =>
	reportGallerySave(
		() => saveCodeToGallery(item.format, item.data, item.style),
		i18n.t("app.code.saved_to_gallery"),
	);
