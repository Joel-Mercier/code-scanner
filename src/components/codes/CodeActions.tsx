import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as Calendar from "expo-calendar";
import * as Clipboard from "expo-clipboard";
import * as Contacts from "expo-contacts";
import { openBrowserAsync } from "expo-web-browser";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Linking, Platform, View } from "react-native";
import { Button, ButtonGrid, gridCell } from "@/components/ui/Button";
import type { IconName } from "@/components/ui/Icon";
import { toast } from "@/components/ui/Toast";
import {
	type ActionKey,
	type ContactDraft,
	type EventDraft,
	type PlannedAction,
	planActions,
	type WifiNetwork,
} from "@/domain/codes/actions";
import type { DescribedCode } from "@/domain/codes/describe";
import type { LookupLink } from "@/domain/codes/lookup";
import { attempt } from "@/lib/attempt";
import { haptics } from "@/lib/haptics";
import { shareText } from "@/services/share";
import { joinWifi } from "@/services/wifi";
import useSettings from "@/stores/settings";
import { LookupSheet } from "./LookupSheet";
import { UrlCheck } from "./UrlCheck";

/** A button in a code's action grid. */
export type Action = {
	key: string;
	label: string;
	icon: IconName;
	run: () => Promise<void> | void;
};

const presets: Record<ActionKey, { icon: IconName; label: string }> = {
	open: { icon: "externalLink", label: "open_link" },
	openInApp: { icon: "smartphone", label: "open_in_app" },
	openInBrowser: { icon: "globe", label: "open_in_browser" },
	website: { icon: "globe", label: "open_website" },
	email: { icon: "mail", label: "send_email" },
	call: { icon: "phone", label: "call" },
	sms: { icon: "sms", label: "send_sms" },
	whatsapp: { icon: "sms", label: "whatsapp" },
	joinWifi: { icon: "wifi", label: "join_wifi" },
	copyPassword: { icon: "key", label: "copy_password" },
	contact: { icon: "userPlus", label: "add_contact" },
	event: { icon: "calendarPlus", label: "add_event" },
	map: { icon: "location", label: "open_map" },
	directions: { icon: "navigation", label: "directions" },
	copyCoordinates: { icon: "copy", label: "copy_coordinates" },
	authenticator: { icon: "lock", label: "add_authenticator" },
	copySecret: { icon: "key", label: "copy_secret" },
	copyIban: { icon: "banknote", label: "copy_iban" },
	copyAmount: { icon: "copy", label: "copy_amount" },
	copyReference: { icon: "copy", label: "copy_reference" },
	addFlight: { icon: "calendarPlus", label: "add_event" },
	flightStatus: { icon: "plane", label: "flight_status" },
	copyBooking: { icon: "copy", label: "copy_booking" },
	lookup: { icon: "tag", label: "look_up_product" },
	track: { icon: "package", label: "track_parcel" },
	expiryReminder: { icon: "calendarClock", label: "expiry_reminder" },
	search: { icon: "search", label: "search_web" },
	copy: { icon: "copy", label: "copy" },
	share: { icon: "share", label: "share_content" },
};

/** The lookup button names what it finds. */
const lookupPreset = (
	code: DescribedCode,
): { icon: IconName; label: string } => {
	switch (code.barcode?.type) {
		case "book":
			return { icon: "book", label: "look_up_book" };
		case "medicine":
			return { icon: "pill", label: "look_up" };
		case "gs1":
			return code.barcode.medicine
				? { icon: "pill", label: "look_up" }
				: presets.lookup;
		case "music":
		case "periodical":
			return { icon: "book", label: "look_up" };
		default:
			return presets.lookup;
	}
};

const getWritableCalendar = async () => {
	if (Platform.OS === "ios") return Calendar.getDefaultCalendarSync();
	const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
	const writable = calendars.filter((calendar) => calendar.allowsModifications);
	return writable.find((calendar) => calendar.isPrimary) ?? writable[0];
};

const addEvent = async (event: EventDraft) => {
	const { status } = await Calendar.requestCalendarPermissions();
	if (status !== "granted") return;
	const calendar = await getWritableCalendar();
	if (!calendar) return;
	await calendar.addEventWithForm({
		title: event.title,
		notes: event.notes,
		location: event.location,
		startDate: event.start,
		endDate: event.end,
		allDay: event.allDay,
	});
};

const addContact = async (contact: ContactDraft) => {
	await Contacts.Contact.presentCreateForm({
		givenName: contact.firstName,
		familyName: contact.lastName,
		company: contact.company,
		jobTitle: contact.jobTitle,
		emails: contact.emails.map((address, index) => ({
			address,
			label: index === 0 ? "work" : "other",
		})),
		phones: contact.phones.map((number, index) => ({
			number,
			label: index === 0 ? "mobile" : "other",
		})),
		urlAddresses: contact.url ? [{ url: contact.url, label: "homepage" }] : [],
		addresses: contact.address
			? [{ street: contact.address, label: "home" }]
			: [],
	});
};

