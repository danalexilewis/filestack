export interface IElectronAPI {
  openWorkspace: () => void;
  onConfigLoaded: (callback: (views: any[]) => void) => void;
  onConfigError: (callback: (errorMessage: string) => void) => void;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
} 