export interface IElectronAPI {
  openWorkspace: () => void;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
} 