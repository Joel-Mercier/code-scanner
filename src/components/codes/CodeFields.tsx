import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { DetailRows } from "@/components/ui/List";
import { Pressable } from "@/components/ui/Pressable";
import { Text } from "@/components/ui/Text";
import type { ParsedCode } from "@/domain/codes/payload";
import { format } from "@/lib/date";
import { useTheme } from "@/theme";

const formatDate = (date?: Date) => (date ? format(date, "PPPp") : undefined);

const fieldsFor = (
	parsed: ParsedCode,
	t: (key: string) => string,
): [string, string | undefined][] => {
	switch (parsed.kind) {
		case "wifi":
			return [
				[t("app.fields.ssid"), parsed.ssid],
				[t("app.fields.password"), parsed.password],
				[
					t("app.fields.encryption"),
					t(`app.fields.encryption_${parsed.encryption.toLowerCase()}`),
				],
			];
		case "email":
			return [
				[t("app.fields.email"), parsed.to],
				[t("app.fields.subject"), parsed.subject],
				[t("app.fields.body"), parsed.body],
			];
		case "sms":
			return [
				[t("app.fields.phone"), parsed.number],
				[t("app.fields.message"), parsed.message],
			];
		case "vcard":
			return [
				[
					t("app.fields.name"),
					[parsed.firstName, parsed.lastName].filter(Boolean).join(" "),
				],
				[t("app.fields.organization"), parsed.organization],
				[t("app.fields.job_title"), parsed.title],
				[t("app.fields.phone"), parsed.phone],
				[t("app.fields.email"), parsed.email],
				[t("app.fields.website"), parsed.url],
				[t("app.fields.address"), parsed.address],
			];
		case "event":
			return [
				[t("app.fields.summary"), parsed.summary],
				[t("app.fields.location"), parsed.location],
				[t("app.fields.start"), formatDate(parsed.start)],
				[t("app.fields.end"), formatDate(parsed.end)],
				[t("app.fields.description"), parsed.description],
			];
		case "geoPoint":
			return [
				[t("app.fields.latitude"), String(parsed.lat)],
				[t("app.fields.longitude"), String(parsed.lng)],
				[
					t("app.fields.altitude"),
					parsed.alt !== undefined ? String(parsed.alt) : undefined,
				],
			];
		default:
			return [];
	}
};

function Secret({ value }: { value: string }) {
	const { colors } = useTheme();
	const { t } = useTranslation();
	const [shown, setShown] = useState(false);
	return (
		<View style={styles.secret}>
			<Text
				size={14}
				mono
				selectable={shown}
				numberOfLines={2}
				style={styles.value}
			>
				{shown ? value : "•".repeat(Math.min(value.length, 12))}
			</Text>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={t(
					shown ? "app.fields.hide_password" : "app.fields.show_password",
				)}
				onPress={() => setShown((on) => !on)}
				style={styles.eye}
			>
				<Icon name={shown ? "eyeOff" : "eye"} size={18} color={colors.muted} />
			</Pressable>
		</View>
	);
}

/** The decoded fields of a code, as label/value rows. */
export function CodeFields({
	parsed,
	omit,
	max,
}: {
	parsed: ParsedCode;
	/** A value already shown as the title. */
	omit?: string;
	max?: number;
}) {
	const { t } = useTranslation();
	const secretLabel = t("app.fields.password");
	const rows = fieldsFor(parsed, t)
		.filter((row): row is [string, string] => !!row[1] && row[1] !== omit)
		.slice(0, max);
	if (!rows.length) return null;
	return (
		<DetailRows
			rows={rows.map(([label, value]) => [
				label,
				parsed.kind === "wifi" && label === secretLabel ? (
					<Secret key={label} value={value} />
				) : (
					value
				),
			])}
		/>
	);
}

const styles = StyleSheet.create({
	secret: {
		flexShrink: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		marginRight: -12,
	},
	value: { flexShrink: 1 },
	eye: {
		width: 44,
		height: 44,
		alignItems: "center",
		justifyContent: "center",
	},
});
