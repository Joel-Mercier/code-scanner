import {
	AlphaType,
	ColorType,
	FilterMode,
	MipmapMode,
	Skia,
} from "@shopify/react-native-skia";
import type { Pixels } from "@/domain/codes/readQR";

/** Longest side read: plenty for a code, and quick to scan on the JS thread. */
const MAX_SIDE = 1600;

/** An image file's RGBA pixels, scaled down; `undefined` if it can't be read. */
export const loadPixels = async (uri: string): Promise<Pixels | undefined> => {
	const image = Skia.Image.MakeImageFromEncoded(await Skia.Data.fromURI(uri));
	if (!image) return undefined;
	const scale = Math.min(1, MAX_SIDE / Math.max(image.width(), image.height()));
	const width = Math.max(1, Math.round(image.width() * scale));
	const height = Math.max(1, Math.round(image.height() * scale));
	const surface = Skia.Surface.Make(width, height);
	if (!surface) return undefined;
	surface
		.getCanvas()
		.drawImageRectOptions(
			image,
			Skia.XYWHRect(0, 0, image.width(), image.height()),
			Skia.XYWHRect(0, 0, width, height),
			FilterMode.Linear,
			MipmapMode.Linear,
		);
	surface.flush();
	const data = surface.makeImageSnapshot().readPixels(0, 0, {
		width,
		height,
		colorType: ColorType.RGBA_8888,
		alphaType: AlphaType.Unpremul,
	});
	return data instanceof Uint8Array ? { width, height, data } : undefined;
};
