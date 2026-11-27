/**
 * Payloads the app reads but doesn't create: 2FA setup links, SEPA / Swiss
 * payment requests, airline boarding passes and French 2D-Doc headers.
 */
import { decode, queryParams } from "./fields";

export type OtpCode = {
	kind: "otp";
	/** `totp` (time-based) or `hotp` (counter-based). */
	type: string;
	issuer?: string;
	account?: string;
	secret?: string;
	algorithm?: string;
	digits?: number;
	period?: number;
	uri: string;
};

export type PaymentCode = {
	kind: "payment";
	/** EPC ("Girocode", SEPA credit transfer) or Swiss QR-bill. */
	standard: "epc" | "swiss";
	name?: string;
	iban?: string;
	bic?: string;
	amount?: number;
	currency?: string;
	reference?: string;
	message?: string;
};

export type BoardingPass = {
	kind: "boardingPass";
	/** As printed: `SURNAME/GIVEN NAMES`. */
	passenger: string;
	/** Booking reference. */
	pnr?: string;
	from: string;
	to: string;
	carrier: string;
	flight: string;
	/** The flight's date, guessed from its day of the year. */
	date?: Date;
	seat?: string;
	sequence?: string;
	legs: number;
};

export type FrenchDoc = {
	kind: "frenchDoc";
	version: number;
	/** Certification authority, e.g. `FR01`. */
	authority: string;
	certificate: string;
	issuedOn?: Date;
	signedOn?: Date;
	/** The document type code (`00`–`ZZ`) defined by ANTS. */
	documentType: string;
	country?: string;
};

const optional = (value?: string) => value?.trim() || undefined;

/** `otpauth://totp/Issuer:account?secret=…&issuer=…` */
export const parseOtp = (data: string): OtpCode | undefined => {
	const match = data.match(/^otpauth:\/\/([^/?#]+)\/([^?#]*)(?:\?([^#]*))?/i);
	if (!match) return undefined;
	const label = decode(match[2]);
	const params = queryParams(match[3] ?? "");
	const separator = label.indexOf(":");
	const labelIssuer = separator >= 0 ? label.slice(0, separator) : undefined;
	const account = separator >= 0 ? label.slice(separator + 1) : label;
	const number = (value?: string) =>
		value && Number.isFinite(Number(value)) ? Number(value) : undefined;
	return {
		kind: "otp",
		type: match[1].toLowerCase(),
		issuer: optional(params.issuer) ?? optional(labelIssuer),
		account: optional(account),
		secret: optional(params.secret?.replace(/\s/g, "").toUpperCase()),
		algorithm: optional(params.algorithm?.toUpperCase()),
		digits: number(params.digits),
		period: number(params.period),
		uri: data,
	};
};

const readAmount = (value?: string) => {
	const amount = Number(value?.trim());
	return value?.trim() && Number.isFinite(amount) ? amount : undefined;
};

/**
 * EPC QR (`BCD`, lines: version, charset, `SCT`, BIC, name, IBAN, amount,
 * purpose, reference, text) and the Swiss QR-bill (`SPC`).
 */
export const parsePayment = (data: string): PaymentCode | undefined => {
	const lines = data.split(/\r?\n/);
	if (lines[0] === "BCD" && lines.length >= 7) {
		const amount = lines[7]?.trim().match(/^([A-Z]{3})?(\d+(?:\.\d{1,2})?)$/);
		return {
			kind: "payment",
			standard: "epc",
			bic: optional(lines[4]),
			name: optional(lines[5]),
			iban: optional(lines[6]?.replace(/\s/g, "").toUpperCase()),
			amount: readAmount(amount?.[2]),
			currency: amount ? (amount[1] ?? "EUR") : undefined,
			reference: optional(lines[9]),
			message: optional(lines[10]) ?? optional(lines[11]),
		};
	}
	if (lines[0] === "SPC" && lines.length >= 20) {
		return {
			kind: "payment",
			standard: "swiss",
			iban: optional(lines[3]?.replace(/\s/g, "").toUpperCase()),
			name: optional(lines[5]),
			amount: readAmount(lines[18]),
			currency: optional(lines[19]),
			reference: optional(lines[28]),
			message: optional(lines[29]),
		};
	}
	return undefined;
};

/**
 * The date of the `dayOfYear`th day, in whichever year puts it closest to
 * `now` (boarding passes don't carry the year).
 */
export const dayOfYearNear = (dayOfYear: number, now: Date) => {
	const year = now.getFullYear();
	const candidates = [year - 1, year, year + 1].map(
		(y) => new Date(y, 0, dayOfYear),
	);
	return candidates.reduce((best, date) =>
		Math.abs(date.getTime() - now.getTime()) <
		Math.abs(best.getTime() - now.getTime())
			? date
			: best,
	);
};

const stripZeros = (value: string) => value.replace(/^0+(?=.)/, "");

/** IATA BCBP (Resolution 792), mandatory fields of the first leg. */
export const parseBoardingPass = (
	data: string,
	now: Date,
): BoardingPass | undefined => {
	if (!/^M[1-9]/.test(data) || data.length < 58) return undefined;
	const field = (start: number, end: number) => data.slice(start, end).trim();
	const from = field(30, 33);
	const to = field(33, 36);
	const day = Number(field(44, 47));
	if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) return undefined;
	if (!Number.isInteger(day) || day < 1 || day > 366) return undefined;
	const passenger = field(2, 22);
	const carrier = field(36, 39);
	const flight = stripZeros(field(39, 44));
	if (!passenger || !carrier || !flight) return undefined;
	return {
		kind: "boardingPass",
		passenger,
		pnr: optional(field(23, 30)),
		from,
		to,
		carrier,
		flight,
		date: dayOfYearNear(day, now),
		seat: optional(stripZeros(field(48, 52))),
		sequence: optional(stripZeros(field(52, 57))),
		legs: Number(data[1]),
	};
};

/** 2D-Doc dates: days since 1 January 2000, in hex; `FFFF` for none. */
const docDate = (hex: string) => {
	if (!/^[0-9A-F]{4}$/i.test(hex) || /^ffff$/i.test(hex)) return undefined;
	return new Date(2000, 0, 1 + Number.parseInt(hex, 16));
};

/** The header of a French 2D-Doc (`DC01`–`DC04`). The signature isn't checked. */
export const parseFrenchDoc = (data: string): FrenchDoc | undefined => {
	const match = data.match(
		/^DC0([1-4])([A-Z0-9]{4})([A-Z0-9]{4})([0-9A-F]{4})([0-9A-F]{4})([A-Z0-9]{2})/i,
	);
	if (!match) return undefined;
	const version = Number(match[1]);
	return {
		kind: "frenchDoc",
		version,
		authority: match[2],
		certificate: match[3],
		issuedOn: docDate(match[4]),
		signedOn: docDate(match[5]),
		documentType: match[6],
		country: version >= 4 ? optional(data.slice(24, 26)) : undefined,
	};
};
