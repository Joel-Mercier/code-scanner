import { zustandStorage } from "@/config/storage";
import createSelectors from "@/utils/createSelectors";
import type { BarcodeScanningResult } from "expo-camera";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ScannerResult = BarcodeScanningResult & {
	createdAt: Date;
	source: "scanner" | "form";
};
interface ScannerResultsStore {
	scannerResults: ScannerResult[];
	currentScannerResult: ScannerResult | null;
	setCurrentScannerResult: (scannerResult: ScannerResult | null) => void;
	addScannerResult: (scannerResult: ScannerResult) => void;
	clearScannerResults: () => void;
}

const useScannerResultsBase = create<ScannerResultsStore>()(
	persist(
		(set) => ({
			scannerResults: [],
			currentScannerResult: null,
			setCurrentScannerResult: (scannerResult: ScannerResult | null) => {
				set({ currentScannerResult: scannerResult });
			},
			addScannerResult: (scannerResult: ScannerResult) => {
				set((state) => {
					if (
						!state.scannerResults
							.map((result) => result.data)
							.includes(scannerResult.data)
					) {
						const newScannerResults = [scannerResult, ...state.scannerResults];
						if (newScannerResults.length > 100) {
							newScannerResults.length = 100;
						}
						return { scannerResults: newScannerResults };
					}
					return { scannerResults: state.scannerResults };
				});
			},
			clearScannerResults: () => {
				set({ scannerResults: [] });
			},
		}),
		{
			name: "scannerResults",
			storage: createJSONStorage(() => zustandStorage),
			partialize: (state) =>
				Object.fromEntries(
					Object.entries(state).filter(
						([key]) => !["currentScannerResult"].includes(key),
					),
				),
		},
	),
);

const useScannerResults = createSelectors(useScannerResultsBase);

export default useScannerResults;
