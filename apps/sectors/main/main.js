// main/main.js

import { app, BrowserWindow } from 'electron';
import path from 'path';
// Remove import of 'electron-is-dev'
// import isDev from 'electron-is-dev';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;
let nextProcess;

function createWindow() {
  const isDev = !app.isPackaged; // Use app.isPackaged

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const port = process.env.PORT || 3000;
  const startURL = isDev
    ? `http://localhost:${port}`
    : `http://localhost:${port}`; // Adjust this in the next step

  mainWindow.loadURL(startURL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  const isDev = !app.isPackaged; // Use app.isPackaged

  if (!isDev) {
    // Start Next.js in production mode
    nextProcess = spawn('npm', ['start'], {
      shell: true,
      env: { ...process.env, PORT: 3000 },
      stdio: 'inherit',
    });
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (nextProcess) nextProcess.kill();
});
