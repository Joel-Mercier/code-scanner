import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { makeStyles, useTheme } from "@/theme";
import { enter } from "@/theme/motion";

/** Asks for the camera, over the feed. */
export function CameraPermission({
	top,
	onRequest,
}: {
	top: number;
	onRequest: () => void;
}) {
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	return (
		<Animated.View
			entering={enter.up(150)}
			style={[styles.permission, { top }]}
		>
			<View style={styles.icon}>
				<Icon name="camera" size={22} color={colors.glassInk} />
			</View>
			<Text
				size={22}
				weight="semibold"
				tracking={-0.02}
				color={colors.white}
				align="center"
			>
				{t("app.scan.camera_permission_title")}
			</Text>
			<Text
				size={15}
				leading={1.45}
				color="rgba(255,255,255,0.78)"
				align="center"
			>
				{t("app.scan.camera_permission_body")}
			</Text>
			<Button
				label={t("app.scan.allow_camera")}
				onPress={onRequest}
				style={styles.button}
			/>
		</Animated.View>
	);
}

const useStyles = makeStyles(() => ({
	permission: {
		position: "absolute",
		left: 28,
		right: 28,
		alignItems: "center",
		gap: 10,
	},
	icon: {
		width: 46,
		height: 46,
		borderRadius: 23,
		backgroundColor: "rgba(255,255,255,0.9)",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 6,
	},
	button: { alignSelf: "stretch", marginTop: 10 },
}));
