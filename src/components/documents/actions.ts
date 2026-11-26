import { toast } from "@/components/ui/Toast";
import type { DocItem } from "@/domain/library/types";
import i18n from "@/i18n";
import { attempt } from "@/lib/attempt";
import { exportDocument } from "@/services/documents";

/** Lets the user pick a folder for the PDF (or first page), then confirms. */
export const saveDocumentToFiles = async (doc: DocItem) => {
	const result = await attempt(() => exportDocument(doc));
	if (result.ok) toast(i18n.t("app.document.saved"));
};
