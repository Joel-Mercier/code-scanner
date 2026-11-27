import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import type { Ref } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/Icon";
import { ListCard, ListRow } from "@/components/ui/List";
import { Sheet } from "@/components/ui/Sheet";
import { Text } from "@/components/ui/Text";
import {
	type SearchEngine,
	searchEngineNames,
	searchEngines,
} from "@/domain/codes/lookup";
import { useTheme } from "@/theme";

/** Picks where web searches and barcode lookups go. */
export function SearchEngineSheet({
	ref,
	value,
	onChange,
}: {
	ref: Ref<BottomSheetModal>;
	value: SearchEngine;
	onChange: (engine: SearchEngine) => void;
}) {
	const { t } = useTranslation();
	const { colors } = useTheme();
	return (
		<Sheet ref={ref}>
			<Text size={24} weight="semibold" tracking={-0.02}>
				{t("app.settings.search_engine")}
			</Text>
			<ListCard>
				{searchEngines.map((engine, index) => (
					<ListRow
						key={engine}
						label={searchEngineNames[engine]}
						height={56}
						last={index === searchEngines.length - 1}
						trailing={
							engine === value ? (
								<Icon name="check" size={18} color={colors.accent} />
							) : undefined
						}
						onPress={() => onChange(engine)}
					/>
				))}
			</ListCard>
		</Sheet>
	);
}
