const { contextBridge, ipcRenderer } = require('electron');

// Expose secure APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Download functionality
  downloadFile: (url, filename) => {
    return ipcRenderer.invoke('download-file', { url, filename });
  },

  // App info
  getAppVersion: () => {
    return process.env.npm_package_version || '1.0.0';
  },

  // Platform info
  getPlatform: () => {
    return process.platform;
  },

  // Check if running in electron
  isElectron: () => {
    return true;
  }
});

// Security: Remove any node.js globals that might have leaked
delete window.require;
delete window.exports;
delete window.module;