// main/main.js

import { app, BrowserWindow } from 'electron';
import path from 'path';
import { createServer } from 'http';
import next from 'next';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;

function createWindow() {
  const isDev = !app.isPackaged;

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
    : `http://localhost:${port}`;

  mainWindow.loadURL(startURL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  const isDev = !app.isPackaged;
  const port = process.env.PORT || 3000;

  if (!isDev) {
    // Start Next.js server programmatically
    const nextApp = next({ dev: false, dir: __dirname });
    const handle = nextApp.getRequestHandler();

    await nextApp.prepare();

    const server = createServer((req, res) => {
      handle(req, res);
    });

    server.listen(port, () => {
      console.log(`Next.js server listening on port ${port}`);
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
