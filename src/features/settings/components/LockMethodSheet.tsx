import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as Clipboard from "expo-clipboard";
import { type RefObject, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AccessibilityInfo, Linking, View } from "react-native";
import { CodeArt } from "@/components/codes/CodeArt";
import { useDeviceAuth } from "@/components/lock/hooks";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ListCard, ListRow } from "@/components/ui/List";
import { Sheet, useSheetPages } from "@/components/ui/Sheet";
import { Text } from "@/components/ui/Text";
import { TextField } from "@/components/ui/TextField";
import { toast } from "@/components/ui/Toast";
import { PASSWORD_MIN_LENGTH } from "@/domain/security/password";
import { groupSecret, otpauthUri, TOTP_DIGITS } from "@/domain/security/totp";
import { attempt } from "@/lib/attempt";
import { haptics } from "@/lib/haptics";
import {
	checkTotp,
	clearSecrets,
	createRecoveryCode,
	createTotpSecret,
	savePassword,
	saveRecoveryCode,
	saveTotpSecret,
} from "@/services/lock";
import useSettings, { type LockMethod } from "@/stores/settings";
import { makeStyles, useSharedStyles, useTheme } from "@/theme";

type Page = "pick" | "password" | "totp" | "recovery";

const depthOf = (page: Page) =>
	page === "pick" ? 0 : page === "recovery" ? 2 : 1;

const QR_SIZE = 184;
/** How long a copy button says "Copied". */
const COPIED_FOR = 2000;

/**
 * Copies, then says so on the button itself for a moment: a toast would be
 * under the sheet's dimmed backdrop, where it's hard to see.
 */
function useCopyButtons() {
	const { t } = useTranslation();
	const [copied, setCopied] = useState<{ key: string; at: number } | null>(
		null,
	);
	useEffect(() => {
		if (!copied) return;
		const timer = setTimeout(() => setCopied(null), COPIED_FOR);
		return () => clearTimeout(timer);
	}, [copied]);
	return {
		copy: async (key: string, text: string) => {
			await Clipboard.setStringAsync(text);
			haptics.success();
			AccessibilityInfo.announceForAccessibility(t("app.common.copied"));
			setCopied({ key, at: Date.now() });
		},
		isCopied: (key: string) => copied?.key === key,
	};
}

/**
 * Picks what unlocks the app and locked items: the phone's own lock, a
 * password, or an authenticator app. A password or an authenticator is set
 * up (and proven to work), then comes with a recovery code for the day it
 * is forgotten; only once that is saved does it replace the current method.
 */
