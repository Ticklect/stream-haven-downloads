/// <reference types="vite/client" />

// Add Tauri global type for window
interface TauriStorage {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

interface Window {
  __TAURI__?: {
    storage: TauriStorage;
  };
}
