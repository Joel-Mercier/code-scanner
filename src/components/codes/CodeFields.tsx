import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { DetailRows } from "@/components/ui/List";
import { Pressable } from "@/components/ui/Pressable";
import { Text } from "@/components/ui/Text";
import type { BarcodeInfo } from "@/domain/codes/barcode";
import type { DescribedCode } from "@/domain/codes/describe";
import { formatIban, isValidIban } from "@/domain/codes/iban";
import { isPlaceSearch, type ParsedCode } from "@/domain/codes/payload";
import { format } from "@/lib/date";
import { formatMoney, regionLabel } from "@/lib/region";
import { useTheme } from "@/theme";

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** A label, a value, and whether to mask the value until asked. */
type Row = { label: string; value?: string; secret?: boolean };

const formatDate = (date?: Date) => (date ? format(date, "PPPp") : undefined);
const formatDay = (date?: Date) => (date ? format(date, "PPP") : undefined);

/** `Phone number`, `Phone number 2`… so repeated labels stay distinct. */
const numbered = (label: string, values: string[] = []): Row[] =>
	values.map((value, index) => ({
		label: index === 0 ? label : `${label} ${index + 1}`,
		value,
	}));

const payloadRows = (
	parsed: ParsedCode,
	t: Translate,
	locale: string,
): Row[] => {
	switch (parsed.kind) {
		case "wifi":
			return [
				{ label: t("app.fields.ssid"), value: parsed.ssid },
				{
					label: t("app.fields.password"),
					value: parsed.password,
					secret: true,
				},
				{
					label: t("app.fields.encryption"),
					value: t(`app.fields.encryption_${parsed.encryption.toLowerCase()}`),
				},
				{ label: t("app.fields.eap_method"), value: parsed.eap?.method },
				{ label: t("app.fields.identity"), value: parsed.eap?.identity },
				{
					label: t("app.fields.hidden"),
					value: parsed.hidden ? t("app.common.yes") : undefined,
				},
			];
		case "email":
			return [
				{ label: t("app.fields.email"), value: parsed.to },
				{ label: t("app.fields.subject"), value: parsed.subject },
				{ label: t("app.fields.body"), value: parsed.body },
			];
		case "sms":
			return [
				{ label: t("app.fields.phone"), value: parsed.number },
				{ label: t("app.fields.message"), value: parsed.message },
			];
		case "vcard":
			return [
				{
					label: t("app.fields.name"),
					value: [parsed.firstName, parsed.lastName].filter(Boolean).join(" "),
				},
				{ label: t("app.fields.organization"), value: parsed.organization },
				{ label: t("app.fields.job_title"), value: parsed.title },
				...numbered(t("app.fields.phone"), parsed.phones),
				...numbered(t("app.fields.email"), parsed.emails),
				{ label: t("app.fields.website"), value: parsed.url },
				{ label: t("app.fields.address"), value: parsed.address },
			];
		case "event": {
			const when = parsed.allDay ? formatDay : formatDate;
			return [
				{ label: t("app.fields.summary"), value: parsed.summary },
				{ label: t("app.fields.location"), value: parsed.location },
				{ label: t("app.fields.start"), value: when(parsed.start) },
				{ label: t("app.fields.end"), value: when(parsed.end) },
				{ label: t("app.fields.description"), value: parsed.description },
			];
		}
		case "geoPoint":
			return [
				{ label: t("app.fields.place"), value: parsed.query },
				...(isPlaceSearch(parsed)
					? []
					: [
							{ label: t("app.fields.latitude"), value: String(parsed.lat) },
							{ label: t("app.fields.longitude"), value: String(parsed.lng) },
						]),
				{
					label: t("app.fields.altitude"),
					value: parsed.alt !== undefined ? String(parsed.alt) : undefined,
				},
			];
		case "otp":
			return [
				{ label: t("app.fields.service"), value: parsed.issuer },
				{ label: t("app.fields.account"), value: parsed.account },
				{ label: t("app.fields.secret"), value: parsed.secret, secret: true },
				{
					label: t("app.fields.otp_type"),
					value: t(
						parsed.type === "hotp"
							? "app.fields.otp_hotp"
							: "app.fields.otp_totp",
					),
				},
				{
					label: t("app.fields.digits"),
					value:
						parsed.digits !== undefined ? String(parsed.digits) : undefined,
				},
				{
					label: t("app.fields.period"),
					value:
						parsed.period !== undefined
							? t("app.fields.seconds", { count: parsed.period })
							: undefined,
				},
				{ label: t("app.fields.algorithm"), value: parsed.algorithm },
			];
		case "payment":
			return [
				{ label: t("app.fields.payee"), value: parsed.name },
				{
					label: t("app.fields.iban"),
					value: parsed.iban && formatIban(parsed.iban),
				},
				{
					label: t("app.fields.iban_check"),
					value: parsed.iban
						? t(
								isValidIban(parsed.iban)
									? "app.fields.iban_valid"
									: "app.fields.iban_invalid",
							)
						: undefined,
				},
				{ label: t("app.fields.bic"), value: parsed.bic },
				{
					label: t("app.fields.amount"),
					value:
						parsed.amount !== undefined
							? formatMoney(parsed.amount, parsed.currency, locale)
							: undefined,
				},
				{ label: t("app.fields.reference"), value: parsed.reference },
				{ label: t("app.fields.message"), value: parsed.message },
			];
		case "boardingPass":
			return [
				{ label: t("app.fields.passenger"), value: parsed.passenger },
				{
					label: t("app.fields.flight"),
					value: `${parsed.carrier} ${parsed.flight}`,
				},
				{
					label: t("app.fields.route"),
					value: `${parsed.from} → ${parsed.to}`,
				},
				{ label: t("app.fields.flight_date"), value: formatDay(parsed.date) },
				{ label: t("app.fields.seat"), value: parsed.seat },
				{ label: t("app.fields.booking"), value: parsed.pnr },
				{ label: t("app.fields.sequence"), value: parsed.sequence },
				{
					label: t("app.fields.legs"),
					value: parsed.legs > 1 ? String(parsed.legs) : undefined,
				},
			];
		case "frenchDoc":
			return [
				{
					label: t("app.fields.document_type"),
					value: parsed.documentType,
				},
				{
					label: t("app.fields.issuer"),
					value: `${parsed.authority} · ${parsed.certificate}`,
				},
				{
					label: t("app.fields.country"),
					value: parsed.country && regionLabel(parsed.country, locale),
				},
				{ label: t("app.fields.issued_on"), value: formatDay(parsed.issuedOn) },
				{ label: t("app.fields.signed_on"), value: formatDay(parsed.signedOn) },
				{
					label: t("app.fields.signature"),
					value: t("app.fields.signature_unchecked"),
				},
			];
		case "app":
			return [{ label: t("app.fields.scheme"), value: `${parsed.scheme}:` }];
		default:
			return [];
	}
};

