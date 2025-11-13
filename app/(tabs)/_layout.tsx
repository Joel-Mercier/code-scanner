import { Colors } from "@/constants/Colors";
import { Tabs } from "expo-router";
import {
	History,
	PlusSquare,
	QrCode,
	Scan,
	Settings,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

export default function TabsLayout() {
	const { t } = useTranslation();
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarStyle: {
					backgroundColor: Colors.darkBackground,
					borderTopWidth: 0,
				},
				tabBarLabelStyle: { fontFamily: "Inter_400Regular" },
				tabBarInactiveTintColor: Colors.white,
				tabBarActiveTintColor: Colors.primary,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: t("app.shared.tabs.home"),
					tabBarIcon: ({ focused, color }) => (
						<>
							<Scan color={color} size={24} />
							<QrCode
								color={color}
								size={16}
								style={{
									position: "absolute",
									top: "50%",
									transform: [{ translateY: "-50%" }],
								}}
							/>
						</>
					),
				}}
			/>
			<Tabs.Screen
				name="history"
				options={{
					title: t("app.shared.tabs.history"),
					tabBarIcon: ({ focused, color }) => (
						<History color={color} size={24} />
					),
				}}
			/>
			<Tabs.Screen
				name="new-code"
				options={{
					title: t("app.shared.tabs.new_code"),
					tabBarIcon: ({ focused, color }) => (
						<PlusSquare color={color} size={24} />
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: t("app.shared.tabs.settings"),
					tabBarIcon: ({ focused, color }) => (
						<Settings color={color} size={24} />
					),
				}}
			/>
		</Tabs>
	);
}
