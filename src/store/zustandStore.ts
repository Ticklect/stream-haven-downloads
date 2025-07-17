import { create } from 'zustand';

interface Download {
  id: string;
  title: string;
  url: string;
}

interface GlobalState {
  downloads: Download[];
  addDownload: (download: Download) => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  downloads: [],
  addDownload: (download) => set((state) => ({ downloads: [...state.downloads, download] }))
})); 