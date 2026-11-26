import {
	drawAsImage,
	Group,
	ImageFormat,
	Rect,
	Skia,
} from "@shopify/react-native-skia";
import type { BarcodeType } from "expo-camera";
import { File, Paths } from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { Platform } from "react-native";
import { type CodeStyle, inkOf, paperOf } from "@/domain/codes/style";
import { shareFile } from "@/services/share";
import { buildGeometry, CodeShapes, layoutGeometry } from "./CodeArt";

const EXPORT_SIZE = 1024;
const PADDING = 64;

const loadLogo = async (uri?: string) => {
	if (!uri) return null;
	const data = await Skia.Data.fromURI(uri);
	return Skia.Image.MakeImageFromEncoded(data);
};

/** Renders the code offscreen at high resolution and writes it to a PNG in the cache. */
const renderCodePng = async (
	format: BarcodeType,
	data: string,
	style?: CodeStyle,
) => {
	const geometry = buildGeometry(format, data, style);
	if (geometry.type === "error") throw new Error(geometry.message);
	const { width, height } = layoutGeometry(geometry, EXPORT_SIZE);
	const logo = await loadLogo(style?.logo);
	const canvasWidth = width + PADDING * 2;
	const canvasHeight = height + PADDING * 2;
	const image = await drawAsImage(
		<Group>
			<Rect
				x={0}
				y={0}
				width={canvasWidth}
				height={canvasHeight}
				color={paperOf(style)}
			/>
			<Group transform={[{ translateX: PADDING }, { translateY: PADDING }]}>
				<CodeShapes
					geometry={geometry}
					size={EXPORT_SIZE}
					ink={inkOf(style)}
					paper={paperOf(style)}
					logo={logo}
				/>
			</Group>
		</Group>,
		{ width: canvasWidth, height: canvasHeight },
	);
	if (!image) throw new Error("Could not render code");
	const file = new File(Paths.cache, `code-${Date.now()}.png`);
	await file.write(image.encodeToBytes(ImageFormat.PNG, 100));
	return file.uri;
};

/** Shares a high-resolution PNG of the code. */
export const shareCode = async (
	format: BarcodeType,
	data: string,
	style?: CodeStyle,
) => {
	const uri = await renderCodePng(format, data, style);
	await shareFile(uri, "image/png");
};

type GalleryAccess = "granted" | "denied" | "blocked";

const ensureGalleryAccess = async (): Promise<GalleryAccess> => {
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
 * Renders the code and adds it to the photo gallery. Resolves to the access
 * state; the image is only saved when it is `"granted"`.
 */
export const saveCodeToGallery = async (
	format: BarcodeType,
	data: string,
	style?: CodeStyle,
): Promise<GalleryAccess> => {
	const access = await ensureGalleryAccess();
	if (access !== "granted") return access;
	const uri = await renderCodePng(format, data, style);
	await MediaLibrary.Asset.create(uri);
	return access;
};
