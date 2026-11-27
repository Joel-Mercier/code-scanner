import type { IconName } from "@/components/ui/Icon";
import type { DocType } from "@/domain/library/types";

export const docTypeIcons: Record<DocType, IconName> = {
	receipt: "receipt",
	invoice: "banknote",
	id: "card",
	ticket: "ticket",
	letter: "mail",
	contract: "pencil",
	warranty: "shield",
	medical: "pill",
	other: "document",
};
