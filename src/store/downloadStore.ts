import type { DownloadRequest } from '../utils/downloadManager';

export class DownloadStore {
  private static instance: DownloadStore;
  private downloads = new Map<string, DownloadRequest>();

  private constructor() {}

  static getInstance() {
    if (!DownloadStore.instance) {
      DownloadStore.instance = new DownloadStore();
    }
    return DownloadStore.instance;
  }

  addDownload(id: string, download: DownloadRequest) {
    this.downloads.set(id, download);
    this.persist();
  }

  persist() {
    // TODO: Implement persistent storage (localStorage, Tauri, etc.)
    // For now, just log
    console.log('[DownloadStore] Persisting downloads:', Array.from(this.downloads.keys()));
  }
} 