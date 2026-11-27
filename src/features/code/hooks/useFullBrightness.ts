import { useEffect } from "react";
import { AppState } from "react-native";
import { attempt } from "@/lib/attempt";
import { raiseBrightness } from "@/services/brightness";

/**
 * The screen at full brightness while mounted, and again after a trip to
 * the background (iOS puts the user's level back when the app leaves).
 * The level from before is restored on the way out.
 */
export function useFullBrightness() {
	useEffect(() => {
		let live = true;
		let restore: (() => Promise<void>) | null = null;
		const raise = async () => {
			const result = await attempt(raiseBrightness);
			if (!result.ok) return;
			// Left before it was raised: put it straight back.
			if (!live) result.value().catch(console.error);
			// The first one knows the level from before: later ones read 100%.
			else restore ??= result.value;
		};
		raise();
		const subscription = AppState.addEventListener("change", (next) => {
			if (next === "active") raise();
		});
		return () => {
			live = false;
			subscription.remove();
			restore?.().catch(console.error);
		};
	}, []);
}
