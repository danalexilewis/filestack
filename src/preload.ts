// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  openWorkspace: () => ipcRenderer.send('open-workspace'),
  onConfigLoaded: (callback: (views: any[]) => void) => ipcRenderer.on('config-loaded', (_event, value) => callback(value)),
  onConfigError: (callback: (errorMessage: string) => void) => ipcRenderer.on('config-error', (_event, value) => callback(value)),
});
