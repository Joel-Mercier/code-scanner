import type { IconName } from "@/components/ui/Icon";
import type { DisplayKind } from "@/domain/codes/describe";

/** The icon of each kind of object in the collection. */
export const kindIcons: Record<DisplayKind | "doc", IconName> = {
	url: "link",
	text: "text",
	wifi: "wifi",
	email: "email",
	phone: "phone",
	sms: "sms",
	vcard: "contact",
	event: "calendar",
	geoPoint: "location",
	otp: "lock",
	payment: "banknote",
	boardingPass: "plane",
	frenchDoc: "receipt",
	app: "smartphone",
	barcode: "barcode",
	doc: "document",
};
