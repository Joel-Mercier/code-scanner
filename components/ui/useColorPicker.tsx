import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import ColorPicker, {
	type ColorFormatsObject,
	HueSlider,
	Panel1,
} from "reanimated-color-picker";
import { normalizeHex } from "@/components/codes/codeColors";
import { fonts, radii, useTheme } from "@/theme";
import { haptics } from "@/utils/haptics";
import { Button } from "./Button";
import { Sheet } from "./Sheet";
import { Text } from "./Text";
import { TextField } from "./TextField";

type PickRequest = {
	title: string;
	initial: string;
	onPick: (hex: string) => void;
};

const FALLBACK = "#0e0e10";

/** A sheet with a saturation/brightness panel, a hue slider and a hex field. */
export function useColorPicker() {
	const { colors } = useTheme();
	const { t } = useTranslation();
	const sheet = useRef<BottomSheetModal>(null);
	const [request, setRequest] = useState<PickRequest | null>(null);
	const [color, setColor] = useState(FALLBACK);
	const [hexText, setHexText] = useState(FALLBACK.slice(1).toUpperCase());
	// Remounting the picker is the simplest way to jump it to a typed colour.
	const [pickerKey, setPickerKey] = useState(0);

	const open = (next: PickRequest) => {
		const initial = normalizeHex(next.initial) ?? FALLBACK;
		setRequest(next);
		setColor(initial);
		setHexText(initial.slice(1).toUpperCase());
		setPickerKey((key) => key + 1);
		sheet.current?.present();
	};

	const onPickerChange = ({ hex }: ColorFormatsObject) => {
		const next = hex.slice(0, 7).toLowerCase();
		setColor(next);
		setHexText(next.slice(1).toUpperCase());
	};

	const commitHex = () => {
		const next = normalizeHex(hexText);
		if (!next) {
			setHexText(color.slice(1).toUpperCase());
			return;
		}
		setColor(next);
		setHexText(next.slice(1).toUpperCase());
		setPickerKey((key) => key + 1);
	};

	const confirm = () => {
		haptics.pop();
		request?.onPick(color);
		sheet.current?.dismiss();
	};

	const element = (
		<Sheet
			ref={sheet}
			onDismiss={() => setRequest(null)}
			enableContentPanningGesture={false}
		>
			<Text size={24} weight="semibold" tracking={-0.02}>
				{request?.title}
			</Text>
			<ColorPicker
				key={pickerKey}
				value={color}
				onCompleteJS={onPickerChange}
				thumbShape="circle"
				thumbSize={28}
				sliderThickness={28}
				style={styles.picker}
			>
				<Panel1 style={styles.panel} />
				<HueSlider style={styles.hue} />
			</ColorPicker>
			<View style={styles.row}>
				<View style={[styles.preview, { backgroundColor: color }]} />
				<View style={styles.hexField}>
					<Text size={17} mono color={colors.muted} style={styles.hash}>
						#
					</Text>
					<TextField
						inSheet
						value={hexText}
						onChangeText={(text) =>
							setHexText(text.replace(/[^0-9a-f]/gi, "").slice(0, 6))
						}
						onEndEditing={commitHex}
						onSubmitEditing={commitHex}
						autoCapitalize="characters"
						autoCorrect={false}
						maxLength={6}
						accessibilityLabel={t("app.color.hex")}
						style={styles.hexInput}
					/>
				</View>
			</View>
			<Button icon="check" label={t("app.color.use")} onPress={confirm} />
		</Sheet>
	);

	return { open, element };
}

const styles = StyleSheet.create({
	picker: { gap: 18 },
	panel: { height: 200, borderRadius: radii.lg },
	hue: { borderRadius: radii.pill },
	row: { flexDirection: "row", alignItems: "center", gap: 12 },
	preview: {
		width: 52,
		height: 52,
		borderRadius: radii.md,
		boxShadow: "inset 0px 0px 0px 1px rgba(14,14,16,0.08)",
	},
	hexField: { flex: 1, justifyContent: "center" },
	hash: { position: "absolute", left: 16, zIndex: 1 },
	hexInput: {
		paddingLeft: 32,
		fontFamily: fonts.mono,
		letterSpacing: 1,
	},
});
