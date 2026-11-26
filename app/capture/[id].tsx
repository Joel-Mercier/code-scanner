import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import Animated from "react-native-reanimated";
import { Button, ButtonGrid, gridCell } from "@/components/ui/Button";
import { FloorShadow, LandingRing } from "@/components/ui/Floor";
import { Header } from "@/components/ui/Header";
import { DetailRows } from "@/components/ui/List";
import { Pressable } from "@/components/ui/Pressable";
import { StatusBar } from "@/components/ui/StatusBar";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { type Action, CodeActions } from "@/features/codes/CodeActions";
import { CodeFields } from "@/features/codes/CodeFields";
import { describeItem } from "@/features/codes/kinds";
import { CodeObject, DocObject } from "@/features/codes/Objects";
import { useCaptureSpin } from "@/features/codes/spin";
import { useFolderPicker } from "@/features/library/useFolderPicker";
import {
	shareItem,
	useLibraryActions,
} from "@/features/library/useLibraryActions";
import useLibrary, {
	catalogueNumber,
	type LibraryItem,
} from "@/stores/library";
import {
	makeStyles,
	useScreenInsets,
	useSharedStyles,
	useTheme,
} from "@/theme";
import { enter } from "@/theme/motion";
import { attempt } from "@/utils/attempt";
import { exportDocument } from "@/utils/documentFiles";

export { ErrorScreen as ErrorBoundary } from "@/components/ui/ErrorScreen";

/** The object lands, spinning, on a ring of light (`.c-*`). */
function Stage({
	item,
	replay,
	onReplay,
}: {
	item: LibraryItem;
	replay: number;
	onReplay: () => void;
}) {
	const styles = useStyles();
	const { t } = useTranslation();
	const { rotateX, rotateY, liftStyle } = useCaptureSpin(replay);
	const doc = item.kind === "doc";
	return (
		<View style={[styles.stage, { height: doc ? 380 : 366 }]}>
			<View style={styles.floor}>
				<LandingRing replay={replay} />
			</View>
			<View style={styles.shadow}>
				<FloorShadow width={170} height={18} />
			</View>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={t(
					doc ? "app.capture.turn_page" : "app.capture.turn_code",
				)}
				onPress={onReplay}
				pressedScale={0.98}
				style={{ marginBottom: doc ? 36 : 40 }}
			>
				<Animated.View style={liftStyle}>
					{item.kind === "doc" ? (
						<DocObject
							item={item}
							width={196}
							rotateX={rotateX}
							rotateY={rotateY}
						/>
					) : (
						<CodeObject
							item={item}
							size={216}
							layers={[-6, -4, -2, 0, 2, 4]}
							faceDepth={7}
							rotateX={rotateX}
							rotateY={rotateY}
						/>
					)}
				</Animated.View>
			</Pressable>
		</View>
	);
}

