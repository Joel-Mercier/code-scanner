import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState, BackHandler, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppMark } from "@/components/ui/AppMark";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import useLockSession from "@/stores/lockSession";
import useSettings from "@/stores/settings";
import { makeStyles } from "@/theme";
import { enter, exit } from "@/theme/motion";
import { useActiveMethod, useMethodLabel } from "./hooks";
import { LockPad } from "./LockPad";
import { finishRequest, promptDevice, useLockUi } from "./unlock";

/**
 * Follows the app in and out of the background: it notes when it left, and
 * on its return locks the app and the items again if it was away too long.
 * While it is in the app switcher, a cover hides what is on screen.
 */
function useAppStateLock() {
	const appLock = useSettings((state) => state.appLock);
	const itemsUnlocked = useLockSession((state) => state.itemsUnlocked);
	const authenticating = useLockUi((state) => state.authenticating);
	const [active, setActive] = useState(AppState.currentState === "active");
	// Counts returns from the background (not from the system prompt, which
	// only makes the app inactive on iOS), so the lock asks once per return.
	const [returns, setReturns] = useState(0);

	useEffect(() => {
		let away = false;
		const subscription = AppState.addEventListener("change", (next) => {
			setActive(next === "active");
			const session = useLockSession.getState();
			// The system prompt can take the app to the background (Android's
			// passcode screen): coming back from it isn't coming back.
			if (useLockUi.getState().authenticating) return;
			if (next === "background") {
				away = true;
				session.wentToBackground(Date.now());
			} else if (next === "active") {
				session.cameToForeground(Date.now());
				if (away) setReturns((count) => count + 1);
				away = false;
			}
		});
		return () => subscription.remove();
	}, []);

	const covered = !active && !authenticating && (appLock || itemsUnlocked);
	useEffect(() => {
		useLockUi.setState({ covered });
	}, [covered]);
	return { active, covered, returns };
}

/** The app's own lock screen: the system prompt, or the password / code pad. */
function AppUnlock({ active, returns }: { active: boolean; returns: number }) {
	const styles = useStyles();
	const { t } = useTranslation();
	const method = useActiveMethod();
	const label = useMethodLabel();
	const unlockApp = useLockSession((state) => state.unlockApp);

	const prompt = async () => {
		if (await promptDevice(t("app.lock.prompt_app"))) unlockApp();
	};

	// Asks once the app is in front, then again on each return from the
	// background; turned down, it waits for a tap.
	const [asked, setAsked] = useState(-1);
	useEffect(() => {
		if (!active || method === null || asked === returns) return;
		setAsked(returns);
		if (method === "none") unlockApp();
		else if (method === "device") {
			promptDevice(t("app.lock.prompt_app")).then((ok) => ok && unlockApp());
		}
	}, [active, method, asked, returns, unlockApp, t]);

	return (
		<>
			<Text size={24} weight="semibold" tracking={-0.02} align="center">
				{t("app.lock.locked_title")}
			</Text>
			{method === "password" || method === "totp" ? (
				<LockPad method={method} onUnlocked={unlockApp} />
			) : (
				<Animated.View entering={enter.up(80)} style={styles.stretch}>
					<Button
						icon="lock"
						label={t("app.lock.unlock_with", { method: label(method) })}
						onPress={prompt}
					/>
				</Animated.View>
			)}
		</>
	);
}

/**
 * Over every screen (and every sheet): the app lock, the pad that answers
 * `unlockItems` / `confirmIdentity` when the method isn't the phone's own,
 * and the app-switcher cover. Render once, last, at the root.
 */
export function LockOverlay() {
	const styles = useStyles();
	const { t } = useTranslation();
	const insets = useSafeAreaInsets();
	const appLock = useSettings((state) => state.appLock);
	const appUnlocked = useLockSession((state) => state.appUnlocked);
	const request = useLockUi((state) => state.request);
	const { active, covered, returns } = useAppStateLock();
	const appLocked = appLock && !appUnlocked;
	const shown = appLocked || request !== null || covered;

	// Android's back button: nowhere to go while locked; it turns a pad down.
	useEffect(() => {
		if (!appLocked && !request) return;
		const subscription = BackHandler.addEventListener(
			"hardwareBackPress",
			() => {
				if (!appLocked) finishRequest(false);
				return true;
			},
		);
		return () => subscription.remove();
	}, [appLocked, request]);

	if (!shown) return null;

	const body = (() => {
		if (appLocked) return <AppUnlock active={active} returns={returns} />;
		if (request) {
			return (
				<>
					<Text size={24} weight="semibold" tracking={-0.02} align="center">
						{t(`app.lock.title_${request.purpose}`)}
					</Text>
					<LockPad
						method={request.method}
						onUnlocked={() => finishRequest(true)}
						onCancel={() => finishRequest(false)}
					/>
				</>
			);
		}
		return null;
	})();

	return (
		<Animated.View
			entering={covered ? undefined : enter.fade()}
			exiting={exit.fade()}
			style={[styles.overlay, { paddingTop: insets.top + 72 }]}
			accessibilityViewIsModal
		>
			<View style={styles.content}>
				<AppMark size={72} />
				{body}
			</View>
		</Animated.View>
	);
}

const useStyles = makeStyles(({ colors }) => ({
	overlay: {
		...StyleSheet.absoluteFill,
		zIndex: 100,
		backgroundColor: colors.canvas,
		alignItems: "center",
		paddingHorizontal: 28,
	},
	content: {
		width: "100%",
		maxWidth: 380,
		alignItems: "center",
		gap: 22,
	},
	stretch: { alignSelf: "stretch" },
}));