/**
 * What can be done with a code's content, most useful first, and the links
 * its lookup sheet offers.
 */
function useCodeActions(
	code: DescribedCode,
	data: string,
	openLookup: () => void,
): { actions: Action[]; links?: LookupLink[] } {
	const { t } = useTranslation();
	const engine = useSettings((state) => state.searchEngine);
	const platform = Platform.OS === "ios" ? "ios" : "android";

	const copy = async (value: string, copied?: "password" | "secret") => {
		await Clipboard.setStringAsync(value);
		haptics.success();
		toast(
			copied === "password"
				? t("app.actions.password_copied")
				: copied === "secret"
					? t("app.actions.secret_copied")
					: t("app.common.copied"),
		);
	};

	const openExternal = async (url: string) => {
		const opened = await attempt(() => Linking.openURL(url));
		if (!opened.ok) toast(t("app.actions.no_app"), "warning");
	};

	const join = async (network: WifiNetwork) => {
		const { ssid, password } = network;
		const result = await attempt(() => joinWifi(network));
		if (!result.ok || result.value === "failed") {
			toast(t("app.wifi.failed", { ssid }), "warning");
			return;
		}
		switch (result.value) {
			case "connected":
			case "saved":
				haptics.success();
				toast(t(`app.wifi.${result.value}`, { ssid }));
				break;
			case "manual":
				toast(
					t(`app.wifi.${password ? "manual" : "open"}_${platform}`, { ssid }),
				);
				break;
		}
	};

	const run = (action: PlannedAction) => {
		switch (action.type) {
			case "browser":
				return () => openBrowserAsync(action.url).then(() => undefined);
			case "external":
				return () => openExternal(action.url);
			case "copy":
				return () => copy(action.value, action.copied);
			case "share":
				return () => shareText(data);
			case "wifi":
				return () => join(action.network);
			case "contact":
				return () => addContact(action.contact);
			case "event":
				return () => addEvent(action.event);
			case "lookup":
				return openLookup;
		}
	};

	const planned = planActions(code, data, { platform, engine });
	const lookup = planned.find((action) => action.type === "lookup");
	return {
		actions: planned.map((action) => {
			const preset =
				action.key === "lookup" ? lookupPreset(code) : presets[action.key];
			return {
				key: action.key,
				icon: preset.icon,
				label: t(`app.actions.${preset.label}`),
				run: run(action),
			};
		}),
		links: lookup?.type === "lookup" ? lookup.links : undefined,
	};
}

/**
 * The first action as the big blue button, the rest (and `extra`) as a grid
 * of white buttons, two per row, then `wide` across the full width. Links
 * show where they really go first.
 */
export function CodeActions({
	code,
	data,
	extra = [],
	wide,
	compact = false,
	onShare,
}: {
	code: DescribedCode;
	data: string;
	extra?: Action[];
	wide?: Action;
	/** Only the two most useful content actions, plus copy and share. */
	compact?: boolean;
	/** Replaces sharing the content as text (e.g. to offer text or image). */
	onShare?: () => void;
}) {
	const { t } = useTranslation();
	const engine = useSettings((state) => state.searchEngine);
	const lookupSheet = useRef<BottomSheetModal>(null);
	const planned = useCodeActions(code, data, () =>
		lookupSheet.current?.present(),
	);
	const all = planned.actions.map((action) =>
		action.key === "share" && onShare ? { ...action, run: onShare } : action,
	);
	const general = all.filter(
		(action) => action.key === "copy" || action.key === "share",
	);
	const content = all.filter((action) => !general.includes(action));
	const actions = compact
		? [...content.slice(0, 2), ...general]
		: [...content, ...general];
	const [first, ...rest] = [...actions, ...extra];

	/** Runs an action; anything it throws becomes a toast. */
	const press = async (action: Action) => {
		const result = await attempt(async () => action.run());
		if (!result.ok) toast(t("app.common.something_went_wrong"), "warning");
	};

	return (
		<View style={{ gap: 10 }}>
			{code.parsed.kind === "url" && <UrlCheck url={code.parsed.url} />}
			<Button
				icon={first.icon}
				label={first.label}
				onPress={() => press(first)}
			/>
			<ButtonGrid>
				{rest.map((action) => (
					<Button
						key={action.key}
						variant="secondary"
						icon={action.icon}
						label={action.label}
						onPress={() => press(action)}
						style={gridCell}
					/>
				))}
			</ButtonGrid>
			{wide && (
				<Button
					variant="secondary"
					icon={wide.icon}
					label={wide.label}
					onPress={() => press(wide)}
				/>
			)}
			{planned.links && (
				<LookupSheet
					ref={lookupSheet}
					links={planned.links}
					engine={engine}
					onPick={(link) => {
						lookupSheet.current?.dismiss();
						openBrowserAsync(link.url).catch(console.error);
					}}
				/>
			)}
		</View>
	);
}