export default function CaptureScreen() {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { id } = useLocalSearchParams<{ id: string }>();
	const { t } = useTranslation();
	const router = useRouter();
	const edges = useScreenInsets();
	const item = useLibrary((state) => state.items[id]);
	const moveItem = useLibrary((state) => state.moveItem);
	const [replay, setReplay] = useState(0);
	const actions = useLibraryActions({ onDeleted: () => router.back() });
	const folderPicker = useFolderPicker();

	if (!item) {
		return (
			<View style={shared.screen}>
				<Header backIcon="close" />
				{actions.element}
			</View>
		);
	}

	const toCollection = () => router.replace("/library");
	const moveToFolder: Action = {
		key: "move",
		icon: "folderInput",
		label: t("app.library.move_to_folder"),
		run: () =>
			folderPicker.open({
				current: item.folderId,
				onPick: (folderId) => {
					moveItem(item.id, folderId);
					toast(t("app.library.moved"));
				},
			}),
	};

	const code = item.kind === "code" ? describeItem(item) : null;
	const kind = code ? code.subtitle : t("app.library.document");
	const title = code ? code.title : item.kind === "doc" ? item.name : "";

	return (
		<View style={shared.screen}>
			<StatusBar />
			<Header
				backIcon="close"
				center={
					<Text size={12} mono color={colors.muted}>
						No. {catalogueNumber(item)}
					</Text>
				}
				right={
					<Pressable
						accessibilityRole="link"
						onPress={toCollection}
						style={styles.collection}
					>
						<Text size={15} weight="medium" color={colors.muted}>
							{t("app.library.title")}
						</Text>
					</Pressable>
				}
			/>
			<ScrollView
				key={replay}
				contentContainerStyle={edges.content}
				showsVerticalScrollIndicator={false}
			>
				<Stage
					item={item}
					replay={replay}
					onReplay={() => setReplay((count) => count + 1)}
				/>

				<View style={styles.titles}>
					<Animated.View entering={enter.up(1250, 600)}>
						<Text size={12} mono color={colors.accent}>
							{t("app.capture.saved", { kind: kind.toUpperCase() })}
						</Text>
					</Animated.View>
					<Animated.View entering={enter.up(1350, 600)}>
						<Text
							size={item.kind === "doc" ? 30 : 34}
							weight="semibold"
							tracking={-0.025}
							numberOfLines={3}
							selectable
						>
							{title}
						</Text>
					</Animated.View>
				</View>

				<Animated.View entering={enter.up(1450, 600)} style={styles.details}>
					{code ? (
						<CodeFields parsed={code.parsed} omit={title} max={3} />
					) : (
						item.kind === "doc" && (
							<DetailRows
								rows={[
									[t("app.document.pages_label"), String(item.pages.length)],
									[t("app.document.format"), item.pdfUri ? "PDF" : "JPG"],
								]}
							/>
						)
					)}
				</Animated.View>

				<Animated.View entering={enter.up(1600, 600)} style={styles.actions}>
					{item.kind === "code" && code ? (
						<CodeActions
							code={code}
							data={item.data}
							extra={[
								moveToFolder,
								{
									key: "details",
									icon: "eye",
									label: t("app.code.view"),
									run: () =>
										router.replace({
											pathname: "/code/[id]",
											params: { id: item.id },
										}),
								},
							]}
						/>
					) : (
						item.kind === "doc" && (
							<>
								<Button
									icon="share"
									label={t(
										item.pdfUri ? "app.document.share_pdf" : "app.common.share",
									)}
									onPress={() => shareItem(item).catch(console.error)}
								/>
								<ButtonGrid>
									<Button
										variant="secondary"
										icon="download"
										label={t("app.document.save_to_files")}
										onPress={async () => {
											const result = await attempt(() => exportDocument(item));
											if (result.ok) toast(t("app.document.saved"));
										}}
										style={gridCell}
									/>
									<Button
										variant="secondary"
										icon="pencil"
										label={t("app.common.rename")}
										onPress={() => actions.renameItem(item)}
										style={gridCell}
									/>
									<Button
										variant="secondary"
										icon="folderInput"
										label={moveToFolder.label}
										onPress={moveToFolder.run}
										style={gridCell}
									/>
									<Button
										variant="secondary"
										icon="eye"
										label={t("app.code.view")}
										onPress={() =>
											router.replace({
												pathname: "/document/[id]",
												params: { id: item.id },
											})
										}
										style={gridCell}
									/>
								</ButtonGrid>
							</>
						)
					)}
				</Animated.View>
			</ScrollView>
			{actions.element}
			{folderPicker.element}
		</View>
	);
}

const useStyles = makeStyles(() => ({
	collection: {
		height: 46,
		paddingHorizontal: 4,
		justifyContent: "center",
	},
	stage: { alignItems: "center", justifyContent: "flex-end" },
	floor: { position: "absolute", bottom: 10, alignItems: "center" },
	shadow: { position: "absolute", bottom: 40 - 24, alignItems: "center" },
	titles: { paddingHorizontal: 20, gap: 6 },
	details: { marginTop: 16, marginHorizontal: 16 },
	actions: { padding: 16, paddingTop: 16, gap: 10 },
}));
