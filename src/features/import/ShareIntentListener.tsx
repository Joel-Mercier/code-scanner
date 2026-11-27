import { usePathname, useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import { useEffect } from "react";

/**
 * Opens the import screen when another app shares files with this one
 * (Android hands them over without a URL, so the router can't).
 */
export function ShareIntentListener() {
	const { hasShareIntent } = useShareIntentContext();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (hasShareIntent && pathname !== "/import") router.push("/import");
	}, [hasShareIntent, pathname, router]);

	return null;
}
