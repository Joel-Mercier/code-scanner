import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ListCard, ListRow } from "@/components/ui/List";
import { Sheet } from "@/components/ui/Sheet";
import { Text } from "@/components/ui/Text";
import { nameFromFile } from "@/domain/library/documents";
import { attempt } from "@/lib/attempt";
import { importPdf, importPhotos } from "./actions";

/** Picks photos (in the order they were tapped). Empty when cancelled. */
export const pickPhotos = async () => {
	const picked = await ImagePicker.launchImageLibraryAsync({
		mediaTypes: ["images"],
		allowsMultipleSelection: true,
		orderedSelection: true,
		selectionLimit: 0,
		quality: 1,
	});
	return picked.canceled ? [] : picked.assets.map((asset) => asset.uri);
};

/**
 * "Import" for documents: a sheet offering photos from the gallery or a PDF
 * file, saved as a new document and handed to `onImported`. Render `element`
 * once in the screen; `busy` is true while files are being copied.
 */
export function useDocumentImport(onImported: (id: string) => void) {
	const { t } = useTranslation();
	const sheet = useRef<BottomSheetModal>(null);
	const [busy, setBusy] = useState(false);

	const run = async (task: () => Promise<string | null>) => {
		setBusy(true);
		const id = await task();
		setBusy(false);
		if (id) onImported(id);
	};

	const fromPhotos = async () => {
		sheet.current?.dismiss();
		const picked = await attempt(pickPhotos);
		if (!picked.ok || picked.value.length === 0) return;
		await run(() => importPhotos(picked.value));
	};

	const fromPdf = async () => {
		sheet.current?.dismiss();
		const picked = await attempt(() =>
			DocumentPicker.getDocumentAsync({
				type: "application/pdf",
				copyToCacheDirectory: true,
			}),
		);
		if (!picked.ok || picked.value.canceled) return;
		const [file] = picked.value.assets;
		await run(() => importPdf(file.uri, nameFromFile(file.name)));
	};

	const element = (
		<Sheet ref={sheet}>
			<Text size={24} weight="semibold" tracking={-0.02}>
				{t("app.document.import_title")}
			</Text>
			<ListCard>
				<ListRow
					icon="imagePlus"
					label={t("app.document.import_photos")}
					description={t("app.document.import_photos_hint")}
					height={64}
					onPress={fromPhotos}
				/>
				<ListRow
					icon="file"
					label={t("app.document.import_pdf")}
					description={t("app.document.import_pdf_hint")}
					height={64}
					last
					onPress={fromPdf}
				/>
			</ListCard>
		</Sheet>
	);

	return {
		open: () => sheet.current?.present(),
		fromPhotos,
		busy,
		element,
	};
}
