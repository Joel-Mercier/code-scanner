import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import Animated from "react-native-reanimated";
import { type Action, CodeActions } from "@/components/codes/CodeActions";
import { CodeFields } from "@/components/codes/CodeFields";
import { shareCode } from "@/components/codes/exportCode";
import { useLibraryActions } from "@/components/library/useLibraryActions";
import { useRevealed } from "@/components/lock/hooks";
import { LockedItem } from "@/components/lock/LockedItem";
import { Header } from "@/components/ui/Header";
import { IconButton } from "@/components/ui/IconButton";
import { StatusBar } from "@/components/ui/StatusBar";
import { Eyebrow, Text } from "@/components/ui/Text";
import { describeItem } from "@/domain/codes/describe";
import { canRender } from "@/domain/codes/formats";
import { catalogueNumber } from "@/domain/library/items";
import { format } from "@/lib/date";
import { shareText } from "@/services/share";
import useLibrary from "@/stores/library";
import {
	makeStyles,
	useScreenInsets,
	useSharedStyles,
	useTheme,
} from "@/theme";
import { enter } from "@/theme/motion";
import { CodeStage } from "./components/CodeStage";
import { ShareSheet } from "./components/ShareSheet";
import { saveToGallery } from "./saveToGallery";

/** A saved code: the object, its actions, its decoded fields and raw data. */
export function CodeScreen({ id }: { id: string }) {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const router = useRouter();
	const edges = useScreenInsets();
	const item = useLibrary((state) => state.items[id]);
	const actions = useLibraryActions({ onDeleted: () => router.back() });
	const shareSheet = useRef<BottomSheetModal>(null);
	const revealed = useRevealed(item);

	if (item?.kind === "code" && !revealed) return <LockedItem item={item} />;

	if (item?.kind !== "code") {
		return (
			<View style={shared.screen}>
				<Header />
				{actions.element}
			</View>
		);
	}

	const code = describeItem(item);
	// Only codes that can be drawn have an image to save or share.
	const renderable = canRender(item.format);

	const saveImage: Action | undefined = renderable
		? {
				key: "save-image",
				icon: "download",
				label: t("app.code.save_image"),
				run: () => saveToGallery(item),
			}
		: undefined;

	/** Shares as text or as an image of the code, then closes the sheet. */
	const shareAs = (as: "text" | "image") => {
		shareSheet.current?.dismiss();
		const sharing =
			as === "text"
				? shareText(item.data)
				: shareCode(item.format, item.data, item.style);
		sharing.catch(console.error);
	};

	return (
		<View style={shared.screen}>
			<StatusBar />
			<Header
				right={
					<IconButton
						icon="more"
						accessibilityLabel={t("app.common.more")}
						onPress={() => actions.openItem(item)}
					/>
				}
			/>
			<ScrollView
				contentContainerStyle={edges.content}
				showsVerticalScrollIndicator={false}
			>
				{renderable && (
					<CodeStage
						item={item}
						onShow={() =>
							router.push({
								pathname: "/code/[id]/show",
								params: { id: item.id },
							})
						}
					/>
				)}

				<Animated.View entering={enter.up(200)} style={styles.titles}>
					<Text size={12} mono color={colors.muted}>
						{catalogueNumber(item)} · {code.subtitle.toUpperCase()} ·{" "}
						{t(
							item.source === "scanner"
								? "app.code.scanned_on"
								: "app.code.created_on",
							{ date: format(item.createdAt, "d MMM yyyy, HH:mm") },
						).toUpperCase()}
					</Text>
					<Text
						size={32}
						weight="semibold"
						tracking={-0.025}
						numberOfLines={4}
						selectable
					>
						{code.title}
					</Text>
				</Animated.View>

				<Animated.View entering={enter.up(280)} style={styles.actions}>
					<CodeActions
						code={code}
						data={item.data}
						wide={saveImage}
						onShare={
							renderable ? () => shareSheet.current?.present() : undefined
						}
					/>
				</Animated.View>

				<Animated.View entering={enter.up(360)} style={styles.blocks}>
					<CodeFields code={code} />
					<View style={shared.well}>
						<Eyebrow>{t("app.code.raw")}</Eyebrow>
						<Text size={14} mono selectable>
							{item.data}
						</Text>
					</View>
				</Animated.View>
			</ScrollView>
			{actions.element}
			<ShareSheet ref={shareSheet} onShare={shareAs} />
		</View>
	);
}

const useStyles = makeStyles(() => ({
	titles: { paddingTop: 6, paddingHorizontal: 20, gap: 6 },
	actions: { paddingTop: 18, paddingHorizontal: 16 },
	blocks: { marginTop: 18, marginHorizontal: 16, gap: 12 },
}));