const barcodeRows = (
	info: BarcodeInfo,
	t: Translate,
	locale: string,
): Row[] => {
	const type = (key: string): Row => ({
		label: t("app.fields.type"),
		value: t(`app.barcode.${key}`),
	});
	switch (info.type) {
		case "product":
			return [
				type("product"),
				{ label: t("app.fields.gtin"), value: info.gtin },
				{
					label: t("app.fields.registered_in"),
					value: info.region && regionLabel(info.region, locale),
				},
			];
		case "medicine":
			return [
				type("medicine"),
				{ label: t("app.fields.cip"), value: info.cip },
			];
		case "book":
			return [
				type("book"),
				{ label: t("app.fields.isbn13"), value: info.gtin },
				{ label: t("app.fields.isbn10"), value: info.isbn10 },
			];
		case "music":
			return [type("music"), { label: t("app.fields.ismn"), value: info.ismn }];
		case "periodical":
			return [
				type("periodical"),
				{ label: t("app.fields.issn"), value: info.issn },
			];
		case "store":
		case "coupon":
		case "refund":
			return [
				type(info.type),
				{ label: t("app.fields.gtin"), value: info.gtin },
			];
		case "gs1": {
			const known = new Set(["01", "10", "11", "15", "17", "21", "30", "37"]);
			return [
				type(info.medicine ? "medicine" : "gs1"),
				{ label: t("app.fields.gtin"), value: info.gtin },
				{ label: t("app.fields.expiry"), value: formatDay(info.expiry) },
				{
					label: t("app.fields.best_before"),
					value: formatDay(info.bestBefore),
				},
				{
					label: t("app.fields.produced_on"),
					value: formatDay(info.producedOn),
				},
				{ label: t("app.fields.lot"), value: info.lot },
				{ label: t("app.fields.serial"), value: info.serial },
				{
					label: t("app.fields.net_weight"),
					value:
						info.weightKg !== undefined ? `${info.weightKg} kg` : undefined,
				},
				{
					label: t("app.fields.count"),
					value: info.count !== undefined ? String(info.count) : undefined,
				},
				...info.elements
					.filter(
						(element) => !known.has(element.ai) && !/^310\d$/.test(element.ai),
					)
					.map((element) => ({
						label: `(${element.ai})`,
						value: element.value,
					})),
			];
		}
		case "parcel":
			return [
				type("parcel"),
				{ label: t("app.fields.tracking_number"), value: info.number },
				{
					label: t("app.fields.carrier"),
					value:
						info.carrier === "laposte"
							? "La Poste"
							: info.carrier === "ups"
								? "UPS"
								: t("app.barcode.postal_service"),
				},
				{
					label: t("app.fields.country"),
					value: info.country && regionLabel(info.country, locale),
				},
			];
		case "vin":
			return [
				type("vin"),
				{ label: t("app.fields.vin"), value: info.vin },
				{
					label: t("app.fields.region"),
					value: info.region && t(`app.barcode.regions.${info.region}`),
				},
				{
					label: t("app.fields.country"),
					value: info.country && regionLabel(info.country, locale),
				},
				{
					label: t("app.fields.model_year"),
					value: info.year !== undefined ? String(info.year) : undefined,
				},
			];
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

/** The decoded fields of a code, and what its number means, as label/value rows. */
export function CodeFields({
	code,
	omit,
	max,
}: {
	code: DescribedCode;
	/** A value already shown as the title. */
	omit?: string;
	max?: number;
}) {
	const { t, i18n } = useTranslation();
	const rows = [
		...payloadRows(code.parsed, t, i18n.language),
		...(code.barcode ? barcodeRows(code.barcode, t, i18n.language) : []),
	]
		.filter(
			(row): row is Row & { value: string } =>
				!!row.value && row.value !== omit,
		)
		.slice(0, max);
	if (!rows.length) return null;
	return (
		<DetailRows
			rows={rows.map((row) => [
				row.label,
				row.secret ? <Secret key={row.label} value={row.value} /> : row.value,
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
