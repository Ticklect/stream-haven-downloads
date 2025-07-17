import { Store } from '@tauri-apps/plugin-store';
// As of the latest Tauri Plugin Store, instantiate directly (constructor is private, but this is the only way in some versions)
// If this fails at runtime, consult the plugin's README for the correct usage
export const tauriStore = new (Store as any)('app-data'); 