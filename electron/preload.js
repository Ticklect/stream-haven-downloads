// Preload script for Electron security
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Add any secure APIs needed here
});