import { ThemedText } from "@/components/ui/ThemedText";
import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import { useForm, useStore } from "@tanstack/react-form";
import { useRouter } from "expo-router";
import { ArrowLeft, Link, QrCode, Type, Wifi } from "lucide-react-native";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

type codeType = "url" | "text" | "wifi";
const types: { value: codeType; label: string }[] = [
	{ value: "url", label: "Lien" },
	{ value: "text", label: "Texte" },
	{ value: "wifi", label: "Wifi" },
];

const renderTypeIcon = (type: codeType) => {
	switch (type) {
		case "url":
			return <Link size={18} color="white" />;
		case "text":
			return <Type size={18} color="white" />;
		case "wifi":
			return <Wifi size={18} color="white" />;
		default:
			return <QrCode size={18} color="white" />;
	}
};

export default function NewCodeScreen() {
	const router = useRouter();
	const form = useForm({
		defaultValues: {
			text: "",
			url: "",
			type: "url",
			errorCorrectionLevel: "M",
			margin: 4,
			scale: 4,
			width: 300,
			ssid: "",
			password: "",
			hidden: false,
			encryption: "WPA",
		},
		onSubmit: async ({ value }) => {
			console.log(value);
		},
	});

	const type = useStore(form.store, (state) => state.values.type);
	console.log(type);
	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.headerContainer}>
				<Pressable onPress={() => router.back()} style={{ marginRight: 24 }}>
					<ArrowLeft size={24} color="white" />
				</Pressable>
				<ThemedText variant="title">Nouveau code QR</ThemedText>
				<View style={{ width: 24 }} />
			</View>
			<ScrollView>
				<View style={styles.fieldContainer}>
					<ThemedText style={styles.fieldLabel}>Type</ThemedText>
					<form.Field name="type">
						{(field) => (
							<View style={styles.typeButtonWrapper}>
								{types.map((type) => (
									<Pressable
										key={type.value}
										onPress={() => field.setValue(type.value)}
										style={[
											styles.typeButtonContainer,
											{
												backgroundColor:
													field.state.value === type.value
														? Colors.darkBackgroundPressed
														: "transparent",
											},
										]}
									>
										{renderTypeIcon(type.value)}
										<ThemedText>{type.label}</ThemedText>
									</Pressable>
								))}
							</View>
						)}
					</form.Field>
					{type === "url" && (
						<View style={styles.fieldContainer}>
							<ThemedText style={styles.fieldLabel}>Lien</ThemedText>
							<form.Field name="url">
								{(field) => (
									<View style={styles.textInputContainer}>
										<TextInput
											value={field.state.value}
											onBlur={field.handleBlur}
											onChangeText={field.handleChange}
											autoFocus
											placeholder="https://..."
											style={styles.textInput}
										/>
									</View>
								)}
							</form.Field>
						</View>
					)}
					{type === "text" && (
						<View style={styles.fieldContainer}>
							<ThemedText style={styles.fieldLabel}>Texte</ThemedText>
							<form.Field name="text">
								{(field) => (
									<View style={styles.textInputContainer}>
										<TextInput
											value={field.state.value}
											onBlur={field.handleBlur}
											onChangeText={field.handleChange}
											autoFocus
											placeholder="Mon texte"
											style={styles.textInput}
										/>
									</View>
								)}
							</form.Field>
						</View>
					)}
					{type === "wifi" && (
						<>
							<View style={styles.fieldContainer}>
								<ThemedText style={styles.fieldLabel}>SSID</ThemedText>
								<form.Field name="ssid">
									{(field) => (
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value}
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												autoFocus
												placeholder="Mon SSID"
												style={styles.textInput}
											/>
										</View>
									)}
								</form.Field>
							</View>
							<View style={styles.fieldContainer}>
								<ThemedText style={styles.fieldLabel}>Password</ThemedText>
								<form.Field name="password">
									{(field) => (
										<View style={styles.textInputContainer}>
											<TextInput
												value={field.state.value}
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												autoFocus
												placeholder="Mon mot de passe"
												style={styles.textInput}
											/>
										</View>
									)}
								</form.Field>
							</View>
						</>
					)}
					<Pressable
						onPress={form.handleSubmit}
						style={({ pressed }) => [
							pressed && { backgroundColor: Colors.darkBackgroundPressed },
							styles.submitButton,
						]}
					>
						<ThemedText>Générer</ThemedText>
					</Pressable>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingVertical: 24,
		paddingHorizontal: 24,
		backgroundColor: Colors.background,
	},
	headerContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: Spacings.lg,
	},
	fieldContainer: {
		paddingVertical: Spacings.md,
	},
	fieldLabel: {
		marginBottom: Spacings.md,
		fontFamily: "Inter_700Bold",
		fontSize: 14,
	},
	typeButtonWrapper: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: Spacings.md,
	},
	typeButtonContainer: {
		flex: 0.333,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 24,
		padding: Spacings.sm,
		gap: Spacings.sm,
	},
	submitButton: {
		marginVertical: Spacings.md,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 24,
		padding: Spacings.sm,
		backgroundColor: Colors.primary,
	},
	textInputContainer: {},
	textInput: {
		borderWidth: 1,
		borderColor: Colors.darkBackground,
		padding: Spacings.sm,
		color: Colors.white,
		fontSize: 16,
		fontFamily: "Inter_400Regular",
	},
});
