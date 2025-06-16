import type { CryptoType, EncryptionType } from "@/app/new-code";

export const generateEmailQRCodeData = (
	email: string,
	subject?: string,
	body?: string,
	cc?: string,
	bcc?: string,
) => {
	let data = `mailto:${email}`;
	if (subject) {
		data += `?subject=${subject}`;
	}
	if (body) {
		data += `&body=${body}`;
	}
	if (cc) {
		data += `&cc=${cc}`;
	}
	if (bcc) {
		data += `&bcc=${bcc}`;
	}
	return data;
};

export const generatePhoneQRCodeData = (number: string) => {
	return `tel:${number}`;
};

export const generateWifiQRCodeData = (
	ssid: string,
	password?: string,
	encryption?: EncryptionType,
	hidden?: boolean,
) => {
	let data = `WIFI:S:${ssid}`;
	if (password) {
		data += `;P:${password}`;
	}
	if (encryption) {
		data += `;T:${encryption}`;
	} else {
		data += ";T:nopass";
	}
	if (hidden) {
		data += ";H:true";
	} else {
		data += ";H:false";
	}
	return data;
};

export const generateSMSQRCodeData = (number: string, message?: string) => {
	let data = `sms:${number}`;
	if (message) {
		data += `?body=${message}`;
	}
	return data;
};

export const generateVCardQRCodeData = (
	lastName: string,
	firstName: string,
	email?: string,
	phone?: string,
	organization?: string,
	title?: string,
	url?: string,
	address?: string,
) => {
	let data = "BEGIN:VCARD\n";
	data += "VERSION:3.0\n";
	data += `N:${lastName};${firstName}\n`;
	data += `FN:${firstName} ${lastName}\n`;
	if (organization) {
		data += `ORG:${organization}\n`;
	}
	if (title) {
		data += `TITLE:${title}\n`;
	}
	if (address) {
		data += `ADR;TYPE=HOME:;;${address}\n`;
	}
	if (email) {
		data += `EMAIL:${email}\n`;
	}
	if (phone) {
		data += `TEL;TYPE=CELL:${phone}\n`;
	}
	if (url) {
		data += `URL:${url}\n`;
	}
	data += "END:VCARD";
	return data;
};

export const generateLocationQRCodeData = (
	latitude: number,
	longitude: number,
	altitude?: number,
) => {
	let data = "geo:";
	data += `${latitude},${longitude}`;
	if (altitude) {
		data += `,${altitude}`;
	}
	return data;
};

export const generateCryptoQRCodeData = (
	wallet: string,
	crypto: CryptoType,
	amount: number,
	label?: string,
	message?: string,
) => {
	let data = `${crypto}:${wallet}`;
	data += `?amount=${amount}`;
	if (label) {
		data += `?label=${label}`;
	}
	if (message) {
		data += `&message=${message}`;
	}
	return data;
};
