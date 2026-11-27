import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import Animated from "react-native-reanimated";
import { type Action, CodeActions } from "@/components/codes/CodeActions";
import { CodeFields } from "@/components/codes/CodeFields";
import {
	saveDocumentToFiles,
	shareDocument,
} from "@/components/documents/actions";
import { useMoveToFolder } from "@/components/library/FolderPicker";
import { itemHref } from "@/components/library/hrefs";
import { useLibraryActions } from "@/components/library/useLibraryActions";
import { useModalGuard } from "@/components/lock/hooks";
import { Button, ButtonGrid, gridCell } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { DetailRows } from "@/components/ui/List";
import { Pressable } from "@/components/ui/Pressable";
import { StatusBar } from "@/components/ui/StatusBar";
import { Text } from "@/components/ui/Text";
import { describeItem } from "@/domain/codes/describe";
import { catalogueNumber } from "@/domain/library/items";
import useLibrary from "@/stores/library";
import {
	makeStyles,
	useScreenInsets,
	useSharedStyles,
	useTheme,
} from "@/theme";
import { enter } from "@/theme/motion";
import { CaptureStage } from "./components/CaptureStage";

/** A fresh capture, spinning in, with what can be done with it right away. */
export function CaptureScreen({ id }: { id: string }) {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const router = useRouter();
	const edges = useScreenInsets();
	const item = useLibrary((state) => state.items[id]);
	const [replay, setReplay] = useState(0);
	const actions = useLibraryActions({ onDeleted: () => router.back() });
	const mover = useMoveToFolder();
	// A native modal sits above the lock: it hides itself.
	const hidden = useModalGuard();

	if (hidden) return <View style={shared.screen} />;

	if (!item) {
		return (
			<View style={shared.screen}>
				<Header backIcon="close" />
				{actions.element}
			</View>
		);
	}

	const moveToFolder: Action = {
		key: "move",
		icon: "folderInput",
		label: t("app.library.move_to_folder"),
		run: () => mover.open(item),
	};
	const viewDetails: Action = {
		key: "details",
		icon: "eye",
		label: t("app.code.view"),
		run: () => router.replace(itemHref(item)),
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
						onPress={() => router.replace("/library")}
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
				<CaptureStage
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
						<CodeFields code={code} omit={title} max={3} />
					) : (
						item.kind === "doc" && (
							<DetailRows
								rows={[
									[t("app.document.pages_label"), String(item.pages.length)],
									[t("app.document.format"), item.pdf ? "PDF" : "JPG"],
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
							extra={[moveToFolder, viewDetails]}
							compact
						/>
					) : (
						item.kind === "doc" && (
							<>
								<Button
									icon="share"
									label={t("app.document.share_pdf")}
									onPress={() => shareDocument(item)}
								/>
								<ButtonGrid>
									<Button
										variant="secondary"
										icon="download"
										label={t("app.document.save_to_files")}
										onPress={() => saveDocumentToFiles(item)}
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
										icon={moveToFolder.icon}
										label={moveToFolder.label}
										onPress={moveToFolder.run}
										style={gridCell}
									/>
									<Button
										variant="secondary"
										icon={viewDetails.icon}
										label={viewDetails.label}
										onPress={viewDetails.run}
										style={gridCell}
									/>
								</ButtonGrid>
							</>
						)
					)}
				</Animated.View>
			</ScrollView>
			{actions.element}
			{mover.element}
		</View>
	);
}

const useStyles = makeStyles(() => ({
	collection: {
		height: 46,
		paddingHorizontal: 4,
		justifyContent: "center",
	},
	titles: { paddingHorizontal: 20, gap: 6 },
	details: { marginTop: 16, marginHorizontal: 16 },
	actions: { padding: 16, paddingTop: 16, gap: 10 },
}));
