import {
	Canvas,
	Group,
	Image,
	Path,
	RoundedRect,
	type SkImage,
	useImage,
} from "@shopify/react-native-skia";
import type { BarcodeType } from "expo-camera";
import { View } from "react-native";
import { Text } from "@/components/ui/Text";
import type { CodeStyle } from "@/stores/library";
import { codeDefaults, useTheme } from "@/theme";
import {
	type BarcodeGeometry,
	buildBarcode,
	bwipIds,
	type GeneratableBarcode,
	isLinearBarcode,
} from "@/utils/barcodeGeometry";
import { buildQR, type QREcc, type QRGeometry } from "@/utils/qrGeometry";
import { inkOf, paperOf } from "./codeColors";

export const canRender = (format: BarcodeType) =>
	format === "qr" || format in bwipIds;

export type CodeGeometry =
	| { type: "qr"; qr: QRGeometry }
	| { type: "barcode"; barcode: BarcodeGeometry; linear: boolean }
	| { type: "error"; message: string };

export const buildGeometry = (
	format: BarcodeType,
	data: string,
	style?: CodeStyle,
	{ ecc, includeText = true }: { ecc?: QREcc; includeText?: boolean } = {},
): CodeGeometry => {
	try {
		if (format === "qr") {
			return {
				type: "qr",
				qr: buildQR(data, {
					ecc: ecc ?? (style?.logo ? "high" : "medium"),
					style: style?.dots ?? "dots",
					logoRatio: style?.logo ? 0.24 : 0,
				}),
			};
		}
		if (format in bwipIds) {
			const type = format as GeneratableBarcode;
			return {
				type: "barcode",
				barcode: buildBarcode(type, data, { includeText }),
				linear: isLinearBarcode(type),
			};
		}
		return { type: "error", message: format };
	} catch (error) {
		return {
			type: "error",
			message: error instanceof Error ? error.message : String(error),
		};
	}
};

/**
 * Fits a code geometry into a `size` wide box. QR codes are square; linear
 * barcodes are `size × size·barHeight` when `barHeight` is set (stretched,
 * like the design's thumbnails), otherwise keep their proportions.
 */
export const layoutGeometry = (
	geometry: CodeGeometry,
	size: number,
	barHeight?: number,
) => {
	if (geometry.type === "qr") {
		const scale = size / geometry.qr.modules;
		return { width: size, height: size, scaleX: scale, scaleY: scale };
	}
	if (geometry.type === "barcode") {
		const { width, height } = geometry.barcode;
		if (barHeight && geometry.linear) {
			return {
				width: size,
				height: size * barHeight,
				scaleX: size / width,
				scaleY: (size * barHeight) / height,
			};
		}
		const scale = Math.min(size / width, (size * 0.9) / height);
		return {
			width: width * scale,
			height: height * scale,
			scaleX: scale,
			scaleY: scale,
		};
	}
	return { width: size, height: size * 0.5, scaleX: 1, scaleY: 1 };
};

type CodeShapesProps = {
	geometry: CodeGeometry;
	size: number;
	barHeight?: number;
	ink: string;
	/** Background behind the code; also used behind the logo. */
	paper?: string;
	logo?: SkImage | null;
};

/** Pure drawing, shared by on-screen canvases and offscreen PNG export. */
export function CodeShapes({
	geometry,
	size,
	barHeight,
	ink,
	paper = codeDefaults.paper,
	logo,
}: CodeShapesProps) {
	const { scaleX, scaleY } = layoutGeometry(geometry, size, barHeight);
	if (geometry.type === "qr") {
		const { modules } = geometry.qr;
		const logoSize = Math.ceil(modules * 0.24) * scaleX;
		const logoOffset = (size - logoSize) / 2;
		return (
			<Group>
				<Group transform={[{ scale: scaleX }]}>
					<Path path={geometry.qr.dots} color={ink} />
					<Path path={geometry.qr.eyes} color={ink} />
				</Group>
				{logo && (
					<Group>
						<RoundedRect
							x={logoOffset}
							y={logoOffset}
							width={logoSize}
							height={logoSize}
							r={logoSize * 0.22}
							color={paper}
						/>
						<Group
							clip={{
								rect: {
									x: logoOffset + logoSize * 0.1,
									y: logoOffset + logoSize * 0.1,
									width: logoSize * 0.8,
									height: logoSize * 0.8,
								},
								rx: logoSize * 0.16,
								ry: logoSize * 0.16,
							}}
						>
							<Image
								image={logo}
								x={logoOffset + logoSize * 0.1}
								y={logoOffset + logoSize * 0.1}
								width={logoSize * 0.8}
								height={logoSize * 0.8}
								fit="cover"
							/>
						</Group>
					</Group>
				)}
			</Group>
		);
	}
	if (geometry.type === "barcode") {
		return (
			<Group transform={[{ scaleX }, { scaleY }]}>
				<Path path={geometry.barcode.bars} color={ink} />
				<Path path={geometry.barcode.text} color={ink} />
			</Group>
		);
	}
	return null;
}

type CodeArtProps = {
	format: BarcodeType;
	data: string;
	style?: CodeStyle;
	ecc?: QREcc;
	size: number;
	/** Thumbnails: linear barcodes as bars only, `size × size·barHeight`. */
	barHeight?: number;
	/** Pre-computed geometry, avoids re-encoding when the caller already has it. */
	geometry?: CodeGeometry;
};

export function CodeArt({
	format,
	data,
	style,
	ecc,
	size,
	barHeight,
	geometry: provided,
}: CodeArtProps) {
	const { colors } = useTheme();
	const geometry =
		provided ??
		buildGeometry(format, data, style, { ecc, includeText: !barHeight });
	const logo = useImage(style?.logo ?? null);
	const { width, height } = layoutGeometry(geometry, size, barHeight);

	if (geometry.type === "error") {
		return (
			<View
				style={{ width: size, height: size * 0.5, justifyContent: "center" }}
			>
				<Text size={12} mono align="center" color={colors.muted}>
					{data}
				</Text>
			</View>
		);
	}

	return (
		<Canvas style={{ width, height }}>
			<CodeShapes
				geometry={geometry}
				size={size}
				barHeight={barHeight}
				ink={inkOf(style)}
				paper={paperOf(style)}
				logo={logo}
			/>
		</Canvas>
	);
}
