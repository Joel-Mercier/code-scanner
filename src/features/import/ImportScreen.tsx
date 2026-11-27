import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import Animated from "react-native-reanimated";
import { importPdf, importPhotos } from "@/components/documents/actions";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { Icon } from "@/components/ui/Icon";
import { StatusBar } from "@/components/ui/StatusBar";
import { LargeTitle, Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { nameFromFile } from "@/domain/library/documents";
import { haptics } from "@/lib/haptics";
import { findCodes } from "@/services/recognition";
import useLibrary from "@/stores/library";
import {
	makeStyles,
	radii,
	useScreenInsets,
	useSharedStyles,
	useTheme,
} from "@/theme";
import { enter, stagger } from "@/theme/motion";
import { type SharedFile, sortShared, toUri } from "./sharedFiles";

const THUMB = 96;

function Thumb({ file, index }: { file: SharedFile; index: number }) {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const pdf = file.mimeType === "application/pdf" || /\.pdf$/i.test(file.path);
	return (
		<Animated.View
			entering={enter.lift(stagger(index, 50))}
			style={[shared.floating, styles.thumb]}
		>
			{pdf ? (
				<View style={[shared.center, styles.pdf]}>
					<Icon name="file" size={28} color={colors.accent} />
					<Text
						size={10}
						mono
						color={colors.muted}
						numberOfLines={2}
						align="center"
					>
						{file.fileName ?? "PDF"}
					</Text>
				</View>
			) : (
				<Image
					source={toUri(file.path)}
					style={styles.image}
					contentFit="cover"
				/>
			)}
		</Animated.View>
	);
}

/**
 * What another app shared: photos can be searched for codes or saved as a
 * document, PDFs are saved as documents.
 */
export function ImportScreen() {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const router = useRouter();
	const edges = useScreenInsets();
	const { isReady, shareIntent, resetShareIntent } = useShareIntentContext();
	const addCode = useLibrary((state) => state.addCode);
	const [busy, setBusy] = useState(false);

	const files = (shareIntent.files ?? []) as SharedFile[];
	const { images, pdfs, unsupported } = sortShared(files);
	const usable = [...images, ...pdfs];

	const done = (href: Parameters<typeof router.replace>[0]) => {
		resetShareIntent();
		router.replace(href);
	};

	const findInImages = async () => {
		setBusy(true);
		const found = [];
		for (const image of images)
			found.push(...(await findCodes(toUri(image.path), { thorough: true })));
		setBusy(false);
		if (found.length === 0) {
			haptics.warning();
			toast(t("app.scan.no_code_in_image"), "warning");
			return;
		}
		const saved = found.map((code) => addCode({ source: "scanner", ...code }));
		haptics.success();
		if (saved.length === 1) {
			done({ pathname: "/capture/[id]", params: { id: saved[0].id } });
		} else {
			toast(t("app.import.codes_saved", { count: saved.length }));
			done("/library");
		}
	};

	const saveAsDocuments = async () => {
		setBusy(true);
		const ids: string[] = [];
		if (images.length > 0) {
			const id = await importPhotos(images.map((image) => toUri(image.path)));
			if (id) ids.push(id);
		}
		for (const pdf of pdfs) {
			const id = await importPdf(toUri(pdf.path), nameFromFile(pdf.fileName));
			if (id) ids.push(id);
		}
		setBusy(false);
		if (ids.length === 1) {
			done({ pathname: "/capture/[id]", params: { id: ids[0] } });
		} else if (ids.length > 1) {
			toast(t("app.import.documents_saved", { count: ids.length }));
			done("/library");
		}
	};

	const empty = isReady && usable.length === 0;

	return (
		<View style={shared.screen}>
			<StatusBar />
			<Header backIcon="close" onBack={() => done("/")} />
			<ScrollView
				contentContainerStyle={edges.content}
				showsVerticalScrollIndicator={false}
			>
				<Animated.View entering={enter.up()} style={styles.titles}>
					<LargeTitle>{t("app.import.title")}</LargeTitle>
					<Text size={14} leading={1.45} color={colors.muted}>
						{empty
							? t("app.import.nothing")
							: t("app.import.files", { count: usable.length })}
					</Text>
				</Animated.View>

				{usable.length > 0 && (
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.thumbs}
					>
						{usable.map((file, index) => (
							<Thumb key={file.path} file={file} index={index} />
						))}
					</ScrollView>
				)}

				{unsupported.length > 0 && (
					<Text size={13} color={colors.muted} style={styles.note}>
						{t("app.import.unsupported", { count: unsupported.length })}
					</Text>
				)}

				<Animated.View entering={enter.up(200)} style={styles.actions}>
					{images.length > 0 && (
						<Button
							icon="qr"
							label={t("app.import.find_codes")}
							disabled={busy}
							onPress={findInImages}
						/>
					)}
					{usable.length > 0 && (
						<Button
							variant={images.length > 0 ? "secondary" : "primary"}
							icon="document"
							label={t("app.import.save_documents", {
								count: (images.length > 0 ? 1 : 0) + pdfs.length,
							})}
							disabled={busy}
							onPress={saveAsDocuments}
						/>
					)}
					{empty && (
						<Button
							variant="secondary"
							label={t("app.error.home")}
							onPress={() => done("/")}
						/>
					)}
				</Animated.View>
			</ScrollView>
		</View>
	);
}

const useStyles = makeStyles(() => ({
	titles: { paddingHorizontal: 20, gap: 6 },
	thumbs: { gap: 12, paddingHorizontal: 20, paddingVertical: 20 },
	thumb: { width: THUMB, height: THUMB * 1.3, overflow: "hidden" },
	image: { flex: 1, borderRadius: radii.lg },
	pdf: { flex: 1, gap: 8, padding: 8 },
	note: { paddingHorizontal: 20 },
	actions: { paddingTop: 12, paddingHorizontal: 16, gap: 10 },
}));
