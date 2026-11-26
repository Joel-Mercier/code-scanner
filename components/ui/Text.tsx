import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { fonts, useTheme } from "@/theme";

type Weight = "regular" | "medium" | "semibold";

export type TextProps = RNTextProps & {
	size?: number;
	weight?: Weight;
	/** Geist Mono (catalogue numbers, eyebrows, counters). */
	mono?: boolean;
	color?: string;
	/** Letter spacing in em, like the design's `letter-spacing`. */
	tracking?: number;
	/** Line height as a multiple of the font size. */
	leading?: number;
	align?: "left" | "center" | "right";
};

const familyOf = (weight: Weight, mono: boolean) => {
	if (mono) return weight === "regular" ? fonts.mono : fonts.monoMedium;
	return weight === "regular"
		? fonts.regular
		: weight === "medium"
			? fonts.medium
			: fonts.semibold;
};

export function Text({
	size = 15,
	weight = "regular",
	mono = false,
	color,
	tracking,
	leading,
	align,
	style,
	...props
}: TextProps) {
	const { colors } = useTheme();
	return (
		<RNText
			{...props}
			style={[
				{
					fontFamily: familyOf(weight, mono),
					fontSize: size,
					color: color ?? colors.ink,
					letterSpacing: tracking ? tracking * size : undefined,
					lineHeight: leading ? leading * size : undefined,
					textAlign: align,
				},
				style,
			]}
		/>
	);
}

/** Big screen titles ("Collection", "Create", "Settings"). */
export function LargeTitle({ children, ...props }: TextProps) {
	return (
		<Text size={36} weight="semibold" tracking={-0.03} {...props}>
			{children}
		</Text>
	);
}

/** The small uppercase mono labels ("NAME", "COLOR", "RAW CONTENT"). */
export function Eyebrow({ children, ...props }: TextProps) {
	const { colors } = useTheme();
	return (
		<Text size={11} mono color={colors.muted} tracking={0.08} {...props}>
			{typeof children === "string" ? children.toUpperCase() : children}
		</Text>
	);
}
