import Svg, { Circle, Line, Path, Rect } from "react-native-svg";
import { useTheme } from "@/theme";

type Shape =
	| ["path", { d: string; fill?: "currentColor" }]
	| [
			"rect",
			{ x: number; y: number; width: number; height: number; rx?: number },
	  ]
	| ["circle", { cx: number; cy: number; r: number; fill?: "currentColor" }]
	| ["line", { x1: number; y1: number; x2: number; y2: number }];

/**
 * The design's icons (24×24, round caps and joins), copied from its SVGs.
 * The few actions the design doesn't show use the matching Lucide glyph.
 */
const icons = {
	settings: [
		[
			"path",
			{
				d: "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6",
			},
		],
	],
	torch: [
		[
			"path",
			{
				d: "M18 6c0 2-2 2-2 4v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V10c0-2-2-2-2-4V2h12z",
			},
		],
		["path", { d: "M6 6h12M12 12v.01" }],
	],
	chevronRight: [["path", { d: "m9 18 6-6-6-6" }]],
	chevronDown: [["path", { d: "m6 9 6 6 6-6" }]],
	grid: [
		["rect", { x: 3, y: 3, width: 7, height: 7, rx: 1.5 }],
		["rect", { x: 14, y: 3, width: 7, height: 7, rx: 1.5 }],
		["rect", { x: 3, y: 14, width: 7, height: 7, rx: 1.5 }],
		["rect", { x: 14, y: 14, width: 7, height: 7, rx: 1.5 }],
	],
	imagePlus: [
		["path", { d: "M16 5h6M19 2v6" }],
		[
			"path",
			{ d: "M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5" },
		],
		["path", { d: "m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" }],
		["circle", { cx: 9, cy: 9, r: 2 }],
	],
	plus: [["path", { d: "M12 5v14M5 12h14" }]],
	close: [["path", { d: "M18 6 6 18M6 6l12 12" }]],
	back: [["path", { d: "m12 19-7-7 7-7M19 12H5" }]],
	more: [
		["circle", { cx: 12, cy: 5, r: 1.2 }],
		["circle", { cx: 12, cy: 12, r: 1.2 }],
		["circle", { cx: 12, cy: 19, r: 1.2 }],
	],
	search: [
		["circle", { cx: 11, cy: 11, r: 7 }],
		["path", { d: "m20 20-3.5-3.5" }],
	],
	scan: [
		[
			"path",
			{
				d: "M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10",
			},
		],
	],
	eye: [
		["path", { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" }],
		["circle", { cx: 12, cy: 12, r: 3 }],
	],
	eyeOff: [
		[
			"path",
			{
				d: "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",
			},
		],
		["path", { d: "M14.084 14.158a3 3 0 0 1-4.242-4.242" }],
		[
			"path",
			{
				d: "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",
			},
		],
		["path", { d: "m2 2 20 20" }],
	],
	copy: [
		["rect", { x: 8, y: 8, width: 14, height: 14, rx: 2 }],
		["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }],
	],
	share: [
		["circle", { cx: 18, cy: 5, r: 3 }],
		["circle", { cx: 6, cy: 12, r: 3 }],
		["circle", { cx: 18, cy: 19, r: 3 }],
		["path", { d: "m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" }],
	],
	file: [
		[
			"path",
			{ d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" },
		],
		["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
	],
	document: [
		[
			"path",
			{ d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" },
		],
		["path", { d: "M14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8M10 9H8" }],
	],
	download: [
		[
			"path",
			{ d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" },
		],
	],
	pencil: [["path", { d: "M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" }]],
	folderPlus: [
		["path", { d: "M12 10v6M9 13h6" }],
		[
			"path",
			{
				d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
			},
		],
	],
	folderInput: [
		[
			"path",
			{
				d: "M2 9V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1",
			},
		],
		["path", { d: "M2 13h10M9 16l3-3-3-3" }],
	],
	externalLink: [
		[
			"path",
			{
				d: "M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
			},
		],
	],
	image: [
		["rect", { x: 3, y: 3, width: 18, height: 18, rx: 2 }],
		["circle", { cx: 9, cy: 9, r: 2 }],
		["path", { d: "m21 15-3-3-9 9" }],
	],
	trash: [
		[
			"path",
			{
				d: "M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",
			},
		],
	],
	check: [["path", { d: "M20 6 9 17l-5-5" }]],
	qr: [
		["rect", { x: 3, y: 3, width: 6, height: 6, rx: 1 }],
		["rect", { x: 15, y: 3, width: 6, height: 6, rx: 1 }],
		["rect", { x: 3, y: 15, width: 6, height: 6, rx: 1 }],
		[
			"path",
			{ d: "M15 15h2v2M21 15v.01M15 21h6v-3M12 3v6M12 12H3M12 12v9M12 12h3" },
		],
	],
	barcode: [["path", { d: "M3 5v14M7 5v14M10 5v14M14 5v14M17 5v14M21 5v14" }]],
	link: [
		[
			"path",
			{ d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" },
		],
		[
			"path",
			{ d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" },
		],
	],
	text: [["path", { d: "M4 7V4h16v3M9 20h6M12 4v16" }]],
	wifi: [
		[
			"path",
			{
				d: "M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01",
			},
		],
	],
	email: [
		["circle", { cx: 12, cy: 12, r: 4 }],
		["path", { d: "M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" }],
	],
	phone: [
		[
			"path",
			{
				d: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z",
			},
		],
	],
	sms: [
		[
			"path",
			{ d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
		],
	],
	contact: [
		["rect", { x: 3, y: 4, width: 18, height: 16, rx: 2 }],
		["circle", { cx: 9, cy: 11, r: 2.5 }],
		["path", { d: "M5.5 17a3.5 3.5 0 0 1 7 0M15 10h3M15 14h3" }],
	],
	calendar: [
		["rect", { x: 3, y: 4, width: 18, height: 18, rx: 2 }],
		["path", { d: "M16 2v4M8 2v4M3 10h18" }],
	],
	location: [
		["path", { d: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" }],
		["circle", { cx: 12, cy: 10, r: 3 }],
	],
	vibrate: [
		["path", { d: "m2 8 2 2-2 2 2 2-2 2M22 8l-2 2 2 2-2 2 2 2" }],
		["rect", { x: 8, y: 5, width: 8, height: 14, rx: 1 }],
	],
	help: [
		["circle", { cx: 12, cy: 12, r: 10 }],
		["path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" }],
	],
	shield: [
		[
			"path",
			{
				d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
			},
		],
	],
	// Folder icons.
	folder: [
		[
			"path",
			{
				d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
			},
		],
	],
	star: [
		[
			"path",
			{
				d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
			},
		],
	],
	receipt: [
		[
			"path",
			{
				d: "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z",
			},
		],
		["path", { d: "M16 8H8M16 12H8M13 16H8" }],
	],
	home: [
		["path", { d: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }],
		["path", { d: "M9 22V12h6v10" }],
	],
	briefcase: [
		["rect", { x: 2, y: 7, width: 20, height: 14, rx: 2 }],
		["path", { d: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" }],
	],
	ticket: [
		[
			"path",
			{
				d: "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z",
			},
		],
		["path", { d: "M13 5v2M13 17v2M13 11v2" }],
	],
	food: [
		[
			"path",
			{
				d: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7",
			},
		],
	],
	plane: [
		[
			"path",
			{
				d: "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z",
			},
		],
	],
	gift: [
		["rect", { x: 3, y: 8, width: 18, height: 4, rx: 1 }],
		[
			"path",
			{
				d: "M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5",
			},
		],
	],
	book: [
		[
			"path",
			{ d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" },
		],
	],
	card: [
		["rect", { x: 2, y: 5, width: 20, height: 14, rx: 2 }],
		["path", { d: "M2 10h20" }],
	],
	heart: [
		[
			"path",
			{
				d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",
			},
		],
	],
	// Actions the design doesn't show (Lucide).
	sun: [
		["circle", { cx: 12, cy: 12, r: 4 }],
		[
			"path",
			{
				d: "M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41",
			},
		],
	],
	moon: [["path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" }]],
	cube: [
		[
			"path",
			{
				d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",
			},
		],
		["path", { d: "m3.3 7 8.7 5 8.7-5M12 22V12" }],
	],
	device: [
		["rect", { x: 5, y: 2, width: 14, height: 20, rx: 2 }],
		["path", { d: "M12 18h.01" }],
	],
	key: [
		[
			"path",
			{
				d: "M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z",
			},
		],
		["circle", { cx: 16.5, cy: 7.5, r: 0.5, fill: "currentColor" }],
	],
	mail: [
		["path", { d: "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" }],
		["rect", { x: 2, y: 4, width: 20, height: 16, rx: 2 }],
	],
	userPlus: [
		["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }],
		["circle", { cx: 9, cy: 7, r: 4 }],
		["line", { x1: 19, y1: 8, x2: 19, y2: 14 }],
		["line", { x1: 22, y1: 11, x2: 16, y2: 11 }],
	],
	calendarPlus: [
		["path", { d: "M16 18h6M16 2v3M19 15v6M3 9h18M8 2v3" }],
		[
			"path",
			{ d: "M21 11.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8.3" },
		],
	],
	calendarClock: [
		["path", { d: "M16 14v2.2l1.6 1M16 2v3M3 9h5.859M8 2v3" }],
		[
			"path",
			{ d: "M21 7.338V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2.338" },
		],
		["circle", { cx: 16, cy: 16, r: 6 }],
	],
	camera: [
		[
			"path",
			{
				d: "M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z",
			},
		],
		["circle", { cx: 12, cy: 13, r: 3 }],
	],
	alert: [
		[
			"path",
			{
				d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z",
			},
		],
		["path", { d: "M12 9v4M12 17h.01" }],
	],
	palette: [
		[
			"path",
			{
				d: "M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z",
			},
		],
		["circle", { cx: 13.5, cy: 6.5, r: 0.5, fill: "currentColor" }],
		["circle", { cx: 17.5, cy: 10.5, r: 0.5, fill: "currentColor" }],
		["circle", { cx: 6.5, cy: 12.5, r: 0.5, fill: "currentColor" }],
		["circle", { cx: 8.5, cy: 7.5, r: 0.5, fill: "currentColor" }],
	],
	lock: [
		["rect", { x: 3, y: 11, width: 18, height: 11, rx: 2 }],
		["path", { d: "M7 11V7a5 5 0 0 1 10 0v4" }],
	],
	banknote: [
		["rect", { x: 2, y: 6, width: 20, height: 12, rx: 2 }],
		["circle", { cx: 12, cy: 12, r: 2 }],
		["path", { d: "M6 12h.01M18 12h.01" }],
	],
	smartphone: [
		["rect", { x: 5, y: 2, width: 14, height: 20, rx: 2 }],
		["path", { d: "M12 18h.01" }],
	],
	globe: [
		["circle", { cx: 12, cy: 12, r: 10 }],
		["path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" }],
	],
	navigation: [["path", { d: "M3 11 22 2l-9 19-2-8-8-2z" }]],
	package: [
		[
			"path",
			{
				d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z",
			},
		],
		["path", { d: "M12 22V12" }],
		["path", { d: "m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" }],
		["path", { d: "m7.5 4.27 9 5.15" }],
	],
	tag: [
		[
			"path",
			{
				d: "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z",
			},
		],
		["circle", { cx: 7.5, cy: 7.5, r: 0.5, fill: "currentColor" }],
	],
	car: [
		[
			"path",
			{
				d: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2",
			},
		],
		["circle", { cx: 7, cy: 17, r: 2 }],
		["path", { d: "M9 17h6" }],
		["circle", { cx: 17, cy: 17, r: 2 }],
	],
	pill: [
		[
			"path",
			{ d: "m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" },
		],
		["path", { d: "m8.5 8.5 7 7" }],
	],
} satisfies Record<string, Shape[]>;

export type IconName = keyof typeof icons;

type IconProps = {
	name: IconName;
	size?: number;
	color?: string;
	strokeWidth?: number;
};

export function Icon({
	name,
	size = 20,
	color: requested,
	strokeWidth = 1.75,
}: IconProps) {
	const { colors } = useTheme();
	const color = requested ?? colors.ink;
	return (
		<Svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke={color}
			strokeWidth={strokeWidth}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			{(icons[name] as Shape[]).map(([type, props], index) => {
				const key = `${type}${index}`;
				const fill = "fill" in props && props.fill ? color : undefined;
				switch (type) {
					case "path":
						return <Path key={key} d={props.d} fill={fill} />;
					case "rect":
						return <Rect key={key} {...props} />;
					case "circle":
						return (
							<Circle
								key={key}
								cx={props.cx}
								cy={props.cy}
								r={props.r}
								fill={fill}
							/>
						);
					case "line":
						return <Line key={key} {...props} />;
					default:
						return null;
				}
			})}
		</Svg>
	);
}
