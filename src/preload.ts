// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  openWorkspace: () => ipcRenderer.send('open-workspace'),
  getWorkspaceFileContents: (files: string[]) => ipcRenderer.invoke('get-workspace-file-contents', files),
  saveFiles: (filesToSave: Record<string, string>) => ipcRenderer.invoke('save-files', filesToSave),
  onConfigLoaded: (callback: (views: any[]) => void) => ipcRenderer.on('config-loaded', (_event, value) => callback(value)),
  onConfigError: (callback: (errorMessage: string) => void) => ipcRenderer.on('config-error', (_event, value) => callback(value)),
  onWorkspaceOpened: (callback: (path: string) => void) => ipcRenderer.on('workspace-opened', (_event, value) => callback(value)),
});
