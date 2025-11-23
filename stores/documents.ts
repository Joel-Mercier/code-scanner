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
  parentId: number | null;
};

export type Folder = {
  id: number;
  name: string;
  createdAt: Date;
  parentId: number | null;
  childrenFolders: number[];
  childrenDocuments: number[];
}

type FolderTree = {
  id: number | null;
  folders: FolderTree[];
  documents: Document[];
};

interface DocumentsStore {
  documents: Record<number, Document>;
  currentDocument: Document | null;
  folders: Record<number, Folder>;
  currentFolder: Folder | null;
  rootFolderIds: number[];
  rootDocumentIds: number[];
  setCurrentDocument: (document: Document | null) => void;
  setCurrentFolder: (folder: Folder | null) => void;
  createFolder: (folder: Folder) => void;
  createDocument: (document: Document) => void;
  renameFolder: (id: number, name: string) => void;
  renameDocument: (id: number, name: string) => void;
  deleteFolder: (id: number) => void;
  deleteDocument: (id: number) => void;
  moveFolder: (id: number, newParentId: number | null) => void;
  moveDocument: (id: number, newParentId: number | null) => void;
  getFolderTree: (folderId: number | null) => {
    id: number | null;
    folders: {
      id: number | null;
      folders: unknown[];
      documents: Document[];
    }[];
    documents: Document[];
  };
}

export const useDocumentsBase = create<DocumentsStore>()(
  persist(
    (set, get) => ({
      documents: {},
      currentDocument: null,
      folders: {},
      currentFolder: null,
      rootFolderIds: [],
      rootDocumentIds: [],
      setCurrentDocument: (document: Document | null) => {
        set({ currentDocument: document });
      },
      setCurrentFolder: (folder: Folder | null) => {
        set({ currentFolder: folder });
      },
      createFolder: (folder) => {
        set((state) => {
          state.folders[folder.id] = folder;

          if (folder.parentId) {
            state.folders[folder.parentId].childrenFolders.push(folder.id);
          } else {
            state.rootFolderIds.push(folder.id);
          }
          return state;
        });
      },
      createDocument: (document) => {
        set((state) => {
          state.documents[document.id] = document;

          if (document.parentId) {
            state.folders[document.parentId].childrenDocuments.push(document.id);
          } else {
            state.rootDocumentIds.push(document.id);
          }
          return state;
        });
      },
      renameFolder: (id, name) => {
        set((state) => {
          if (state.folders[id]) state.folders[id].name = name;
          return state;
        });
      },
      renameDocument: (id, name) => {
        set((state) => {
          if (state.documents[id]) state.documents[id].name = name;
          return state;
        });
      },
      deleteFolder: (id) => {
        set((state) => {
          const folder = state.folders[id];
          if (!folder) return state;

          const { parentId } = folder;

          if (parentId) {
            state.folders[parentId].childrenFolders =
              state.folders[parentId].childrenFolders.filter((f) => f !== id);
          } else {
            state.rootFolderIds = state.rootFolderIds.filter((f) => f !== id);
          }

          for (const childId of folder.childrenFolders) {
            delete state.folders[childId];
          }

          for (const docId of folder.childrenDocuments) {
            delete state.documents[docId];
          }

          delete state.folders[id];
          return state;
        });
      },
      deleteDocument: (id) =>
        set((state) => {
          const doc = state.documents[id];
          if (!doc) return state;

          const { parentId } = doc;

          if (parentId) {
            state.folders[parentId].childrenDocuments =
              state.folders[parentId].childrenDocuments.filter((d) => d !== id);
          } else {
            state.rootDocumentIds = state.rootDocumentIds.filter((d) => d !== id);
          }

          delete state.documents[id];
          return state;
        }),
      moveFolder: (id, newParentId) => {
        set((state) => {
          const folder = state.folders[id];
          if (!folder) return state;

          const oldParentId = folder.parentId;

          if (oldParentId) {
            state.folders[oldParentId].childrenFolders =
              state.folders[oldParentId].childrenFolders.filter((f) => f !== id);
          } else {
            state.rootFolderIds = state.rootFolderIds.filter((f) => f !== id);
          }

          folder.parentId = newParentId;
          if (newParentId) {
            state.folders[newParentId].childrenFolders.push(id);
          } else {
            state.rootFolderIds.push(id);
          }
          return state;
        });
      },
      moveDocument: (id, newParentId) => {
        set((state) => {
          const doc = state.documents[id];
          if (!doc) return state;

          const oldParentId = doc.parentId;

          if (oldParentId) {
            state.folders[oldParentId].childrenDocuments =
              state.folders[oldParentId].childrenDocuments.filter((d) => d !== id);
          } else {
            state.rootDocumentIds = state.rootDocumentIds.filter((d) => d !== id);
          }

          doc.parentId = newParentId;
          if (newParentId) {
            state.folders[newParentId].childrenDocuments.push(id);
          } else {
            state.rootDocumentIds.push(id);
          }
          return state;
        });
      },
      getFolderTree: (folderId) => {
        const { folders, documents, rootFolderIds, rootDocumentIds } = get();

        const build = (id: number | null): FolderTree => {
          if (id === null) {
            return {
              id: null,
              folders: rootFolderIds.map((f: number) => build(f)),
              documents: rootDocumentIds.map((d: number) => documents[d]),
            };
          }

          const folder = folders[id];
          return {
            ...folder,
            folders: folder.childrenFolders.map((f) => build(f)),
            documents: folder.childrenDocuments.map((d) => documents[d]),
          };
        };

        return build(folderId);
      },
    }),
    {
      name: "documents",
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) => !["currentDocument", "currentFolder"].includes(key),
          ),
        ),
    }
  )
);

const useDocuments = createSelectors(useDocumentsBase);

export default useDocuments;