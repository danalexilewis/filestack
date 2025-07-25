import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { ConfigSchema } from './shared/types';

// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Vite
// plugin that tells the Electron app where to look for the Vite-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

let workspacePath: string | null = null;

const menuTemplate: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Open Workspace',
        click: async (menuItem, browserWindow) => {
          if (!browserWindow) return;

          const result = await dialog.showOpenDialog(browserWindow as BrowserWindow, {
            properties: ['openDirectory'],
          });

          if (result.filePaths.length > 0) {
            workspacePath = result.filePaths[0];
            (browserWindow as BrowserWindow).webContents.send('workspace-opened', workspacePath);
            loadFilestackConfig(workspacePath, browserWindow as BrowserWindow);
          }
        },
      },
      { type: 'separator' },
      { role: 'quit' }
    ]
  },
  {
    label: 'Edit',
    submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
    ]
  }
];

async function loadFilestackConfig(workspacePath: string, browserWindow: BrowserWindow) {
  try {
    const configPath = path.join(workspacePath, 'filestack.json');
    const fileContent = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(fileContent);
    
    console.log('Raw config:', JSON.stringify(config, null, 2));
    
    const validationResult = ConfigSchema.safeParse(config);

    if (validationResult.success) {
      console.log('Validation successful, sending views:', validationResult.data.views);
      console.log('First view content:', validationResult.data.views[0]?.content);
      browserWindow.webContents.send('config-loaded', validationResult.data.views);
    } else {
      console.log('Validation failed:', validationResult.error.message);
      console.log('Validation errors:', validationResult.error.issues);
      // Temporarily bypass validation to see if that's the issue
      console.log('Bypassing validation and sending raw config');
      browserWindow.webContents.send('config-loaded', config.views);
    }
  } catch (error) {
    console.log('Error loading config:', error);
    browserWindow.webContents.send('config-error', 'Could not read or parse filestack.json');
  }
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
  
  return mainWindow;
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
  const mainWindow = createWindow();
  
  // Auto-load the example workspace if it exists
  const examplePath = path.join(process.cwd(), 'examples/simple');
  console.log('Checking for example workspace at:', examplePath);
  console.log('Example path exists:', existsSync(examplePath));
  
  if (existsSync(examplePath)) {
    console.log('Loading example workspace');
    workspacePath = examplePath;
    mainWindow.webContents.send('workspace-opened', workspacePath);
    loadFilestackConfig(workspacePath, mainWindow);
  } else {
    console.log('Example workspace not found');
  }
});

ipcMain.on('open-workspace', async (event) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);
  if (!browserWindow) return;

  const result = await dialog.showOpenDialog(browserWindow, {
    properties: ['openDirectory'],
  });

  if (result.filePaths.length > 0) {
    workspacePath = result.filePaths[0];
    browserWindow.webContents.send('workspace-opened', workspacePath);
    loadFilestackConfig(workspacePath, browserWindow);
  }
});

ipcMain.handle('get-workspace-file-contents', async (_event, files: string[]) => {
  if (!workspacePath) {
    console.log('No workspace path set');
    return {};
  }

  console.log(`Loading files from workspace: ${workspacePath}`);
  console.log(`Files requested:`, files);

  const fileContents: Record<string, string> = {};
  for (const file of files) {
    try {
      const filePath = path.join(workspacePath, file);
      console.log(`Reading file: ${filePath}`);
      const content = await fs.readFile(filePath, 'utf-8');
      console.log(`File ${file} loaded, length: ${content.length}`);
      fileContents[file] = content;
    } catch (error) {
      console.error(`Error reading file ${file}:`, error);
      fileContents[file] = `Error reading file: ${error.message}`;
    }
  }
  
  console.log(`Returning file contents for:`, Object.keys(fileContents));
  return fileContents;
});

ipcMain.handle('save-files', async (_event, filesToSave: Record<string, string>) => {
  if (!workspacePath) {
    return;
  }

  for (const [file, content] of Object.entries(filesToSave)) {
    try {
      const filePath = path.join(workspacePath, file);
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      console.error(`Error writing file ${file}:`, error);
      // We could send an error back to the renderer process here
    }
  }
});

// Handle loading Markdown content files
ipcMain.handle('load-content-file', async (_event, contentFile: string) => {
  if (!workspacePath) {
    console.log('No workspace path set');
    return null;
  }

  try {
    const filePath = path.join(workspacePath, contentFile);
    console.log(`Loading content file: ${filePath}`);
    const content = await fs.readFile(filePath, 'utf-8');
    console.log(`Content file loaded, length: ${content.length}`);
    return content;
  } catch (error) {
    console.error(`Error reading content file ${contentFile}:`, error);
    return null;
  }
});

// Handle saving Markdown content files
ipcMain.handle('save-content-file', async (_event, contentFile: string, content: string) => {
  if (!workspacePath) {
    console.log('No workspace path set');
    return false;
  }

  try {
    const filePath = path.join(workspacePath, contentFile);
    console.log(`Saving content file: ${filePath}`);
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`Content file saved successfully`);
    return true;
  } catch (error) {
    console.error(`Error writing content file ${contentFile}:`, error);
    return false;
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
