import { CameraView } from "expo-camera";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/ui/Toast";
import { attempt } from "@/lib/attempt";
import { format } from "@/lib/date";
import { haptics } from "@/lib/haptics";
import { scanDocument } from "@/services/documents";
import useLibrary from "@/stores/library";

/**
 * Runs the system document scanner and saves the pages as a new document,
 * then hands it to `onCaptured`. `scanning` is true while the scanner is up.
 */
export function useDocumentScanner(onCaptured: (id: string) => void) {
	const { t } = useTranslation();
	const addDocument = useLibrary((state) => state.addDocument);
	const [scanning, setScanning] = useState(false);

	const scan = async () => {
		if (!CameraView.isDocumentScannerAvailable) {
			toast(t("app.scan.doc_scanner_unavailable"), "warning");
			return;
		}
		setScanning(true);
		const result = await attempt(scanDocument);
		setScanning(false);
		if (!result.ok) {
			toast(t("app.scan.doc_scan_failed"), "warning");
			return;
		}
		if (!result.value) return;
		const { id, files } = result.value;
		addDocument({
			id,
			name: t("app.scan.document_name", {
				date: format(Date.now(), "d MMM, HH:mm"),
			}),
			...files,
		});
		haptics.success();
		onCaptured(id);
	};

	return { scanning, scan };
}
