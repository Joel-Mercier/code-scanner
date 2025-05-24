import QRCode from "qrcode";
import { useEffect, useState } from "react";

export const useQRCode = (data: string | null | undefined) => {
	const [svg, setSvg] = useState<string | null>(null);

	useEffect(() => {
		if (data) {
			const generateQRCode = async () => {
				const qrCode = await QRCode.toString(data, {
					type: "svg",
				});
				setSvg(qrCode);
			};
			generateQRCode();
		}
	}, [data]);

	return {
		svg,
	};
};
