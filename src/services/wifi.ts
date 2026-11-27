import { requireOptionalNativeModule } from "expo";
import * as Clipboard from "expo-clipboard";
import { Linking, Platform } from "react-native";
import type { WifiNetwork } from "@/domain/codes/actions";

/** What `modules/wifi` reports. */
type NativeResult =
	| "connected"
	| "saved"
	| "cancelled"
	| "invalid"
	| "failed"
	| "unsupported";

type WifiNative = {
	connect: (options: {
		ssid: string;
		password?: string;
		security: string;
		hidden: boolean;
	}) => Promise<NativeResult>;
};

/**
 * `connected`: iOS joined it. `saved`: Android saved it and connects when in
 * range. `manual`: the password was copied (and Android's Wi-Fi panel
 * opened), to finish by hand.
 */
export type JoinResult =
	| "connected"
	| "saved"
	| "cancelled"
	| "failed"
	| "manual";

/** Opens Android's Wi-Fi panel (Android 10+), or the Wi-Fi settings. */
const openWifiSettings = async () => {
	try {
		await Linking.sendIntent("android.settings.panel.action.WIFI");
	} catch {
		await Linking.sendIntent("android.settings.WIFI_SETTINGS");
	}
};

/** Without the native module, or where it can't help: copy, then settings. */
const joinByHand = async (network: WifiNetwork): Promise<JoinResult> => {
	if (network.password) await Clipboard.setStringAsync(network.password);
	if (Platform.OS === "android") await openWifiSettings();
	return "manual";
};

/**
 * Joins a scanned network: iOS asks to join it, Android 11+ asks to save it.
 * Elsewhere (older Android, WEP on Android, enterprise networks, a build
 * without the module) it falls back to copying the password.
 */
export const joinWifi = async (network: WifiNetwork): Promise<JoinResult> => {
	const native = requireOptionalNativeModule<WifiNative>("Wifi");
	if (!native || network.encryption === "EAP") return joinByHand(network);
	const result = await native.connect({
		ssid: network.ssid,
		password: network.password,
		security: network.encryption,
		hidden: network.hidden,
	});
	switch (result) {
		case "connected":
		case "saved":
		case "cancelled":
			return result;
		case "unsupported":
		case "invalid":
			return joinByHand(network);
		default:
			return "failed";
	}
};
