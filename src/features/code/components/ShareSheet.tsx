import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import type { Ref } from "react";
import { useTranslation } from "react-i18next";
import { ListCard, ListRow } from "@/components/ui/List";
import { Sheet } from "@/components/ui/Sheet";
import { Text } from "@/components/ui/Text";

/** Share a code's content as text, or as a picture of the code. */
export function ShareSheet({
	ref,
	onShare,
}: {
	ref: Ref<BottomSheetModal>;
	onShare: (as: "text" | "image") => void;
}) {
	const { t } = useTranslation();
	return (
		<Sheet ref={ref}>
			<Text size={24} weight="semibold" tracking={-0.02}>
				{t("app.code.share_title")}
			</Text>
			<ListCard>
				<ListRow
					icon="text"
					iconTile={36}
					label={t("app.code.share_text")}
					description={t("app.code.share_text_hint")}
					height={64}
					chevron
					onPress={() => onShare("text")}
				/>
				<ListRow
					icon="image"
					iconTile={36}
					label={t("app.code.share_picture")}
					description={t("app.code.share_picture_hint")}
					height={64}
					chevron
					last
					onPress={() => onShare("image")}
				/>
			</ListCard>
		</Sheet>
	);
}
