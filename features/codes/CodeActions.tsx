import * as Calendar from "expo-calendar";
import * as Clipboard from "expo-clipboard";
import * as Contacts from "expo-contacts";
import { openBrowserAsync } from "expo-web-browser";
import { useTranslation } from "react-i18next";
import { Linking, Platform, Share, View } from "react-native";
import { Button, ButtonGrid, gridCell } from "@/components/ui/Button";
import type { IconName } from "@/components/ui/Icon";
import { toast } from "@/components/ui/Toast";
import type { ParsedCode } from "@/utils/codePayload";
import { haptics } from "@/utils/haptics";
import type { DescribedCode } from "./kinds";

export type Action = {
	key: string;
	label: string;
	icon: IconName;
	run: () => Promise<void> | void;
};

const getWritableCalendar = async () => {
	if (Platform.OS === "ios") return Calendar.getDefaultCalendarSync();
	const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
	const writable = calendars.filter((calendar) => calendar.allowsModifications);
	return writable.find((calendar) => calendar.isPrimary) ?? writable[0];
};

const mailtoFor = (parsed: Extract<ParsedCode, { kind: "email" }>) => {
	const params = [
		parsed.subject && `subject=${encodeURIComponent(parsed.subject)}`,
		parsed.body && `body=${encodeURIComponent(parsed.body)}`,
	].filter(Boolean);
	return `mailto:${parsed.to}${params.length ? `?${params.join("&")}` : ""}`;
};

export function useCodeActions(code: DescribedCode, data: string): Action[] {
	const { t } = useTranslation();
	const { parsed } = code;

	const copy =
		(value: string, message = t("app.common.copied")) =>
		async () => {
			await Clipboard.setStringAsync(value);
			haptics.success();
			toast(message);
		};

	const primary: Action[] = [];
	switch (parsed.kind) {
		case "url":
			primary.push({
				key: "open",
				label: t("app.actions.open_link"),
				icon: "externalLink",
				run: () => openBrowserAsync(parsed.url).then(() => undefined),
			});
			break;
		case "email":
			primary.push({
				key: "email",
				label: t("app.actions.send_email"),
				icon: "mail",
				run: () => Linking.openURL(mailtoFor(parsed)),
			});
			break;
		case "phone":
			primary.push({
				key: "call",
				label: t("app.actions.call"),
				icon: "phone",
				run: () => Linking.openURL(`tel:${parsed.number}`),
			});
			break;
		case "sms":
			primary.push({
				key: "sms",
				label: t("app.actions.send_sms"),
				icon: "sms",
				run: () =>
					Linking.openURL(
						`sms:${parsed.number}${parsed.message ? `${Platform.OS === "ios" ? "&" : "?"}body=${encodeURIComponent(parsed.message)}` : ""}`,
					),
			});
			break;
		case "wifi":
			if (parsed.password) {
				primary.push({
					key: "password",
					label: t("app.actions.copy_password"),
					icon: "key",
					run: copy(parsed.password, t("app.actions.password_copied")),
				});
			}
			break;
		case "vcard":
			primary.push({
				key: "contact",
				label: t("app.actions.add_contact"),
				icon: "userPlus",
				run: async () => {
					await Contacts.Contact.presentCreateForm({
						givenName: parsed.firstName,
						familyName: parsed.lastName,
						company: parsed.organization,
						jobTitle: parsed.title,
						emails: parsed.email
							? [{ address: parsed.email, label: "work" }]
							: [],
						phones: parsed.phone
							? [{ number: parsed.phone, label: "mobile" }]
							: [],
						urlAddresses: parsed.url
							? [{ url: parsed.url, label: "homepage" }]
							: [],
						addresses: parsed.address
							? [{ street: parsed.address, label: "home" }]
							: [],
					});
				},
			});
			break;
		case "event":
			primary.push({
				key: "event",
				label: t("app.actions.add_event"),
				icon: "calendarPlus",
				run: async () => {
					const { status } = await Calendar.requestCalendarPermissions();
					if (status !== "granted") return;
					const calendar = await getWritableCalendar();
					if (!calendar) return;
					await calendar.addEventWithForm({
						title: parsed.summary,
						notes: parsed.description,
						location: parsed.location,
						startDate: parsed.start,
						endDate: parsed.end,
					});
				},
			});
			break;
		case "geoPoint":
			primary.push({
				key: "map",
				label: t("app.actions.open_map"),
				icon: "location",
				run: () =>
					Linking.openURL(
						Platform.OS === "ios"
							? `maps://?ll=${parsed.lat},${parsed.lng}`
							: `geo:${parsed.lat},${parsed.lng}?q=${parsed.lat},${parsed.lng}`,
					),
			});
			break;
		default:
			if (code.kind === "barcode") {
				primary.push({
					key: "search",
					label: t("app.actions.search_web"),
					icon: "search",
					run: () =>
						openBrowserAsync(
							`https://duckduckgo.com/?q=${encodeURIComponent(data)}`,
						).then(() => undefined),
				});
			}
	}

	return [
		...primary,
		{
			key: "copy",
			label: t("app.actions.copy"),
			icon: "copy",
			run: copy(
				parsed.kind === "url"
					? parsed.url
					: parsed.kind === "text"
						? parsed.text
						: data,
			),
		},
		{
			key: "share",
			label: t("app.actions.share_content"),
			icon: "share",
			run: () => Share.share({ message: data }).then(() => undefined),
		},
	];
}

/**
 * The first action as the big blue button, the rest (and `extra`) as a grid
 * of white buttons, two per row, then `wide` across the full width.
 */
export function CodeActions({
	code,
	data,
	extra = [],
	wide,
	onShare,
}: {
	code: DescribedCode;
	data: string;
	extra?: Action[];
	wide?: Action;
	/** Replaces sharing the content as text (e.g. to offer text or image). */
	onShare?: () => void;
}) {
	const actions = useCodeActions(code, data).map((action) =>
		action.key === "share" && onShare ? { ...action, run: onShare } : action,
	);
	const [first, ...rest] = [...actions, ...extra];
	return (
		<View style={{ gap: 10 }}>
			<Button
				icon={first.icon}
				label={first.label}
				onPress={() => first.run()}
			/>
			<ButtonGrid>
				{rest.map((action) => (
					<Button
						key={action.key}
						variant="secondary"
						icon={action.icon}
						label={action.label}
						onPress={() => action.run()}
						style={gridCell}
					/>
				))}
			</ButtonGrid>
			{wide && (
				<Button
					variant="secondary"
					icon={wide.icon}
					label={wide.label}
					onPress={() => wide.run()}
				/>
			)}
		</View>
	);
}
