import { zustandStorage } from "@/config/storage";
import createSelectors from "@/utils/createSelectors";
import type { BarcodeScanningResult } from "expo-camera";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ScannerResultsStore {
  scannerResults: BarcodeScanningResult[];
  addScannerResult: (scannerResult: BarcodeScanningResult) => void;
}


const useScannerResultsBase = create<ScannerResultsStore>()(persist(
  (set) => ({
    scannerResults: [],
    addScannerResult: (scannerResult: BarcodeScanningResult) => {
      set((state) => {
        if (!state.scannerResults.map(result => result.data).includes(scannerResult.data)) {
          const newScannerResults = [scannerResult, ...state.scannerResults];
          if (newScannerResults.length > 100) {
            newScannerResults.length = 100;
          }
          return { scannerResults: newScannerResults };
        }
        return { scannerResults: state.scannerResults };
      });
    },
  }),
  {
    name: "scannerResults",
    storage: createJSONStorage(() => zustandStorage),
  }
));

const useScannerResults = createSelectors(useScannerResultsBase);

export default useScannerResults;
