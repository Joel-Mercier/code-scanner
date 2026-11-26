import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Eyebrow, Text } from "@/components/ui/Text";
import { TextField } from "@/components/ui/TextField";
import type { GeneratableBarcode } from "@/domain/codes/formats";
import { makeStyles, useTheme } from "@/theme";
import { numericBarcodes } from "../barcodeOptions";

/** A barcode's content, with the format's rules or the current error below. */
export function BarcodeContentField({
	type,
	value,
	onChange,
	onBlur,
	error,
}: {
	type: GeneratableBarcode;
	value: string;
	onChange: (value: string) => void;
	onBlur: () => void;
	/** Shown instead of the format's help (once the field was touched). */
	error?: string | null;
}) {
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	return (
		<View style={styles.field}>
			<Eyebrow>{t("app.fields.content")}</Eyebrow>
			<TextField
				value={value}
				onChangeText={onChange}
				onBlur={onBlur}
				keyboardType={numericBarcodes.includes(type) ? "number-pad" : "default"}
				autoCapitalize={type === "code39" ? "characters" : "none"}
				autoCorrect={false}
				placeholder={t("app.placeholders.content")}
				invalid={!!error}
			/>
			<Text size={13} color={error ? colors.danger : colors.muted}>
				{error || t(`app.barcode_help.${type}`)}
			</Text>
		</View>
	);
}

const useStyles = makeStyles(() => ({
	field: { gap: 10 },
}));
