import { getShareExtensionKey } from "expo-share-intent";

/**
 * iOS opens the app with `<scheme>://dataUrl=<key>` after something was
 * shared to it: that's the import screen, not a route of its own.
 */
export function redirectSystemPath({
	path,
}: {
	path: string;
	initial: boolean;
}) {
	try {
		if (path.includes(`dataUrl=${getShareExtensionKey()}`)) return "/import";
		return path;
	} catch {
		return "/";
	}
}
