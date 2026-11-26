import RNDateTimePicker, {
	DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";
import Animated from "react-native-reanimated";
import { Icon } from "@/components/ui/Icon";
import { Pressable } from "@/components/ui/Pressable";
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import { Eyebrow, Text } from "@/components/ui/Text";
import { TextField } from "@/components/ui/TextField";
import { makeStyles, useSharedStyles, useTheme } from "@/theme";
import { enter } from "@/theme/motion";
import { format } from "@/utils/date";
import type { FieldDef, FieldValue, FormState } from "./qrForms";

type FormFieldsProps = {
	fields: FieldDef[];
	state: FormState;
	errors: Record<string, string>;
	showErrors: Record<string, boolean>;
	onChange: (name: string, value: FieldValue) => void;
	onBlur: (name: string) => void;
	/** Shows "12 / 2000" under multiline fields. */
	maxLength?: number;
};

export function FormFields({
	fields,
	state,
	errors,
	showErrors,
	onChange,
	onBlur,
	maxLength,
}: FormFieldsProps) {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	return (
		<View style={styles.container}>
			{fields.map((field) => {
				const label = t(`app.fields.${field.label}`);
				const error = showErrors[field.name] ? errors[field.name] : undefined;
				if (field.type === "switch") {
					return (
						<View key={field.name} style={styles.switchRow}>
							<Text size={16} style={shared.flex}>
								{label}
							</Text>
							<Switch
								value={!!state[field.name]}
								onChange={(value) => onChange(field.name, value)}
								accessibilityLabel={label}
							/>
						</View>
					);
				}
				const text = (state[field.name] as string | undefined) ?? "";
				return (
					<View key={field.name} style={styles.field}>
						<Eyebrow>{label}</Eyebrow>
						{field.type === "text" && (
							<TextField
								value={text}
								onChangeText={(value) => onChange(field.name, value)}
								onBlur={() => onBlur(field.name)}
								placeholder={
									field.placeholder ?? t(`app.placeholders.${field.label}`)
								}
								keyboardType={field.keyboard}
								autoCapitalize={field.autoCapitalize ?? "sentences"}
								autoCorrect={false}
								secureTextEntry={field.secure}
								multiline={field.multiline}
								maxLength={field.multiline ? maxLength : undefined}
								invalid={!!error}
								accessibilityLabel={label}
							/>
						)}
						{field.type === "encryption" && (
							<Segmented
								value={(state[field.name] as string) ?? "WPA"}
								onChange={(value) => onChange(field.name, value)}
								accessibilityLabel={label}
								options={[
									{ value: "WPA", label: t("app.fields.encryption_wpa") },
									{ value: "WEP", label: t("app.fields.encryption_wep") },
									{ value: "nopass", label: t("app.fields.encryption_nopass") },
								]}
							/>
						)}
						{field.type === "datetime" && (
							<DateTimeField
								value={state[field.name] as Date | undefined}
								onChange={(value) => onChange(field.name, value)}
							/>
						)}
						{field.type === "text" && field.multiline && maxLength && (
							<Text size={11} mono color={colors.muted} style={styles.count}>
								{text.length} / {maxLength}
							</Text>
						)}
						{error && (
							<Animated.View entering={enter.fade()}>
								<Text size={13} color={colors.danger}>
									{error}
								</Text>
							</Animated.View>
						)}
					</View>
				);
			})}
		</View>
	);
}

function DateTimeField({
	value,
	onChange,
}: {
	value?: Date;
	onChange: (value: Date | undefined) => void;
}) {
	const { colors } = useTheme();
	const shared = useSharedStyles();
	const styles = useStyles();
	const { t } = useTranslation();
	if (Platform.OS === "ios") {
		return (
			<View style={styles.iosPicker}>
				<RNDateTimePicker
					value={value ?? new Date()}
					mode="datetime"
					display="compact"
					accentColor={colors.accent}
					onValueChange={(_, date) => onChange(date)}
				/>
			</View>
		);
	}
	const pick = () => {
		const initial = value ?? new Date();
		DateTimePickerAndroid.open({
			value: initial,
			mode: "date",
			onValueChange: (_, date) => {
				DateTimePickerAndroid.open({
					value: date,
					mode: "time",
					is24Hour: true,
					onValueChange: (__, time) => onChange(time),
				});
			},
		});
	};
	return (
		<Pressable
			accessibilityRole="button"
			onPress={pick}
			style={[shared.input, styles.date]}
		>
			<Icon name="calendarClock" size={20} color={colors.muted} />
			<Text size={17} color={value ? colors.ink : colors.placeholder}>
				{value ? format(value, "PPp") : t("app.placeholders.start")}
			</Text>
		</Pressable>
	);
}

const useStyles = makeStyles(() => ({
	container: { gap: 18 },
	field: { gap: 8 },
	switchRow: {
		minHeight: 52,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	count: { alignSelf: "flex-end" },
	date: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	iosPicker: { alignItems: "flex-start" },
}));
