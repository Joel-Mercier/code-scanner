import { type BarcodeScanningResult, scanFromURLAsync } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { toast } from "@/components/ui/Toast";
import { normalizeBarcodeType } from "@/domain/codes/formats";
import { haptics } from "@/lib/haptics";
import useLibrary from "@/stores/library";
import { ease, easeOut } from "@/theme/motion";
import type { Quad } from "../components/Viewfinder";

/** The same code is ignored for this long after it was read. */
const RESCAN_COOLDOWN = 2500;

/** The detected code's corners, from its corner points or its bounds. */
const quadOf = (scan: BarcodeScanningResult): Quad => {
	const points = scan.cornerPoints ?? [];
	if (points.length === 4) {
		return [
			points[0].x,
			points[0].y,
			points[1].x,
			points[1].y,
			points[2].x,
			points[2].y,
			points[3].x,
			points[3].y,
		];
	}
	const { origin, size } = scan.bounds;
	return [
		origin.x,
		origin.y,
		origin.x + size.width,
		origin.y,
		origin.x + size.width,
		origin.y + size.height,
		origin.x,
		origin.y + size.height,
	];
};

/**
 * Live and photo code scanning: saves the code, snaps the viewfinder onto it
 * and hands the new item to `onCaptured`. One code at a time: scanning
 * resumes when the screen is focused again.
 */
export function useCodeScanner(onCaptured: (id: string) => void) {
	const { t } = useTranslation();
	const addCode = useLibrary((state) => state.addCode);
	const locked = useRef(false);
	const lastScan = useRef({ data: "", at: 0 });
	/** 0 = idle viewfinder, 1 = snapped onto `quad`. */
	const lock = useSharedValue(0);
	const quad = useSharedValue<Quad>([0, 0, 0, 0, 0, 0, 0, 0]);

	// Back from a capture: release the reticle and accept new codes.
	useFocusEffect(
		useCallback(() => {
			lock.set(withTiming(0, ease));
			lastScan.current.at = Date.now();
			const timer = setTimeout(() => {
				locked.current = false;
			}, 400);
			return () => clearTimeout(timer);
		}, [lock]),
	);

	const capture = (scan: BarcodeScanningResult, delay: number) => {
		const item = addCode({
			source: "scanner",
			format: normalizeBarcodeType(scan.type),
			data: scan.data,
		});
		haptics.success();
		setTimeout(() => onCaptured(item.id), delay);
	};

	const onBarcodeScanned = (scan: BarcodeScanningResult) => {
		if (locked.current || !scan.data) return;
		const now = Date.now();
		if (
			scan.data === lastScan.current.data &&
			now - lastScan.current.at < RESCAN_COOLDOWN
		) {
			return;
		}
		locked.current = true;
		lastScan.current = { data: scan.data, at: now };
		quad.set(quadOf(scan));
		lock.set(withTiming(1, { duration: 320, easing: easeOut }));
		capture(scan, 420);
	};

	const scanFromGallery = async () => {
		const picked = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			quality: 1,
		});
		if (picked.canceled) return;
		const [found] = await scanFromURLAsync(picked.assets[0].uri);
		if (!found) {
			haptics.warning();
			toast(t("app.scan.no_code_in_image"), "warning");
			return;
		}
		locked.current = true;
		capture(found, 0);
	};

	return { lock, quad, onBarcodeScanned, scanFromGallery };
}
