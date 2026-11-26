import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Linking, ScrollView, Share, View } from "react-native";
import Animated from "react-native-reanimated";
import { canRender } from "@/components/codes/CodeArt";
import { saveCodeToGallery, shareCode } from "@/components/codes/exportCode";
import { FloorShadow } from "@/components/ui/Floor";
import { Header } from "@/components/ui/Header";
import { IconButton } from "@/components/ui/IconButton";
import { ListCard, ListRow } from "@/components/ui/List";
import { Pressable } from "@/components/ui/Pressable";
import { Sheet } from "@/components/ui/Sheet";
import { StatusBar } from "@/components/ui/StatusBar";
import { Eyebrow, Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { type Action, CodeActions } from "@/features/codes/CodeActions";
import { CodeFields } from "@/features/codes/CodeFields";
import { describeItem } from "@/features/codes/kinds";
import { CodeObject } from "@/features/codes/Objects";
import { useTurnAndTilt } from "@/features/codes/spin";
import { useLibraryActions } from "@/features/library/useLibraryActions";
import useApp from "@/stores/appStore";
import useLibrary, { type CodeItem, catalogueNumber } from "@/stores/library";
import {
	makeStyles,
	useScreenInsets,
	useSharedStyles,
	useTheme,
} from "@/theme";
import { enter } from "@/theme/motion";
import { attempt } from "@/utils/attempt";
import { format } from "@/utils/date";
import { haptics } from "@/utils/haptics";

export { ErrorScreen as ErrorBoundary } from "@/components/ui/ErrorScreen";

function Stage({ item }: { item: CodeItem }) {
	const styles = useStyles();
	const { t } = useTranslation();
	const [turns, setTurns] = useState(0);
	const { rotateX, rotateY } = useTurnAndTilt(turns);
	// With 3D off the code sits flat, so there is nothing to turn.
	const motion3d = useApp((state) => state.motion3d);
	return (
		<View style={styles.stage}>
			<View style={styles.shadow}>
				<FloorShadow />
			</View>
			<Animated.View entering={enter.lift()}>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={t("app.capture.turn_code")}
					pressedScale={0.98}
					disabled={!motion3d}
					onPress={() => {
						haptics.pop();
						setTurns((count) => count + 1);
					}}
				>
					<CodeObject
						item={item}
						size={220}
						layers={[-6, -3, 0, 3]}
						faceDepth={6}
						rotateX={rotateX}
						rotateY={rotateY}
					/>
				</Pressable>
			</Animated.View>
		</View>
	);
}

export default function CodeScreen() {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { id } = useLocalSearchParams<{ id: string }>();
	const { t } = useTranslation();
	const router = useRouter();
	const edges = useScreenInsets();
	const item = useLibrary((state) => state.items[id]);
	const actions = useLibraryActions({ onDeleted: () => router.back() });
	const shareSheet = useRef<BottomSheetModal>(null);

	if (item?.kind !== "code") {
		return (
			<View style={shared.screen}>
				<Header />
				{actions.element}
			</View>
		);
	}

	const code = describeItem(item);
	const renderable = canRender(item.format);

	const exportImage = async () => {
		const result = await attempt(() =>
			saveCodeToGallery(item.format, item.data, item.style),
		);
		if (!result.ok) {
			toast(t("app.common.something_went_wrong"), "warning");
		} else if (result.value === "granted") {
			toast(t("app.code.saved_to_gallery"));
		} else if (result.value === "blocked") {
			Alert.alert(
				t("app.common.permission_needed"),
				t("app.code.gallery_blocked"),
				[
					{ text: t("app.common.cancel"), style: "cancel" },
					{
						text: t("app.common.open_settings"),
						onPress: () => Linking.openSettings(),
					},
				],
			);
		} else {
			toast(t("app.common.permission_needed"), "warning");
		}
	};

	const saveImage: Action | undefined = renderable
		? {
				key: "save-image",
				icon: "download",
				label: t("app.code.save_image"),
				run: exportImage,
			}
		: undefined;

	/** Shares as text or as an image of the code, then closes the sheet. */
	const shareAs = (as: "text" | "image") => {
		shareSheet.current?.dismiss();
		const sharing =
			as === "text"
				? Share.share({ message: item.data })
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
				{renderable && <Stage item={item} />}

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
						// Only codes that can be drawn have an image to offer.
						onShare={
							renderable ? () => shareSheet.current?.present() : undefined
						}
					/>
				</Animated.View>

				<Animated.View entering={enter.up(360)} style={styles.blocks}>
					<CodeFields parsed={code.parsed} />
					<View style={shared.well}>
						<Eyebrow>{t("app.code.raw")}</Eyebrow>
						<Text size={14} mono selectable>
							{item.data}
						</Text>
					</View>
				</Animated.View>
			</ScrollView>
			{actions.element}
			<Sheet ref={shareSheet}>
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
						onPress={() => shareAs("text")}
					/>
					<ListRow
						icon="image"
						iconTile={36}
						label={t("app.code.share_picture")}
						description={t("app.code.share_picture_hint")}
						height={64}
						chevron
						last
						onPress={() => shareAs("image")}
					/>
				</ListCard>
			</Sheet>
		</View>
	);
}

const useStyles = makeStyles(() => ({
	stage: { height: 290, alignItems: "center", justifyContent: "center" },
	shadow: { position: "absolute", bottom: 14 - 24, alignItems: "center" },
	titles: { paddingTop: 6, paddingHorizontal: 20, gap: 6 },
	actions: { paddingTop: 18, paddingHorizontal: 16 },
	blocks: { marginTop: 18, marginHorizontal: 16, gap: 12 },
}));
