import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import type { Ref } from "react";
import { useTranslation } from "react-i18next";
import type { IconName } from "@/components/ui/Icon";
import { ListCard, ListRow } from "@/components/ui/List";
import { Sheet } from "@/components/ui/Sheet";
import { Text } from "@/components/ui/Text";
import {
	type LookupLink,
	type LookupProvider,
	lookupProviderNames,
	type SearchEngine,
	searchEngineNames,
} from "@/domain/codes/lookup";
import { useTheme } from "@/theme";

const providerIcons: Record<LookupProvider, IconName> = {
	openFoodFacts: "food",
	openBeautyFacts: "heart",
	openPetFoodFacts: "star",
	openProductsFacts: "package",
	googleShopping: "tag",
	openLibrary: "book",
	googleBooks: "book",
	worldcat: "book",
	issnPortal: "book",
	web: "search",
};

/** Where to look a barcode up: open product databases, libraries, the web. */
export function LookupSheet({
	ref,
	links,
	engine,
	onPick,
}: {
	ref: Ref<BottomSheetModal>;
	links: LookupLink[];
	engine: SearchEngine;
	onPick: (link: LookupLink) => void;
}) {
	const { t } = useTranslation();
	const { colors } = useTheme();
	return (
		<Sheet ref={ref}>
			<Text size={24} weight="semibold" tracking={-0.02}>
				{t("app.lookup.title")}
			</Text>
			<Text size={14} leading={1.4} color={colors.muted}>
				{t("app.lookup.hint")}
			</Text>
			<ListCard>
				{links.map((link, index) => (
					<ListRow
						key={link.provider}
						icon={providerIcons[link.provider]}
						iconTile={36}
						label={
							link.provider === "web"
								? t("app.lookup.web", { engine: searchEngineNames[engine] })
								: lookupProviderNames[link.provider]
						}
						description={t(`app.lookup.providers.${link.provider}`)}
						height={64}
						chevron
						last={index === links.length - 1}
						onPress={() => onPick(link)}
					/>
				))}
			</ListCard>
		</Sheet>
	);
}
