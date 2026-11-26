import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { CodeObject } from "@/components/codes/CodeObject";
import { useTurnAndTilt } from "@/components/codes/motion";
import { FloorShadow } from "@/components/ui/FloorShadow";
import { Pressable } from "@/components/ui/Pressable";
import type { CodeItem } from "@/domain/library/types";
import { haptics } from "@/lib/haptics";
import useSettings from "@/stores/settings";
import { makeStyles } from "@/theme";
import { enter } from "@/theme/motion";

/** The code on its tile, gently tilting; a tap gives it a full turn. */
export function CodeStage({ item }: { item: CodeItem }) {
	const styles = useStyles();
	const { t } = useTranslation();
	const [turns, setTurns] = useState(0);
	const { rotateX, rotateY } = useTurnAndTilt(turns);
	// With 3D off the code sits flat, so there is nothing to turn.
	const motion3d = useSettings((state) => state.motion3d);
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

const useStyles = makeStyles(() => ({
	stage: { height: 290, alignItems: "center", justifyContent: "center" },
	shadow: { position: "absolute", bottom: 14 - 24, alignItems: "center" },
}));
