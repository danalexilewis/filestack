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
  saveFile: (file: string) => Promise<boolean>;
  saveAllFiles: () => Promise<boolean>;
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
  saveFile: async (file) => {
    const state = get();
    const unsavedContent = state.unsavedChanges[file];
    
    if (unsavedContent) {
      try {
        // Save to disk using Electron IPC
        if ((window as any).electron) {
          const success = await (window as any).electron.saveContentFile(file, unsavedContent);
          if (!success) {
            console.error(`Failed to save file to disk: ${file}`);
            return false;
          }
        } else {
          console.warn(`Electron API not available, saving to store only: ${file}`);
        }
        
        // Update store
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
        return true;
      } catch (error) {
        console.error(`Error saving file ${file}:`, error);
        return false;
      }
    } else {
      return true;
    }
  },
  saveAllFiles: async () => {
    const state = get();
    const filesToSave = Object.keys(state.unsavedChanges);
    if (filesToSave.length > 0) {
      try {
        // Save all files to disk
        if ((window as any).electron) {
          for (const file of filesToSave) {
            const unsavedContent = state.unsavedChanges[file];
            if (unsavedContent) {
              const success = await (window as any).electron.saveContentFile(file, unsavedContent);
              if (!success) {
                console.error(`Failed to save file to disk: ${file}`);
                return false;
              }
            }
          }
        } else {
          console.warn(`Electron API not available, saving to store only`);
        }
        
        // Update store
        set((state) => ({
          fileContents: {
            ...state.fileContents,
            ...state.unsavedChanges,
          },
          unsavedChanges: {},
          dirtyFiles: [],
        }));
        return true;
      } catch (error) {
        console.error(`Error saving all files:`, error);
        return false;
      }
    } else {
      return true;
    }
  },
  markFileAsDirty: (file) =>
    set((state) => ({ dirtyFiles: [...new Set([...state.dirtyFiles, file])] })),
  unmarkFileAsDirty: (file) =>
    set((state) => ({ dirtyFiles: state.dirtyFiles.filter((f) => f !== file) })),
})); 