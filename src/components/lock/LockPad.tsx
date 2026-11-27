import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { Button } from "@/components/ui/Button";
import { Pressable } from "@/components/ui/Pressable";
import { Text } from "@/components/ui/Text";
import { TextField } from "@/components/ui/TextField";
import { toast } from "@/components/ui/Toast";
import {
	isCompleteRecoveryCode,
	RECOVERY_LENGTH,
} from "@/domain/security/recovery";
import { secondsLeft } from "@/domain/security/throttle";
import { TOTP_DIGITS } from "@/domain/security/totp";
import { attempt } from "@/lib/attempt";
import { haptics } from "@/lib/haptics";
import {
	checkPassword,
	checkRecoveryCode,
	checkTotp,
	hasRecoveryCode,
} from "@/services/lock";
import useLockSession from "@/stores/lockSession";
import { makeStyles, useTheme } from "@/theme";
import { enter } from "@/theme/motion";
import { useDeviceAuth } from "./hooks";
import { forgetSecrets, promptDevice } from "./unlock";

type LockPadProps = {
	method: "password" | "totp";
	onUnlocked: () => void;
	onCancel?: () => void;
};

/** "1:05" / "0:30" */
const clock = (seconds: number) =>
	`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/** Seconds left before guessing may resume, ticking down. */
function useWait() {
	const blockedUntil = useLockSession((state) => state.blockedUntil);
	const [now, setNow] = useState(Date.now());
	const left = secondsLeft(blockedUntil, now);
	useEffect(() => {
		if (left === 0) return;
		const timer = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(timer);
	}, [left]);
	return { left, refresh: () => setNow(Date.now()) };
}

/** Whether a recovery code is kept, once known. */
function useHasRecoveryCode() {
	const [has, setHas] = useState<boolean | null>(null);
	useEffect(() => {
		let live = true;
		attempt(hasRecoveryCode).then(
			(result) => live && setHas(result.ok && result.value),
		);
		return () => {
			live = false;
		};
	}, []);
	return has;
}

/**
 * Types the app's password or an authenticator code. Wrong guesses count:
 * after a few, each one makes the next wait longer. "Forgot it?" opens the
 * other ways in: the phone's own lock and the recovery code given at setup.
 * Either one drops the forgotten password or authenticator, to be set anew.
 */
export function LockPad({ method, onUnlocked, onCancel }: LockPadProps) {
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const device = useDeviceAuth();
	const hasRecovery = useHasRecoveryCode();
	const failed = useLockSession((state) => state.failed);
	const succeeded = useLockSession((state) => state.succeeded);
	const wait = useWait();
	const [recovering, setRecovering] = useState(false);
	const [value, setValue] = useState("");
	const [wrong, setWrong] = useState(false);
	const [checking, setChecking] = useState(false);
	const totp = method === "totp";
	const blocked = wait.left > 0;
	const hasDevice = device !== null && device !== "none";
	const deviceName = t(`app.lock.device.${device ?? "passcode"}`);

	const check = async (typed: string) => {
		if (recovering) return checkRecoveryCode(typed);
		return totp ? checkTotp(typed) : checkPassword(typed);
	};

	/** In by the other way: the forgotten secret goes, a new one is due. */
	const recovered = async () => {
		const phoneLocks = await forgetSecrets();
		succeeded();
		onUnlocked();
		toast(
			phoneLocks
				? t("app.lock.recovered", { method: deviceName })
				: t("app.lock.recovered_open"),
		);
	};

	const submit = async (typed = value) => {
		if (checking || blocked || !typed) return;
		setChecking(true);
		const result = await attempt(() => check(typed));
		setChecking(false);
		// Couldn't check at all (not a wrong guess): don't count it.
		if (!result.ok) {
			haptics.warning();
			toast(t("app.common.something_went_wrong"), "warning");
			return;
		}
		if (result.value) {
			haptics.success();
			if (recovering) await recovered();
			else {
				succeeded();
				onUnlocked();
			}
			return;
		}
		haptics.warning();
		failed(Date.now());
		wait.refresh();
		setWrong(true);
		setValue("");
	};

	const unlockWithDevice = async () => {
		if (await promptDevice(t("app.lock.prompt_forgot"))) await recovered();
	};

	const switchTo = (next: boolean) => {
		setRecovering(next);
		setValue("");
		setWrong(false);
	};

	const link = (label: string, onPress: () => void, color = colors.accent) => (
		<Pressable accessibilityRole="button" onPress={onPress} style={styles.link}>
			<Text size={14} weight="medium" color={color}>
				{label}
			</Text>
		</Pressable>
	);

	const cancel =
		onCancel && link(t("app.common.cancel"), onCancel, colors.muted);

	if (recovering) {
		const status = blocked
			? t("app.lock.wait", { time: clock(wait.left) })
			: wrong
				? t("app.lock.wrong_recovery")
				: t(totp ? "app.lock.recover_hint_totp" : "app.lock.recover_hint");
		return (
			<Animated.View key="recover" entering={enter.up(40)} style={styles.pad}>
				<Text
					size={14}
					leading={1.45}
					align="center"
					color={wrong || blocked ? colors.danger : colors.muted}
					accessibilityLiveRegion="polite"
				>
					{status}
				</Text>
				{hasDevice && (
					<Button
						variant="secondary"
						icon="fingerprint"
						label={t("app.lock.use_method", { method: deviceName })}
						onPress={unlockWithDevice}
					/>
				)}
				{hasRecovery && (
					<>
						<TextField
							value={value}
							onChangeText={(next) => {
								setValue(next.toUpperCase());
								setWrong(false);
							}}
							editable={!blocked && !checking}
							autoFocus={!hasDevice}
							autoCapitalize="characters"
							autoCorrect={false}
							autoComplete="off"
							maxLength={RECOVERY_LENGTH + 6}
							placeholder={t("app.lock.recovery_placeholder")}
							accessibilityLabel={t("app.lock.recovery_placeholder")}
							returnKeyType="done"
							onSubmitEditing={() => submit()}
							invalid={wrong}
							style={styles.recovery}
						/>
						<Button
							icon="key"
							label={t(
								checking ? "app.lock.checking" : "app.lock.use_recovery",
							)}
							disabled={!isCompleteRecoveryCode(value) || blocked || checking}
							onPress={() => submit()}
						/>
					</>
				)}
				{!hasDevice && hasRecovery === false && (
					<Text size={14} leading={1.5} align="center" color={colors.body}>
						{t("app.lock.no_way_back")}
					</Text>
				)}
				<View style={styles.links}>
					{link(
						t(totp ? "app.lock.back_to_code" : "app.lock.back_to_password"),
						() => switchTo(false),
					)}
					{cancel}
				</View>
			</Animated.View>
		);
	}

	const status = blocked
		? t("app.lock.wait", { time: clock(wait.left) })
		: wrong
			? t(totp ? "app.lock.wrong_code" : "app.lock.wrong_password")
			: t(totp ? "app.lock.code_hint" : "app.lock.password_hint");

	return (
		<Animated.View key="secret" entering={enter.up(80)} style={styles.pad}>
			<Text
				size={14}
				leading={1.45}
				align="center"
				color={wrong || blocked ? colors.danger : colors.muted}
				accessibilityLiveRegion="polite"
			>
				{status}
			</Text>
			<TextField
				value={value}
				onChangeText={(next) => {
					const clean = totp ? next.replace(/\D/g, "") : next;
					setValue(clean);
					setWrong(false);
					// A whole code goes off by itself.
					if (totp && clean.length === TOTP_DIGITS) submit(clean);
				}}
				editable={!blocked && !checking}
				autoFocus
				secureTextEntry={!totp}
				keyboardType={totp ? "number-pad" : "default"}
				textContentType={totp ? "oneTimeCode" : "password"}
				autoComplete={totp ? "one-time-code" : "current-password"}
				autoCapitalize="none"
				autoCorrect={false}
				maxLength={totp ? TOTP_DIGITS : 128}
				placeholder={t(
					totp ? "app.lock.code_placeholder" : "app.lock.password_placeholder",
				)}
				accessibilityLabel={t(
					totp ? "app.lock.code_placeholder" : "app.lock.password_placeholder",
				)}
				returnKeyType="done"
				onSubmitEditing={() => submit()}
				invalid={wrong}
				style={totp && styles.code}
			/>
			<Button
				icon="lock"
				label={t(checking ? "app.lock.checking" : "app.lock.unlock")}
				disabled={!value || blocked || checking}
				onPress={() => submit()}
			/>
			<View style={styles.links}>
				{link(t("app.lock.forgot"), () => switchTo(true))}
				{cancel}
			</View>
		</Animated.View>
	);
}

const useStyles = makeStyles(() => ({
	pad: { gap: 14, alignSelf: "stretch" },
	code: {
		textAlign: "center",
		fontSize: 26,
		letterSpacing: 8,
		fontVariant: ["tabular-nums"],
	},
	recovery: {
		textAlign: "center",
		fontSize: 19,
		letterSpacing: 2,
		fontVariant: ["tabular-nums"],
	},
	links: { alignItems: "center", gap: 2, marginTop: 2 },
	link: { paddingVertical: 10, paddingHorizontal: 16 },
}));
