import QRCode, { type QRCodeToStringOptions } from "qrcode";
import { useEffect, useState } from "react";

export const useQRCode = (
	data: string | null | undefined,
	options?: QRCodeToStringOptions,
) => {
	const [svg, setSvg] = useState<string | null>(null);

	useEffect(() => {
		if (data) {
			const generateQRCode = async () => {
				try {
					const qrCode = await QRCode.toString(data, {
						type: options?.type || "svg",
						...options,
					});
					setSvg(qrCode);
				} catch (error) {
					console.error(error);
				}
			};
			generateQRCode();
		}
	}, [data, options]);

	return {
		svg,
	};
};
