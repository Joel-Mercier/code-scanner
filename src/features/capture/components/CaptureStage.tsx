import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { CodeObject } from "@/components/codes/CodeObject";
import { useCaptureSpin } from "@/components/codes/motion";
import { DocObject } from "@/components/documents/DocObject";
import { FloorShadow } from "@/components/ui/FloorShadow";
import { Pressable } from "@/components/ui/Pressable";
import type { LibraryItem } from "@/domain/library/types";
import { makeStyles } from "@/theme";
import { LandingRing } from "./LandingRing";

/** The object lands, spinning, on a ring of light (`.c-*`). Tap to replay. */
export function CaptureStage({
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

const useStyles = makeStyles(() => ({
	stage: { alignItems: "center", justifyContent: "flex-end" },
	floor: { position: "absolute", bottom: 10, alignItems: "center" },
	shadow: { position: "absolute", bottom: 40 - 24, alignItems: "center" },
}));
