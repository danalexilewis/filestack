/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';

console.log('👋 This message is being logged by "renderer.ts", included via Vite');

document.getElementById('open-workspace')?.addEventListener('click', () => {
  window.electron.openWorkspace();
});

window.electron.onConfigLoaded((views: { name: string }[]) => {
  const contentDiv = document.getElementById('content');
  if (contentDiv) {
    contentDiv.innerHTML = '<h2>Views</h2>';
    const ul = document.createElement('ul');
    views.forEach(view => {
      const li = document.createElement('li');
      li.textContent = view.name;
      ul.appendChild(li);
    });
    contentDiv.appendChild(ul);
  }
});

window.electron.onConfigError((errorMessage: string) => {
  const contentDiv = document.getElementById('content');
  if (contentDiv) {
    contentDiv.innerHTML = `<p style="color: red;">${errorMessage}</p>`;
  }
});
