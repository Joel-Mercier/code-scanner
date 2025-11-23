import { Button } from "@/components/ui/Button";
import { ThemedText } from "@/components/ui/ThemedText";
import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import useDocuments from "@/stores/documents";
import { formatDistanceToNow } from "@/utils/date";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useForm } from "@tanstack/react-form";
import { File } from "expo-file-system";
import {
	EncodingType,
	StorageAccessFramework,
	writeAsStringAsync,
} from "expo-file-system/legacy";
import { Check, Download, Pencil, Share2, Trash, X } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import Share from "react-native-share";
import * as z from "zod";

const editDocumentFormSchema = z.object({
	name: z.string().trim().min(1).max(100),
});

type ScannerResultProps = {
	bottomSheetModalRef: React.RefObject<BottomSheetModal | null>;
};

export function DocumentBottomSheetContent({
	bottomSheetModalRef,
}: ScannerResultProps) {
	const [editMode, setEditMode] = useState(false);
	const { t } = useTranslation();
	const currentDocument = useDocuments.use.currentDocument();
	const renameDocument = useDocuments.use.renameDocument();
	const deleteDocument = useDocuments.use.deleteDocument();
	const form = useForm({
		defaultValues: {
			name: currentDocument?.name,
		},
		validators: {
			onBlur: editDocumentFormSchema,
		},
		onSubmit: ({ value }) => {
			if (!currentDocument) return;
			renameDocument(currentDocument?.id, value.name || currentDocument?.name);
			setEditMode(false);
		},
	});

	const handleClosePress = () => {
		bottomSheetModalRef.current?.close();
	};

	const handleSharePress = async () => {
		try {
			await Share.open({
				url: currentDocument?.pdf?.uri,
				type: "application/pdf",
				failOnCancel: false,
			});
		} catch (error) {
			console.error(error);
		}
	};

	const handleSavePress = async () => {
		if (currentDocument?.pdf?.uri) {
			try {
				const permissions =
					await StorageAccessFramework.requestDirectoryPermissionsAsync();
				if (!permissions.granted) {
					console.error(
						"Permission to access the selected directory not granted",
					);
					return;
				}

				const directoryUri = permissions.directoryUri;
				const file = new File(currentDocument?.pdf?.uri);
				const fileHandle = file.open();
				fileHandle.readBytes(file.size);
				const base64 = file.base64Sync();
				const newFileUri = await StorageAccessFramework.createFileAsync(
					directoryUri,
					currentDocument?.name,
					file.type,
				);
				await writeAsStringAsync(newFileUri, base64, {
					encoding: EncodingType.Base64,
				});
				console.log("Document saved to:", newFileUri);
			} catch (error) {
				console.error(error);
			}
		}
	};

	const handleDeletePress = () => {
		if (!currentDocument) return;
		deleteDocument(currentDocument?.id);
	};

	return (
		<View style={{ marginTop: Spacings.lg, marginBottom: Spacings.xl }}>
			<View style={{ paddingHorizontal: Spacings.md }}>
				<View style={styles.headerContainer}>
					<View style={{ flexDirection: "row", alignItems: "center" }}>
						<View style={styles.badge}>
							<ThemedText
								numberOfLines={1}
								variant="default"
								style={{ color: Colors.primary }}
							>
								PDF
							</ThemedText>
						</View>
						<ThemedText
							numberOfLines={1}
							variant="default"
							style={{ color: Colors.mutedText, fontSize: 14 }}
						>
							{currentDocument &&
								`${t("app.document.scannedAt")} ${t("app.shared.timeAgo", {
									time: formatDistanceToNow(currentDocument.createdAt),
								})}`}
						</ThemedText>
					</View>
					<Pressable style={styles.closeButton} onPress={handleClosePress}>
						<X size={24} color="white" />
					</Pressable>
				</View>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
						marginBottom: Spacings.sm,
						gap: Spacings.md,
					}}
				>
					{editMode ? (
						<>
							<form.Field name="name">
								{(field) => (
									<View style={styles.fieldContainer}>
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value}
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												autoFocus
												autoCapitalize="none"
												placeholder={t(
													"app.new_code.qr_code_form.url.placeholder",
												)}
												style={styles.textInput}
												textContentType="URL"
											/>
										</View>
										{!field.state.meta.isValid && (
											<ThemedText
												style={styles.errorText}
												variant="small"
												role="alert"
											>
												{field.state.meta.errors
													.map((error) => error?.message)
													.join(", ")}
											</ThemedText>
										)}
									</View>
								)}
							</form.Field>
							<Pressable
								style={styles.closeButton}
								onPress={() => form.handleSubmit()}
							>
								<Check size={18} color={Colors.white} />
							</Pressable>
						</>
					) : (
						<>
							<ThemedText variant="title" numberOfLines={2}>
								{currentDocument?.name}
							</ThemedText>
							<Pressable
								style={styles.closeButton}
								onPress={() => setEditMode(!editMode)}
							>
								<Pencil size={18} color={Colors.white} />
							</Pressable>
						</>
					)}
				</View>
				{currentDocument?.pdf?.uri && (
					<>
						<Button
							buttonColor={Colors.primary}
							textColor={Colors.white}
							onPress={handleSharePress}
							title={t("app.document.share")}
							reduceMotion="system"
							style={{
								marginVertical: Spacings.md,
							}}
							Icon={<Share2 size={18} color={Colors.white} />}
						/>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "center",
								marginBottom: Spacings.xl,
								gap: Spacings.md,
							}}
						>
							<Pressable
								onPress={handleSavePress}
								style={styles.buttonContainer}
							>
								<Download size={18} color={Colors.white} />
								<ThemedText style={{ marginLeft: Spacings.sm }}>
									{t("app.document.save")}
								</ThemedText>
							</Pressable>
							<Pressable
								onPress={handleDeletePress}
								style={[
									styles.buttonContainer,
									{ backgroundColor: `${Colors.error}33` },
								]}
							>
								<Trash size={18} color={Colors.error} />
								<ThemedText
									style={{ marginLeft: Spacings.sm, color: Colors.error }}
								>
									{t("app.document.delete")}
								</ThemedText>
							</Pressable>
						</View>
					</>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	headerContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: Spacings.lg,
	},
	closeButton: {
		width: Spacings.xl,
		height: Spacings.xl,
		borderRadius: Spacings.lg,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: Colors.backgroundAccentLight,
	},
	badge: {
		borderRadius: Spacings.sm,
		paddingHorizontal: Spacings.md,
		paddingVertical: Spacings.xs,
		backgroundColor: `${Colors.primary}33`,
		marginRight: Spacings.md,
	},
	buttonContainer: {
		paddingHorizontal: Spacings.md,
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: Spacings.md,
		marginBottom: Spacings.sm,
		backgroundColor: Colors.backgroundAccentLight,
		borderRadius: Spacings.sm,
	},
	horizontalStack: {
		flexDirection: "row",
		alignItems: "center",
	},
	fieldContainer: {
		paddingVertical: Spacings.md,
		flexGrow: 1,
	},
	fieldLabel: {
		marginBottom: Spacings.md,
		fontFamily: "Inter_700Bold",
		fontSize: 14,
	},
	textInputContainer: {},
	textInput: {
		borderWidth: 1,
		borderColor: Colors.backgroundAccent,
		backgroundColor: Colors.backgroundAccent,
		padding: Spacings.sm,
		paddingHorizontal: Spacings.md,
		color: Colors.white,
		borderRadius: Spacings.md,
		fontSize: 16,
		fontFamily: "Inter_400Regular",
	},
	errorText: {
		color: Colors.error,
		marginVertical: Spacings.sm,
	},
});
