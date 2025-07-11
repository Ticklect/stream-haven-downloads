const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Security: Disable node integration and enable context isolation
const isDev = process.env.NODE_ENV === 'development';
const port = process.env.PORT || 5173;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'public/favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'electron-preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    titleBarStyle: 'default',
    show: false
  });

  // Load the app
  const startUrl = isDev 
    ? `http://localhost:${port}` 
    : `file://${path.join(__dirname, '../dist/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle external links - open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Security: Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== startUrl && !isDev) {
      event.preventDefault();
    }
  });

  return mainWindow;
}

// App event handlers
app.whenReady().then(() => {
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

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// IPC handlers for secure file operations
ipcMain.handle('download-file', async (event, { url, filename }) => {
  try {
    // Show save dialog
    const result = await dialog.showSaveDialog({
      defaultPath: filename,
      filters: [
        { name: 'Video Files', extensions: ['mp4', 'avi', 'mkv', 'mov'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePath) {
      // In a real app, you would implement the actual download logic here
      // For security, we'll just show a message
      return {
        success: true,
        message: 'Download initiated. This is a demo - actual downloads would be implemented with proper security.',
        path: result.filePath
      };
    }

    return { success: false, message: 'Download cancelled' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Handle app protocol for security
app.setAsDefaultProtocolClient('streamhaven');

// Security: Disable insecure permissions
app.on('web-contents-created', (event, contents) => {
  contents.on('permission-request', (event, permission, callback) => {
    const allowedPermissions = ['media', 'microphone', 'camera'];
    
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });
});