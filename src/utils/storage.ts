// Storage utility that works in both Tauri and web environments

function isTauri() {
  return typeof window !== 'undefined' && '__TAURI__' in window && window.__TAURI__?.storage;
}

export const get = async (key: string): Promise<string | null> => {
  if (isTauri()) {
    return await window.__TAURI__.storage.get(key);
  }
  return localStorage.getItem(key);
};

export const set = async (key: string, value: string): Promise<void> => {
  if (isTauri()) {
    await window.__TAURI__.storage.set(key, value);
    return;
  }
  localStorage.setItem(key, value);
};

export const remove = async (key: string): Promise<void> => {
  if (isTauri()) {
    await window.__TAURI__.storage.remove(key);
    return;
  }
  localStorage.removeItem(key);
};

export const clear = async (): Promise<void> => {
  if (isTauri()) {
    await window.__TAURI__.storage.clear();
    return;
  }
  localStorage.clear();
}; 