import { classifyBarcode, lookupGtin } from "./barcode";

describe("classifyBarcode", () => {
	it("reads products and where their brand registered", () => {
		expect(classifyBarcode("ean13", "3017620422003")).toEqual({
			type: "product",
			gtin: "3017620422003",
			region: "FR",
		});
		expect(classifyBarcode("upc_a", "036000291452")).toEqual({
			type: "product",
			gtin: "0036000291452",
			region: "US",
		});
		expect(classifyBarcode("upc_e", "04252614")).toEqual({
			type: "product",
			gtin: "0042100005264",
			region: "US",
		});
		expect(classifyBarcode("ean8", "96385074")).toMatchObject({
			type: "product",
			gtin: "96385074",
		});
	});

	it("reads books, sheet music and periodicals", () => {
		expect(classifyBarcode("ean13", "9782070612758")).toEqual({
			type: "book",
			gtin: "9782070612758",
			isbn10: "2070612759",
		});
		expect(classifyBarcode("ean13", "9791032305690")).toMatchObject({
			type: "book",
			isbn10: undefined,
		});
		expect(classifyBarcode("ean13", "9790060115615")).toMatchObject({
			type: "music",
		});
		expect(classifyBarcode("ean13", "9770317847001")).toMatchObject({
			type: "periodical",
			issn: "0317-8471",
		});
	});

	it("recognises French medicines and codes that only mean something in one shop", () => {
		expect(classifyBarcode("ean13", "3400930000120")).toMatchObject({
			type: "medicine",
		});
		expect(classifyBarcode("ean13", "2001234567893")).toMatchObject({
			type: "store",
		});
		expect(classifyBarcode("ean8", "20123451")).toMatchObject({
			type: "store",
		});
		expect(classifyBarcode("upc_a", "512345678900")).toMatchObject({
			type: "coupon",
		});
	});

	it("unpacks the product inside an ITF-14 carton", () => {
		expect(classifyBarcode("itf14", "15400141288763")).toMatchObject({
			type: "product",
			gtin: "5400141288766",
		});
		expect(classifyBarcode("itf14", "03017620422003")).toMatchObject({
			gtin: "3017620422003",
		});
	});

	it("reads GS1 data: expiry, lot, serial, weight", () => {
		const info = classifyBarcode(
			"code128",
			"]C10103400930000120172612001012AB\u001d21XYZ\u001d3102001250",
		);
		expect(info).toMatchObject({
			type: "gs1",
			gtin: "3400930000120",
			expiry: new Date(2026, 11, 31),
			lot: "12AB",
			serial: "XYZ",
			weightKg: 12.5,
			medicine: true,
		});
	});

	it("reads parcel numbers", () => {
		expect(classifyBarcode("code128", "RR123456785FR")).toEqual({
			type: "parcel",
			number: "RR123456785FR",
			carrier: "laposte",
			country: "FR",
		});
		expect(classifyBarcode("code128", "RR123456785DE")).toMatchObject({
			carrier: "post",
			country: "DE",
		});
		expect(classifyBarcode("code128", "RR123456786FR")).toBeUndefined();
		expect(classifyBarcode("code128", "1Z999AA10123456784")).toMatchObject({
			carrier: "ups",
		});
		expect(classifyBarcode("code128", "6A12345678901")).toMatchObject({
			carrier: "laposte",
		});
	});

	it("reads VINs", () => {
		expect(
			classifyBarcode("code39", "I1M8GDM9AXKP042788", new Date(2026, 0, 1)),
		).toEqual({
			type: "vin",
			vin: "1M8GDM9AXKP042788",
			region: "northAmerica",
			country: "US",
			year: 2019,
		});
		// Elsewhere, only VINs whose check digit holds.
		expect(classifyBarcode("code128", "1M8GDM9AXKP042788")).toMatchObject({
			type: "vin",
		});
		expect(classifyBarcode("code128", "VF1AB000000000000")).toBeUndefined();
		expect(classifyBarcode("code39", "VF1RFB00X56789012")).toMatchObject({
			type: "vin",
			region: "europe",
			country: "FR",
			year: undefined,
		});
	});

	it("leaves other content alone", () => {
		expect(classifyBarcode("code128", "ABC-123")).toBeUndefined();
		expect(classifyBarcode("ean13", "12")).toBeUndefined();
	});
});

describe("lookupGtin", () => {
	it("is the GTIN of products, books and GS1 data", () => {
		expect(
			lookupGtin({ type: "book", gtin: "9782070612758", isbn10: "x" }),
		).toBe("9782070612758");
		expect(
			lookupGtin({ type: "store", gtin: "2001234567893" }),
		).toBeUndefined();
	});
});
