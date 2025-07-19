import { create } from 'zustand';
import { View } from '../shared/types';

interface AppState {
  workspacePath: string | null;
  views: View[];
  activeView: string | null;
  fileContents: Record<string, string>;
  dirtyFiles: string[];
  unsavedChanges: Record<string, string>; // Store unsaved changes separately
  setWorkspacePath: (path: string) => void;
  setViews: (views: View[]) => void;
  setActiveView: (viewId: string) => void;
  setFileContents: (file: string, contents: string) => void;
  setUnsavedChanges: (file: string, contents: string) => void;
  clearUnsavedChanges: (file: string) => void;
  saveFile: (file: string) => void;
  saveAllFiles: () => void;
  markFileAsDirty: (file: string) => void;
  unmarkFileAsDirty: (file: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  workspacePath: null,
  views: [],
  activeView: null,
  fileContents: {},
  dirtyFiles: [],
  unsavedChanges: {},
  setWorkspacePath: (path) => set({ workspacePath: path }),
  setViews: (views) => set({ views }),
  setActiveView: (viewId) => set({ activeView: viewId }),
  setFileContents: (file, contents) =>
    set((state) => ({
      fileContents: {
        ...state.fileContents,
        [file]: contents,
      },
    })),
  setUnsavedChanges: (file, contents) => {
    set((state) => ({
      unsavedChanges: {
        ...state.unsavedChanges,
        [file]: contents,
      },
      dirtyFiles: [...new Set([...state.dirtyFiles, file])],
    }));
  },
  clearUnsavedChanges: (file) =>
    set((state) => {
      const { [file]: removed, ...remainingChanges } = state.unsavedChanges;
      return {
        unsavedChanges: remainingChanges,
        dirtyFiles: state.dirtyFiles.filter((f) => f !== file),
      };
    }),
  saveFile: (file) => {
    const state = get();
    const unsavedContent = state.unsavedChanges[file];
    if (unsavedContent) {
      set((state) => ({
        fileContents: {
          ...state.fileContents,
          [file]: unsavedContent,
        },
        unsavedChanges: {
          ...state.unsavedChanges,
          [file]: undefined,
        },
        dirtyFiles: state.dirtyFiles.filter((f) => f !== file),
      }));
      console.log(`Saved file: ${file}`);
    }
  },
  saveAllFiles: () => {
    const state = get();
    const filesToSave = Object.keys(state.unsavedChanges);
    if (filesToSave.length > 0) {
      set((state) => ({
        fileContents: {
          ...state.fileContents,
          ...state.unsavedChanges,
        },
        unsavedChanges: {},
        dirtyFiles: [],
      }));
      console.log(`Saved all files: ${filesToSave.join(', ')}`);
    }
  },
  markFileAsDirty: (file) =>
    set((state) => ({ dirtyFiles: [...new Set([...state.dirtyFiles, file])] })),
  unmarkFileAsDirty: (file) =>
    set((state) => ({ dirtyFiles: state.dirtyFiles.filter((f) => f !== file) })),
})); 