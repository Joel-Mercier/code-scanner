import { zustandStorage } from "@/config/storage";
import createSelectors from "@/utils/createSelectors";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type DocumentScannerPdf = {
  uri: string;
  pageCount: number;
};

export type Document = {
  id: number;
  name: string;
  createdAt: Date;
  pdf: DocumentScannerPdf | null;
  pages: string[] | null;
  size?: number;
};

interface DocumentsStore {
  documents: Document[];
  currentDocument: Document | null;
  setCurrentDocument: (document: Document | null) => void;
  addDocument: (document: Document) => void;
  removeDocument: (document: Document) => void;
  clearDocuments: () => void;
}

export const useDocumentsBase = create<DocumentsStore>()(
  persist(
    (set) => ({
      documents: [],
      currentDocument: null,
      setCurrentDocument: (document: Document | null) => {
        set({ currentDocument: document });
      },
      addDocument: (document: Document) => {
        set((state) => {
          const newDocuments = [document, ...state.documents];
          if (newDocuments.length > 100) {
            newDocuments.length = 100;
          }
          return { documents: newDocuments };
        });
      },
      removeDocument: (document: Document) => {
        set((state) => {
          const newDocuments = state.documents.filter(
            (doc) => doc.id !== document.id,
          );
          return { documents: newDocuments };
        });
      },
      clearDocuments: () => {
        set({ documents: [] });
      },
    }),
    {
      name: "documents",
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) => !["currentDocument"].includes(key),
          ),
        ),
    }
  )
);

const useDocuments = createSelectors(useDocumentsBase);

export default useDocuments;