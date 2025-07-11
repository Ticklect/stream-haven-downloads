// Electron API type definitions
export interface ElectronAPI {
  downloadFile: (url: string, filename: string) => Promise<{
    success: boolean;
    message: string;
    path?: string;
  }>;
  getAppVersion: () => string;
  getPlatform: () => string;
  isElectron: () => boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};