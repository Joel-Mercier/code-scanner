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
import { type CodeStyle, inkOf, paperOf } from "@/domain/codes/style";
import { ensureGalleryAccess, type GalleryAccess } from "@/services/gallery";
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
	await MediaLibrary.Asset.create(await renderCodePng(format, data, style));
	return access;
};
