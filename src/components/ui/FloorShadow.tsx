import { BlurMask, Canvas, Oval } from "@shopify/react-native-skia";
import { useTheme } from "@/theme";

/** The soft blurred shadow an object casts on the floor. */
export function FloorShadow({
	width = 170,
	height = 16,
}: {
	width?: number;
	height?: number;
}) {
	const { shadows } = useTheme();
	const pad = 24;
	return (
		<Canvas
			pointerEvents="none"
			style={{ width: width + pad * 2, height: height + pad * 2 }}
		>
			<Oval
				x={pad}
				y={pad}
				width={width}
				height={height}
				color={`rgba(0,0,0,${shadows.floor})`}
			>
				<BlurMask blur={9} style="normal" />
			</Oval>
		</Canvas>
	);
}
