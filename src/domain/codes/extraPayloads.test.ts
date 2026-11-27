import { dayOfYearNear } from "./extraPayloads";
import { parseCode } from "./payload";

describe("payments", () => {
	it("reads an EPC (SEPA) QR code", () => {
		const epc = [
			"BCD",
			"002",
			"1",
			"SCT",
			"BNPAFRPP",
			"Ada Lovelace",
			"FR76 3000 6000 0112 3456 7890 189",
			"EUR12.5",
			"",
			"RF18539007547034",
			"Invoice 42",
		].join("\n");
		expect(parseCode(epc)).toEqual({
			kind: "payment",
			standard: "epc",
			bic: "BNPAFRPP",
			name: "Ada Lovelace",
			iban: "FR7630006000011234567890189",
			amount: 12.5,
			currency: "EUR",
			reference: "RF18539007547034",
			message: "Invoice 42",
		});
	});

	it("leaves out an EPC amount that isn't there", () => {
		expect(
			parseCode("BCD\n001\n1\nSCT\n\nAda\nFR7630006000011234567890189"),
		).toMatchObject({ kind: "payment", amount: undefined, bic: undefined });
	});

	it("reads a Swiss QR-bill", () => {
		const lines = Array.from({ length: 32 }, () => "");
		lines[0] = "SPC";
		lines[1] = "0200";
		lines[2] = "1";
		lines[3] = "CH4431999123000889012";
		lines[4] = "S";
		lines[5] = "Robert Schneider AG";
		lines[18] = "1949.75";
		lines[19] = "CHF";
		lines[27] = "QRR";
		lines[28] = "210000000003139471430009017";
		lines[29] = "Order of 15 June";
		lines[30] = "EPD";
		expect(parseCode(lines.join("\r\n"))).toEqual({
			kind: "payment",
			standard: "swiss",
			iban: "CH4431999123000889012",
			name: "Robert Schneider AG",
			amount: 1949.75,
			currency: "CHF",
			reference: "210000000003139471430009017",
			message: "Order of 15 June",
		});
	});
});

describe("boarding passes", () => {
	const pass = "M1DESMARAIS/LUC       EABC123 YULFRAAC 0834 326J001A0025 100";

	it("reads the first leg", () => {
		expect(parseCode(pass, new Date(2026, 10, 20))).toEqual({
			kind: "boardingPass",
			passenger: "DESMARAIS/LUC",
			pnr: "ABC123",
			from: "YUL",
			to: "FRA",
			carrier: "AC",
			flight: "834",
			date: new Date(2026, 10, 22),
			seat: "1A",
			sequence: "25",
			legs: 1,
		});
	});

	it("doesn't take other text starting with M1 for a pass", () => {
		expect(parseCode("M1 is a motorway")).toMatchObject({ kind: "text" });
	});

	it("puts the day of the year in the year closest to now", () => {
		expect(dayOfYearNear(2, new Date(2026, 11, 30))).toEqual(
			new Date(2027, 0, 2),
		);
		expect(dayOfYearNear(364, new Date(2027, 0, 3))).toEqual(
			new Date(2026, 11, 30),
		);
	});
});

describe("2D-Doc", () => {
	it("reads the header", () => {
		expect(parseCode("DC02FR000001125E125B0126FR245700010MLLE/SAMPLE")).toEqual(
			{
				kind: "frenchDoc",
				version: 2,
				authority: "FR00",
				certificate: "0001",
				issuedOn: new Date(2000, 0, 1 + 0x125e),
				signedOn: new Date(2000, 0, 1 + 0x125b),
				documentType: "01",
				country: undefined,
			},
		);
	});

	it("reads the issuing country of a version 4 header", () => {
		expect(parseCode("DC04FR0300011E0A1E0A0001FR4501")).toMatchObject({
			version: 4,
			country: "FR",
		});
	});
});
