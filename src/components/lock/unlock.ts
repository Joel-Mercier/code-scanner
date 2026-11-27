import { create } from "zustand";
import i18n from "@/i18n";
import { attempt } from "@/lib/attempt";
import {
	authenticateWithDevice,
	clearSecrets,
	deviceAuth,
	hasPassword,
	hasTotpSecret,
} from "@/services/lock";
import useLockSession from "@/stores/lockSession";
import useSettings, { type LockMethod } from "@/stores/settings";

/** Why we ask: to open locked items, or to confirm a change to the locks. */
export type UnlockPurpose = "items" | "confirm";

/** The method that works right now; `none`: nothing to check against. */
export type ActiveMethod = LockMethod | "none";

type Request = {
	purpose: UnlockPurpose;
	method: "password" | "totp";
	resolve: (ok: boolean) => void;
};

type LockUiState = {
	/** A password / code pad waiting to be answered (shown by `LockOverlay`). */
	request: Request | null;
	/** The system prompt is up: leaving the app for it isn't leaving. */
	authenticating: boolean;
	/** The app is in the background or the app switcher, behind a cover. */
	covered: boolean;
};

export const useLockUi = create<LockUiState>(() => ({
	request: null,
	authenticating: false,
	covered: false,
}));

/**
 * The lock method in use, as far as it can work: a password or an
 * authenticator key whose secret is gone (a phone restored from a backup
 * doesn't bring it) falls back to the phone's own lock.
 */
export const resolveMethod = async (
	lockMethod: LockMethod = useSettings.getState().lockMethod,
): Promise<ActiveMethod> => {
	const result = await attempt(async () => {
		if (lockMethod === "password" && (await hasPassword())) return "password";
		if (lockMethod === "totp" && (await hasTotpSecret())) return "totp";
		return (await deviceAuth()) === "none" ? "none" : "device";
	});
	return result.ok ? result.value : "device";
};

let prompting: Promise<boolean> | null = null;

/** The system's Face ID / fingerprint / passcode prompt, one at a time. */
export const promptDevice = (message: string) => {
	if (prompting) return prompting;
	useLockUi.setState({ authenticating: true });
	prompting = attempt(() =>
		authenticateWithDevice(message, i18n.t("app.common.cancel")),
	).then((result) => {
		prompting = null;
		useLockUi.setState({ authenticating: false });
		return result.ok && result.value;
	});
	return prompting;
};

/** Answers the pad on screen (and takes it away). */
export const finishRequest = (ok: boolean) => {
	const { request } = useLockUi.getState();
	useLockUi.setState({ request: null });
	request?.resolve(ok);
};

const verify = async (purpose: UnlockPurpose) => {
	const method = await resolveMethod();
	if (method === "none") return true;
	if (method === "device") {
		return promptDevice(i18n.t(`app.lock.prompt_${purpose}`));
	}
	// One pad at a time: a newer request replaces (and turns down) the last.
	useLockUi.getState().request?.resolve(false);
	return new Promise<boolean>((resolve) =>
		useLockUi.setState({ request: { purpose, method, resolve } }),
	);
};

/** Opens every locked item until the app next locks; true once open. */
export const unlockItems = async () => {
	if (useLockSession.getState().itemsUnlocked) return true;
	const ok = await verify("items");
	if (ok) useLockSession.getState().unlockItems();
	return ok;
};

/** Asks again, whatever is unlocked: before loosening or changing a lock. */
export const confirmIdentity = () => verify("confirm");

/** Whether anything could be checked before opening a locked item. */
export const canLock = async () => (await resolveMethod()) !== "none";

/**
 * After "Forgot it?": the password or authenticator nobody can give any
 * more is dropped (with its recovery code), and the phone's own lock takes
 * over until a new one is set. Resolves to whether the phone has a lock.
 */
export const forgetSecrets = async () => {
	useSettings.getState().setLockMethod("device");
	await attempt(() => clearSecrets());
	return (await resolveMethod("device")) === "device";
};
