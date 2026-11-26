import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { Header } from "@/components/ui/Header";
import { Icon } from "@/components/ui/Icon";
import { Pressable } from "@/components/ui/Pressable";
import { StatusBar } from "@/components/ui/StatusBar";
import { LargeTitle, Text } from "@/components/ui/Text";
import {
	makeStyles,
	useScreenInsets,
	useSharedStyles,
	useTheme,
} from "@/theme";
import { ease, enter } from "@/theme/motion";
import { haptics } from "@/utils/haptics";

export { ErrorScreen as ErrorBoundary } from "@/components/ui/ErrorScreen";

type Question = { q: string; a: string };

function Answer({ open, text }: { open: boolean; text: string }) {
	const { colors } = useTheme();
	const styles = useStyles();
	const [height, setHeight] = useState(0);
	const progress = useSharedValue(open ? 1 : 0);

	useEffect(() => {
		progress.set(withTiming(open ? 1 : 0, ease));
	}, [open, progress]);

	const style = useAnimatedStyle(() => ({
		height: height * progress.get(),
		opacity: progress.get(),
	}));

	return (
		<Animated.View style={[styles.answer, style]}>
			<View
				style={styles.measure}
				onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
			>
				<Text
					size={15}
					leading={1.5}
					color={colors.body}
					style={styles.answerText}
				>
					{text}
				</Text>
			</View>
		</Animated.View>
	);
}

function Chevron({ open }: { open: boolean }) {
	const { colors } = useTheme();
	const turn = useSharedValue(open ? 1 : 0);
	useEffect(() => {
		turn.set(withTiming(open ? 1 : 0, ease));
	}, [open, turn]);
	const style = useAnimatedStyle(() => ({
		transform: [{ rotate: `${turn.get() * 180}deg` }],
	}));
	return (
		<Animated.View style={style}>
			<Icon name="chevronDown" size={18} color={colors.muted} />
		</Animated.View>
	);
}

export default function HelpScreen() {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const edges = useScreenInsets();
	const [open, setOpen] = useState(0);
	const questions = t("app.help.items", { returnObjects: true }) as Question[];

	return (
		<View style={shared.screen}>
			<StatusBar />
			<Header />
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={edges.content}
			>
				<Animated.View entering={enter.up()} style={shared.titleBlock}>
					<LargeTitle>{t("app.help.title")}</LargeTitle>
				</Animated.View>
				<Animated.View
					entering={enter.up(60)}
					style={[shared.card, styles.card]}
				>
					{questions.map((question, index) => {
						const expanded = open === index;
						return (
							<View
								key={question.q}
								style={index < questions.length - 1 && shared.divider}
							>
								<Pressable
									accessibilityRole="button"
									accessibilityState={{ expanded }}
									pressedScale={0.99}
									onPress={() => {
										haptics.select();
										setOpen(expanded ? -1 : index);
									}}
									style={styles.question}
								>
									<Text
										size={11}
										mono
										color={colors.muted}
										style={styles.number}
									>
										{String(index + 1).padStart(2, "0")}
									</Text>
									<Text
										size={16}
										weight="medium"
										leading={1.35}
										style={shared.flex}
									>
										{question.q}
									</Text>
									<Chevron open={expanded} />
								</Pressable>
								<Answer open={expanded} text={question.a} />
							</View>
						);
					})}
				</Animated.View>
			</ScrollView>
		</View>
	);
}

const useStyles = makeStyles(() => ({
	card: { marginTop: 22, marginHorizontal: 16, paddingHorizontal: 18 },
	question: {
		minHeight: 64,
		paddingVertical: 14,
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
	},
	number: { width: 18 },
	answer: { overflow: "hidden" },
	measure: { position: "absolute", left: 0, right: 0, top: 0 },
	answerText: { paddingLeft: 32, paddingBottom: 18 },
}));
