import { create } from 'zustand';
import { View } from '../shared/types';

interface AppState {
  workspacePath: string | null;
  views: View[];
  activeView: string | null;
  fileContents: Record<string, string>;
  setWorkspacePath: (path: string) => void;
  setViews: (views: View[]) => void;
  setActiveView: (viewId: string) => void;
  setFileContents: (file: string, contents: string) => void;
}

export const useStore = create<AppState>((set) => ({
  workspacePath: null,
  views: [],
  activeView: null,
  fileContents: {},
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
})); 