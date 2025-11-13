import { Colors } from "@/constants/Colors";
import { Spacings } from "@/constants/Spacings";
import useApp from "@/stores/appStore";
import { Orientation } from "expo-screen-orientation";
import { ZoomIn, ZoomOut } from "lucide-react-native";
import { View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	type SharedValue,
	useAnimatedStyle,
} from "react-native-reanimated";

interface ZoomSliderProps {
	offset: SharedValue<number>;
}

export function ZoomSlider({ offset }: ZoomSliderProps) {
	const isPortraitOrientation = useApp(
		(state) =>
			state.orientation ===
			(Orientation.PORTRAIT_UP ||
				state.orientation === Orientation.PORTRAIT_DOWN),
	);
	const { height, width } = useWindowDimensions();
	const MAX_VALUE =
		width -
		Spacings.lg * 6 -
		Spacings.md * 2 -
		(isPortraitOrientation ? 0 : 80);
	const THUMB_RADIUS = Spacings.md;
	const sliderPanGesture = Gesture.Pan().onChange((event) => {
		offset.value = Math.max(
			0,
			Math.min(MAX_VALUE, offset.value + event.changeX),
		);
	});

	const rangeStyle = useAnimatedStyle(() => {
		return {
			width: `${(offset.value / MAX_VALUE) * 100}%`,
		};
	});

	const thumbStyle = useAnimatedStyle(() => {
		return {
			left: `${((offset.value - THUMB_RADIUS) / MAX_VALUE) * 100}%`,
		};
	});

	return (
		<View
			style={{
				// position: "absolute",
				// left: Spacings.lg + Spacings.md,
				// right: Spacings.lg + Spacings.md,
				// bottom: Spacings.xl,
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
			}}
		>
			<ZoomOut
				color={Colors.white}
				size={Spacings.md}
				style={{
					marginRight: Spacings.md,
				}}
			/>
			<View
				style={{
					height: 4,
					width: MAX_VALUE,
				}}
			>
				<View
					style={{
						height: "100%",
						backgroundColor: "rgba(255,255,255,0.5)",
						borderRadius: 8,
					}}
				>
					<Animated.View
						style={[
							{
								// width: `${zoom}%`,
								backgroundColor: Colors.primary,
								height: "100%",
							},
							rangeStyle,
						]}
					/>
					<GestureDetector gesture={sliderPanGesture}>
						<Animated.View
							style={[
								{
									width: 32,
									height: 32,
									borderRadius: 16,
									bottom: 18,
									// backgroundColor: "red",
									alignItems: "center",
									justifyContent: "center",
								},
								thumbStyle,
							]}
						>
							<View
								style={{
									width: 16,
									height: 16,
									borderRadius: 8,
									borderColor: Colors.primary,
									borderWidth: 2,
									backgroundColor: Colors.white,
								}}
							/>
						</Animated.View>
					</GestureDetector>
				</View>
			</View>
			<ZoomIn
				color={Colors.white}
				size={Spacings.md}
				style={{
					marginLeft: Spacings.md,
				}}
			/>
		</View>
	);
}
