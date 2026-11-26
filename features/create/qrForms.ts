import type { KeyboardTypeOptions } from "react-native";
import * as z from "zod";
import {
	buildPayload,
	type QRFormValues,
	type QRKind,
	type WifiEncryption,
} from "@/utils/codePayload";

export type FieldValue = string | boolean | Date | undefined;
export type FormState = Record<string, FieldValue>;

export type FieldDef =
	| {
			type: "text";
			name: string;
			label: string;
			placeholder?: string;
			keyboard?: KeyboardTypeOptions;
			multiline?: boolean;
			autoCapitalize?: "none" | "sentences" | "words";
			secure?: boolean;
	  }
	| { type: "encryption"; name: string; label: string }
	| { type: "switch"; name: string; label: string }
	| { type: "datetime"; name: string; label: string };

const optionalText = z.string().trim().optional();
const requiredNumber = z.string().trim().min(1).transform(Number);

export const qrForms: Record<
	QRKind,
	{ fields: FieldDef[]; schema: z.ZodType; initial: FormState }
> = {
	url: {
		fields: [
			{
				type: "text",
				name: "url",
				label: "url",
				placeholder: "https://",
				keyboard: "url",
				autoCapitalize: "none",
			},
		],
		schema: z.object({ url: z.url().trim() }),
		initial: { url: "https://" },
	},
	text: {
		fields: [{ type: "text", name: "text", label: "text", multiline: true }],
		schema: z.object({ text: z.string().min(1).max(2000) }),
		initial: { text: "" },
	},
	wifi: {
		fields: [
			{ type: "text", name: "ssid", label: "ssid", autoCapitalize: "none" },
			{
				type: "text",
				name: "password",
				label: "password",
				autoCapitalize: "none",
				secure: true,
			},
			{ type: "encryption", name: "encryption", label: "encryption" },
			{ type: "switch", name: "hidden", label: "hidden" },
		],
		schema: z.object({
			ssid: z.string().min(1).max(64),
			password: z.string().max(64).optional(),
			encryption: z.enum(["WPA", "WEP", "nopass"]),
			hidden: z.boolean().optional(),
		}),
		initial: { ssid: "", password: "", encryption: "WPA", hidden: false },
	},
	email: {
		fields: [
			{
				type: "text",
				name: "to",
				label: "email",
				keyboard: "email-address",
				autoCapitalize: "none",
			},
			{ type: "text", name: "subject", label: "subject" },
			{ type: "text", name: "body", label: "body", multiline: true },
		],
		schema: z.object({
			to: z.email().trim(),
			subject: optionalText,
			body: optionalText,
		}),
		initial: { to: "", subject: "", body: "" },
	},
	phone: {
		fields: [
			{ type: "text", name: "number", label: "phone", keyboard: "phone-pad" },
		],
		schema: z.object({
			number: z
				.string()
				.trim()
				.regex(/^\+?[0-9 ().-]{3,20}$/),
		}),
		initial: { number: "" },
	},
	sms: {
		fields: [
			{ type: "text", name: "number", label: "phone", keyboard: "phone-pad" },
			{ type: "text", name: "message", label: "message", multiline: true },
		],
		schema: z.object({
			number: z
				.string()
				.trim()
				.regex(/^\+?[0-9 ().-]{3,20}$/),
			message: optionalText,
		}),
		initial: { number: "", message: "" },
	},
	vcard: {
		fields: [
			{
				type: "text",
				name: "firstName",
				label: "first_name",
				autoCapitalize: "words",
			},
			{
				type: "text",
				name: "lastName",
				label: "last_name",
				autoCapitalize: "words",
			},
			{ type: "text", name: "phone", label: "phone", keyboard: "phone-pad" },
			{
				type: "text",
				name: "email",
				label: "email",
				keyboard: "email-address",
				autoCapitalize: "none",
			},
			{ type: "text", name: "organization", label: "organization" },
			{ type: "text", name: "title", label: "job_title" },
			{
				type: "text",
				name: "url",
				label: "website",
				keyboard: "url",
				autoCapitalize: "none",
			},
			{ type: "text", name: "address", label: "address", multiline: true },
		],
		schema: z.object({
			firstName: z.string().trim().min(1),
			lastName: optionalText,
			phone: optionalText,
			email: z.email().trim().optional().or(z.literal("")),
			organization: optionalText,
			title: optionalText,
			url: z.url().trim().optional().or(z.literal("")),
			address: optionalText,
		}),
		initial: {
			firstName: "",
			lastName: "",
			phone: "",
			email: "",
			organization: "",
			title: "",
			url: "",
			address: "",
		},
	},
	event: {
		fields: [
			{ type: "text", name: "summary", label: "summary" },
			{ type: "datetime", name: "start", label: "start" },
			{ type: "text", name: "location", label: "location" },
			{
				type: "text",
				name: "description",
				label: "description",
				multiline: true,
			},
		],
		schema: z.object({
			summary: z.string().trim().min(1),
			start: z.date().optional(),
			location: optionalText,
			description: optionalText,
		}),
		initial: { summary: "", start: undefined, location: "", description: "" },
	},
	geoPoint: {
		fields: [
			{
				type: "text",
				name: "lat",
				label: "latitude",
				keyboard: "numbers-and-punctuation",
			},
			{
				type: "text",
				name: "lng",
				label: "longitude",
				keyboard: "numbers-and-punctuation",
			},
			{
				type: "text",
				name: "alt",
				label: "altitude",
				keyboard: "numbers-and-punctuation",
			},
		],
		schema: z.object({
			lat: requiredNumber.pipe(z.number().min(-90).max(90)),
			lng: requiredNumber.pipe(z.number().min(-180).max(180)),
			alt: z
				.string()
				.trim()
				.optional()
				.transform((value) => (value ? Number(value) : undefined))
				.pipe(z.number().optional()),
		}),
		initial: { lat: "", lng: "", alt: "" },
	},
};

const emptyToUndefined = (values: Record<string, unknown>) =>
	Object.fromEntries(
		Object.entries(values).map(([key, value]) => [
			key,
			value === "" ? undefined : value,
		]),
	);

export type QRValidation =
	| { ok: true; payload: string }
	| { ok: false; errors: Record<string, string> };

export const validateQR = (kind: QRKind, state: FormState): QRValidation => {
	const parsed = qrForms[kind].schema.safeParse(state);
	if (!parsed.success) {
		const errors: Record<string, string> = {};
		for (const issue of parsed.error.issues) {
			const key = String(issue.path[0] ?? "");
			if (!errors[key]) errors[key] = issue.message;
		}
		return { ok: false, errors };
	}
	const values = emptyToUndefined(parsed.data as Record<string, unknown>);
	if (kind === "wifi") {
		values.encryption = (values.encryption ?? "WPA") as WifiEncryption;
	}
	return {
		ok: true,
		payload: buildPayload(kind, values as unknown as QRFormValues[typeof kind]),
	};
};
