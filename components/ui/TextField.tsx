import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { TextInput, type TextInputProps } from "react-native";
import { fonts, makeStyles, useSharedStyles, useTheme } from "@/theme";

type TextFieldProps = TextInputProps & {
	/** Inside a bottom sheet: keeps the sheet above the keyboard. */
	inSheet?: boolean;
	invalid?: boolean;
};

export function TextField({
	inSheet = false,
	invalid = false,
	multiline,
	style,
	...props
}: TextFieldProps) {
	const { colors, scheme } = useTheme();
	const shared = useSharedStyles();
	const styles = useStyles();
	const Input = inSheet ? BottomSheetTextInput : TextInput;
	return (
		<Input
			placeholderTextColor={colors.placeholder}
			keyboardAppearance={scheme}
			selectionColor={colors.accent}
			multiline={multiline}
			{...props}
			style={[
				shared.input,
				styles.text,
				multiline && styles.multiline,
				invalid && styles.invalid,
				style,
			]}
		/>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	text: {
		fontFamily: fonts.regular,
		fontSize: 17,
		color: colors.ink,
	},
	multiline: {
		minHeight: 104,
		paddingTop: 14,
		paddingBottom: 14,
		lineHeight: 24,
		textAlignVertical: "top",
	},
	invalid: { borderColor: colors.danger },
}));
