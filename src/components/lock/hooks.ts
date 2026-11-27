import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { isLocked } from "@/domain/library/items";
import type { LibraryItem } from "@/domain/library/types";
import { type DeviceAuth, deviceAuth } from "@/services/lock";
import useLockSession from "@/stores/lockSession";
import useSettings from "@/stores/settings";
import { type ActiveMethod, resolveMethod, useLockUi } from "./unlock";

/** Whether an item can show what it holds: not locked, or unlocked now. */
export function useRevealed(item: LibraryItem | undefined) {
	const itemsUnlocked = useLockSession((state) => state.itemsUnlocked);
	return !item || !isLocked(item) || itemsUnlocked;
}

/** What the phone can check (for labels), once known. */
export function useDeviceAuth() {
	const [auth, setAuth] = useState<DeviceAuth | null>(null);
	useEffect(() => {
		let live = true;
		deviceAuth()
			.then((next) => live && setAuth(next))
			.catch(() => live && setAuth("none"));
		return () => {
			live = false;
		};
	}, []);
	return auth;
}

/** The lock method that works right now, once known; follows the setting. */
export function useActiveMethod() {
	const lockMethod = useSettings((state) => state.lockMethod);
	const [method, setMethod] = useState<ActiveMethod | null>(null);
	useEffect(() => {
		let live = true;
		resolveMethod(lockMethod).then((next) => live && setMethod(next));
		return () => {
			live = false;
		};
	}, [lockMethod]);
	return method;
}

/** "Face ID", "Fingerprint", "Password"…: what unlocks, in words. */
export function useMethodLabel() {
	const { t } = useTranslation();
	const auth = useDeviceAuth();
	return (method: ActiveMethod | null) =>
		method === "password" || method === "totp"
			? t(`app.lock.methods.${method}`)
			: t(`app.lock.device.${auth ?? "passcode"}`);
}

/**
 * For screens shown as native modals, which sit above the lock overlay:
 * whether to hide their content (the app is locked or covered, or the item
 * they show is locked), and they close themselves when the app locks or the
 * item locks again.
 */
export function useModalGuard(item?: LibraryItem) {
	const router = useRouter();
	const revealed = useRevealed(item);
	const appLocked = useLockSession((state) => !state.appUnlocked);
	const covered = useLockUi((state) => state.covered);
	const close = appLocked || !revealed;
	useEffect(() => {
		if (close && router.canGoBack()) router.back();
	}, [close, router]);
	return close || covered;
}
