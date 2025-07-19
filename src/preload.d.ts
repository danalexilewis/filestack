export interface IElectronAPI {
  openWorkspace: () => void;
  getWorkspaceFileContents: (files: string[]) => Promise<Record<string, string>>;
  saveFiles: (filesToSave: Record<string, string>) => Promise<void>;
  onConfigLoaded: (callback: (views: any[]) => void) => void;
  onConfigError: (callback: (errorMessage: string) => void) => void;
  onWorkspaceOpened: (callback: (path: string) => void) => void;
  loadContentFile: (contentFile: string) => Promise<string | null>;
  saveContentFile: (contentFile: string, content: string) => Promise<boolean>;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
} 