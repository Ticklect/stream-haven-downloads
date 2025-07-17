import { Store } from '@tauri-apps/plugin-store';

// As of the latest Tauri Plugin Store, instantiate directly
// Using proper type assertion instead of any
export const tauriStore = new (Store as typeof Store & { new(path: string): Store })('app-data'); 