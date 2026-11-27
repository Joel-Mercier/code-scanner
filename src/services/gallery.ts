import * as MediaLibrary from "expo-media-library";
import { Platform } from "react-native";

export type GalleryAccess = "granted" | "denied" | "blocked";

/** Asks for the right to add photos, if the platform needs it. */
export const ensureGalleryAccess = async (): Promise<GalleryAccess> => {
	// Android 10+ inserts new images through MediaStore without any runtime
	// permission. Asking anyway is harmful: with write-only access the only
	// permission left to request is ACCESS_MEDIA_LOCATION, which Android
	// refuses silently unless photo read access was already granted.
	if (Platform.OS === "android" && Platform.Version >= 29) return "granted";
	const current = await MediaLibrary.getPermissionsAsync(true, ["photo"]);
	if (current.granted) return "granted";
	if (!current.canAskAgain) return "blocked";
	const requested = await MediaLibrary.requestPermissionsAsync(true, ["photo"]);
	if (requested.granted) return "granted";
	return requested.canAskAgain ? "denied" : "blocked";
};

/**
 * Adds images to the photo gallery. Resolves to the access state; the images
 * are only saved when it is `"granted"`.
 */
export const saveImagesToGallery = async (
	uris: string[],
): Promise<GalleryAccess> => {
	const access = await ensureGalleryAccess();
	if (access !== "granted") return access;
	for (const uri of uris) await MediaLibrary.Asset.create(uri);
	return access;
};
