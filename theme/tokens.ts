/** Light: the design's warm off-white. Dark: anthracite with light text. */
export const palettes = {
	light: {
		/** Screen background. */
		canvas: "#F6F6F4",
		/** Cards, inputs, buttons. */
		surface: "#FFFFFF",
		/** Segmented controls, docs backdrop. */
		sunken: "#EAEAE6",
		/** Icon tiles, inner segmented controls. */
		tile: "#F1F1EE",
		/** Raw content and error details. */
		well: "#EDEDE9",
		ink: "#0E0E10",
		muted: "#66666D",
		body: "#4A4A50",
		placeholder: "#8A8A90",
		faint: "#A3A39D",
		border: "#E2E2DE",
		borderSoft: "#E8E8E4",
		divider: "#EFEFEB",
		dashed: "#CFCFCA",
		dashedStrong: "#BDBDB7",
		/** Sheets of paper in document illustrations. */
		paper: "#FFFFFF",
		paperLine: "#DADAD6",
		paperEdge: "#E4E4DF",
		/** The thickness of 3D objects. */
		layer: "#D6D6D1",
		faceEdge: "#ECECE8",
		/** Printed codes always sit on white, in both themes. */
		object: "#FFFFFF",
		objectEdge: "#ECECE8",
		accent: "#2A44FF",
		accentSoft: "#E9ECFF",
		onAccent: "#FFFFFF",
		danger: "#C4281C",
		dangerSoft: "#FCE8EC",
		scrim: "rgba(14,14,16,0.38)",
		/** Camera feed backdrop, before the camera shows up. */
		feed: "#2A2B2D",
		white: "#FFFFFF",
		/** Text on white glass buttons over the camera. */
		glassInk: "#0E0E10",
	},
	dark: {
		canvas: "#1C1D1F",
		surface: "#26272A",
		sunken: "#141517",
		tile: "#313236",
		well: "#232427",
		ink: "#F1F1EE",
		muted: "#9C9CA3",
		body: "#C6C6CB",
		placeholder: "#6F6F77",
		faint: "#6A6A70",
		border: "#3A3B3F",
		borderSoft: "#323337",
		divider: "#2F3034",
		dashed: "#4A4B50",
		dashedStrong: "#5C5D62",
		paper: "#4A4C52",
		paperLine: "#6B6D74",
		paperEdge: "#3D3F44",
		layer: "#3F4044",
		faceEdge: "#3A3B3F",
		object: "#FFFFFF",
		objectEdge: "#ECECE8",
		accent: "#5469FF",
		accentSoft: "#262C55",
		onAccent: "#FFFFFF",
		danger: "#FF6B5E",
		dangerSoft: "#3A2226",
		scrim: "rgba(0,0,0,0.55)",
		feed: "#2A2B2D",
		white: "#FFFFFF",
		glassInk: "#0E0E10",
	},
} as const;

export type Scheme = keyof typeof palettes;
export type Palette = { [K in keyof (typeof palettes)["light"]]: string };

export const shadowSets = {
	light: {
		/** Floating cards and code tiles. */
		card: "0px 1px 1px rgba(14,14,16,0.04), 0px 10px 24px rgba(14,14,16,0.08)",
		/** Small chips (kind tiles, icon picker). */
		chip: "0px 1px 1px rgba(14,14,16,0.05), 0px 3px 8px rgba(14,14,16,0.06)",
		/** The sliding pill of segmented controls. */
		pill: "0px 1px 2px rgba(14,14,16,0.08), 0px 4px 10px rgba(14,14,16,0.06)",
		/** A lifted page or preview. */
		raised:
			"0px 1px 1px rgba(14,14,16,0.05), 0px 18px 36px rgba(14,14,16,0.14)",
		sheet: "0px -10px 40px rgba(14,14,16,0.12)",
		knob: "0px 1px 3px rgba(14,14,16,0.25)",
		/** Opacity of the blurred floor shadow under objects. */
		floor: 0.18,
	},
	dark: {
		card: "0px 1px 1px rgba(0,0,0,0.25), 0px 10px 24px rgba(0,0,0,0.35)",
		chip: "0px 1px 1px rgba(0,0,0,0.3), 0px 3px 8px rgba(0,0,0,0.3)",
		pill: "0px 1px 2px rgba(0,0,0,0.4), 0px 4px 10px rgba(0,0,0,0.3)",
		raised: "0px 1px 1px rgba(0,0,0,0.3), 0px 18px 36px rgba(0,0,0,0.5)",
		sheet: "0px -10px 40px rgba(0,0,0,0.5)",
		knob: "0px 1px 3px rgba(0,0,0,0.45)",
		floor: 0.45,
	},
} as const;

export type Shadows = {
	[K in keyof (typeof shadowSets)["light"]]: (typeof shadowSets)["light"][K] extends number
		? number
		: string;
};

/** Folder colours: a tint for backgrounds and an ink for icons. */
export const folderPalettes = {
	light: {
		blue: { tint: "#E9ECFF", ink: "#2A44FF" },
		green: { tint: "#E3F4EA", ink: "#18794E" },
		amber: { tint: "#FFF1D6", ink: "#8A5200" },
		rose: { tint: "#FCE8EC", ink: "#B4234A" },
		violet: { tint: "#EFE8FB", ink: "#6B3FC4" },
		graphite: { tint: "#ECECE8", ink: "#0E0E10" },
	},
	dark: {
		blue: { tint: "#232A55", ink: "#8C9BFF" },
		green: { tint: "#1D3328", ink: "#5FC48E" },
		amber: { tint: "#3A2D16", ink: "#F0B45A" },
		rose: { tint: "#3D2128", ink: "#F07A98" },
		violet: { tint: "#2E2445", ink: "#B08CF2" },
		graphite: { tint: "#2F3033", ink: "#E6E6E3" },
	},
} as const;

export type FolderColor = keyof (typeof folderPalettes)["light"];
export type FolderColors = Record<FolderColor, { tint: string; ink: string }>;

export const folderColorKeys = Object.keys(
	folderPalettes.light,
) as FolderColor[];

export const fonts = {
	regular: "Geist_400Regular",
	medium: "Geist_500Medium",
	semibold: "Geist_600SemiBold",
	mono: "GeistMono_400Regular",
	monoMedium: "GeistMono_500Medium",
} as const;

export const radii = {
	tile: 11,
	sm: 14,
	md: 16,
	lg: 18,
	xl: 22,
	object: 32,
	sheet: 28,
	pill: 999,
} as const;

/** Ink colours for created codes: dark enough on light papers for scanners. */
export const codeInks = {
	ink: "#0E0E10",
	blue: "#2A44FF",
	teal: "#0F766E",
	plum: "#7E2E84",
	rust: "#B4471C",
	slate: "#3F4A5A",
} as const;

export type CodeInk = keyof typeof codeInks;

/** Every `codeInks` colour keeps at least 4:1 contrast on these. */
export const codePapers = {
	white: "#FFFFFF",
	stone: "#F1F1EE",
	butter: "#FFF6DB",
	mint: "#E8F5EE",
	sky: "#E9ECFF",
	blush: "#FCE8EC",
} as const;

export type CodePaper = keyof typeof codePapers;

/** Codes are printed objects: dark ink on light paper, whatever the theme. */
export const codeDefaults = { ink: codeInks.ink, paper: codePapers.white };
