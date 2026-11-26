import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { Icon } from "@/components/ui/Icon";
import { TextField } from "@/components/ui/TextField";
import { HEADER_ROW, makeStyles, useSharedStyles, useTheme } from "@/theme";
import { enter } from "@/theme/motion";

/** The search box that replaces the header's back button while searching. */
export function SearchField({
	value,
	onChange,
}: {
	value: string;
	onChange: (value: string) => void;
}) {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	return (
		<Animated.View entering={enter.fade()} style={shared.flex}>
			<View style={[shared.row, styles.field]}>
				<Icon name="search" size={18} color={colors.muted} />
				<TextField
					value={value}
					onChangeText={onChange}
					placeholder={t("app.library.search")}
					autoFocus
					returnKeyType="search"
					autoCorrect={false}
					style={styles.input}
				/>
			</View>
		</Animated.View>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	field: {
		height: HEADER_ROW,
		paddingLeft: 16,
		gap: 8,
		borderRadius: HEADER_ROW / 2,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
	},
	input: {
		flex: 1,
		minHeight: 0,
		height: HEADER_ROW - 2,
		paddingHorizontal: 0,
		paddingRight: 16,
		borderWidth: 0,
		backgroundColor: "transparent",
	},
}));