export function LockMethodSheet({
	ref,
}: {
	ref: RefObject<BottomSheetModal | null>;
}) {
	const shared = useSharedStyles();
	const { colors } = useTheme();
	const styles = useStyles();
	const { t } = useTranslation();
	const device = useDeviceAuth();
	const lockMethod = useSettings((state) => state.lockMethod);
	const setLockMethod = useSettings((state) => state.setLockMethod);
	const pages = useSheetPages<Page>("pick", depthOf);
	const copying = useCopyButtons();
	const [password, setPassword] = useState("");
	const [again, setAgain] = useState("");
	const [secret, setSecret] = useState("");
	const [code, setCode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	/** The method being set up, waiting for its recovery code to be saved. */
	const [pending, setPending] = useState<"password" | "totp" | null>(null);
	const [recovery, setRecovery] = useState("");
	const hasDevice = device !== null && device !== "none";
	const deviceName = t(`app.lock.device.${device ?? "passcode"}`);

	const reset = () => {
		pages.reset("pick");
		setPassword("");
		setAgain("");
		setSecret("");
		setCode("");
		setError(null);
		setSaving(false);
		setPending(null);
		setRecovery("");
	};

	const done = async (method: LockMethod) => {
		setLockMethod(method);
		// Only the secret in use stays on the phone.
		await attempt(() => clearSecrets(method === "device" ? undefined : method));
		haptics.success();
		toast(
			t("app.lock.method_saved", {
				method:
					method === "device" ? deviceName : t(`app.lock.methods.${method}`),
			}),
		);
		ref.current?.dismiss();
	};

	const open = (page: Page) => {
		setError(null);
		if (page === "totp") {
			setSecret(createTotpSecret());
			setCode("");
		}
		pages.go(page);
	};

	const savePasswordAndUse = async () => {
		if (password.length < PASSWORD_MIN_LENGTH) {
			setError(t("app.lock.too_short", { count: PASSWORD_MIN_LENGTH }));
			return;
		}
		if (password !== again) {
			setError(t("app.lock.mismatch"));
			return;
		}
		toRecovery("password");
	};

	/** Set up and proven: on to its recovery code. */
	const toRecovery = (method: "password" | "totp") => {
		setPending(method);
		setRecovery(createRecoveryCode());
		pages.go("recovery");
	};

	/** The recovery code is saved: keep the new secret and switch to it. */
	const commit = async () => {
		if (!pending || saving) return;
		setSaving(true);
		const saved = await attempt(() =>
			Promise.all([
				pending === "password"
					? savePassword(password)
					: saveTotpSecret(secret),
				saveRecoveryCode(recovery),
			]),
		);
		setSaving(false);
		if (!saved.ok) {
			toast(t("app.common.something_went_wrong"), "warning");
			return;
		}
		await done(pending);
	};

	const uri = secret
		? otpauthUri({
				secret,
				issuer: "Code Scanner",
				account: t("app.lock.totp_account"),
			})
		: "";

	const checkCode = async (typed: string) => {
		const ok = await attempt(() => checkTotp(typed, secret));
		if (!ok.ok || !ok.value) {
			haptics.warning();
			setError(t("app.lock.wrong_code"));
			setCode("");
			return;
		}
		toRecovery("totp");
	};

	const openInAuthenticator = async () => {
		const opened = await attempt(() => Linking.openURL(uri));
		if (!opened.ok) toast(t("app.actions.no_app"), "warning");
	};

	/** What happens if the password or the authenticator is lost. */
	const forgotNote = (
		<Text size={13} leading={1.5} color={colors.muted}>
			{hasDevice
				? t("app.lock.forgot_note", { method: deviceName })
				: t("app.lock.forgot_note_none")}
		</Text>
	);

	const errorLine = error && (
		<Text size={14} color={colors.danger} accessibilityLiveRegion="polite">
			{error}
		</Text>
	);

	const content = (() => {
		if (pages.page === "recovery") {
			return (
				<>
					<Text size={24} weight="semibold" tracking={-0.02}>
						{t("app.lock.recovery_title")}
					</Text>
					<Text size={15} leading={1.5} color={colors.body}>
						{t(
							pending === "totp"
								? "app.lock.recovery_body_totp"
								: "app.lock.recovery_body",
						)}
					</Text>
					<View style={[shared.well, styles.recoveryWell]}>
						<Text
							size={22}
							mono
							selectable
							align="center"
							accessibilityLabel={recovery.split("").join(" ")}
						>
							{recovery}
						</Text>
					</View>
					<Button
						variant="secondary"
						icon={copying.isCopied("recovery") ? "check" : "copy"}
						label={t(
							copying.isCopied("recovery")
								? "app.common.copied"
								: "app.lock.copy_recovery",
						)}
						onPress={() => copying.copy("recovery", recovery)}
					/>
					<Button
						icon="check"
						label={t(saving ? "app.lock.saving" : "app.lock.recovery_saved")}
						disabled={saving}
						onPress={commit}
					/>
				</>
			);
		}
		if (pages.page === "password") {
			return (
				<>
					<Text size={24} weight="semibold" tracking={-0.02}>
						{t("app.lock.methods.password")}
					</Text>
					<TextField
						inSheet
						value={password}
						onChangeText={(next) => {
							setPassword(next);
							setError(null);
						}}
						secureTextEntry
						autoFocus
						autoCapitalize="none"
						autoCorrect={false}
						textContentType="newPassword"
						autoComplete="new-password"
						maxLength={128}
						placeholder={t("app.lock.new_password")}
						accessibilityLabel={t("app.lock.new_password")}
						returnKeyType="next"
					/>
					<TextField
						inSheet
						value={again}
						onChangeText={(next) => {
							setAgain(next);
							setError(null);
						}}
						secureTextEntry
						autoCapitalize="none"
						autoCorrect={false}
						textContentType="newPassword"
						autoComplete="new-password"
						maxLength={128}
						placeholder={t("app.lock.confirm_password")}
						accessibilityLabel={t("app.lock.confirm_password")}
						returnKeyType="done"
						onSubmitEditing={savePasswordAndUse}
						invalid={error !== null}
					/>
					{errorLine}
					<Button
						icon="check"
						label={t("app.lock.use_password")}
						disabled={!password || !again}
						onPress={savePasswordAndUse}
					/>
					{forgotNote}
				</>
			);
		}
		if (pages.page === "totp") {
			return (
				<>
					<Text size={24} weight="semibold" tracking={-0.02}>
						{t("app.lock.totp_title")}
					</Text>
					<Text size={15} leading={1.5} color={colors.body}>
						{t("app.lock.totp_steps")}
					</Text>
					<View style={[shared.object, shared.center, styles.qr]}>
						{uri !== "" && <CodeArt format="qr" data={uri} size={QR_SIZE} />}
					</View>
					<View style={shared.well}>
						<Text size={15} mono selectable align="center">
							{groupSecret(secret)}
						</Text>
					</View>
					<View style={styles.row}>
						<Button
							variant="secondary"
							icon="externalLink"
							label={t("app.lock.open_authenticator")}
							onPress={openInAuthenticator}
							style={shared.flex}
						/>
						<Button
							variant="secondary"
							icon={copying.isCopied("key") ? "check" : "copy"}
							label={t(
								copying.isCopied("key")
									? "app.common.copied"
									: "app.lock.copy_key",
							)}
							onPress={() => copying.copy("key", secret)}
							style={shared.flex}
						/>
					</View>
					<TextField
						inSheet
						value={code}
						onChangeText={(next) => {
							const clean = next.replace(/\D/g, "");
							setCode(clean);
							setError(null);
							if (clean.length === TOTP_DIGITS) checkCode(clean);
						}}
						keyboardType="number-pad"
						textContentType="oneTimeCode"
						autoComplete="one-time-code"
						maxLength={TOTP_DIGITS}
						placeholder={t("app.lock.code_placeholder")}
						accessibilityLabel={t("app.lock.code_placeholder")}
						invalid={error !== null}
						style={styles.code}
					/>
					{errorLine}
					{forgotNote}
				</>
			);
		}
		const rows: {
			method: LockMethod;
			icon: "fingerprint" | "keypad" | "smartphone";
			label: string;
			description: string;
			enabled: boolean;
		}[] = [
			{
				method: "device",
				icon: "fingerprint",
				label: deviceName,
				description: t(
					hasDevice ? "app.lock.device_hint" : "app.lock.device_unavailable",
				),
				enabled: hasDevice,
			},
			{
				method: "password",
				icon: "keypad",
				label: t("app.lock.methods.password"),
				description: t("app.lock.password_method_hint"),
				enabled: true,
			},
			{
				method: "totp",
				icon: "smartphone",
				label: t("app.lock.methods.totp"),
				description: t("app.lock.totp_method_hint"),
				enabled: true,
			},
		];
		return (
			<>
				<Text size={24} weight="semibold" tracking={-0.02}>
					{t("app.lock.unlock_with_title")}
				</Text>
				<ListCard>
					{rows.map((row, index) => (
						<ListRow
							key={row.method}
							icon={row.icon}
							iconTile={36}
							label={row.label}
							description={row.description}
							height={68}
							last={index === rows.length - 1}
							trailing={
								row.method === lockMethod ? (
									<Icon name="check" size={18} color={colors.accent} />
								) : undefined
							}
							onPress={
								row.enabled
									? () =>
											row.method === "device"
												? done("device")
												: open(row.method)
									: undefined
							}
						/>
					))}
				</ListCard>
			</>
		);
	})();

	return (
		<Sheet ref={ref} page={pages.sheetPage} onDismiss={reset}>
			{content}
		</Sheet>
	);
}

const useStyles = makeStyles(() => ({
	qr: { alignSelf: "center", padding: 18 },
	recoveryWell: { paddingVertical: 22 },
	row: { flexDirection: "row", gap: 10 },
	code: {
		textAlign: "center",
		fontSize: 24,
		letterSpacing: 8,
		fontVariant: ["tabular-nums"],
	},
}));
