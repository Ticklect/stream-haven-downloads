import { useState, useEffect, useCallback } from 'react';
import { downloadManager, type DownloadState } from '@/utils/downloadManager';
import { validateDownloadUrl } from '@/utils/security';

interface UseDownloadManagerReturn {
  // Download actions
  startDownload: (title: string, type: string, url: string) => Promise<string | null>;
  cancelDownload: (downloadId: string) => Promise<boolean>;
  
  // State
  downloads: DownloadState[];
  activeDownloads: DownloadState[];
  pendingDownloads: DownloadState[];
  completedDownloads: DownloadState[];
  failedDownloads: DownloadState[];
  
  // Queue status
  queueLength: number;
  activeDownloadCount: number;
  maxConcurrentDownloads: number;
  
  // Utility functions
  clearCompletedDownloads: () => void;
  getDownloadStatus: (downloadId: string) => DownloadState | null;
}

export const useDownloadManager = (): UseDownloadManagerReturn => {
  const [downloads, setDownloads] = useState<DownloadState[]>([]);
  const [queueStatus, setQueueStatus] = useState({
    queueLength: 0,
    activeDownloads: 0,
    maxConcurrent: 3
  });

  // Update downloads state
  const updateDownloads = useCallback(() => {
    const allDownloads = downloadManager.getAllDownloads();
    setDownloads(allDownloads);
    
    const status = downloadManager.getQueueStatus();
    setQueueStatus(status);
  }, []);

  // Set up polling for download status updates
  useEffect(() => {
    updateDownloads();
    
    // Poll for updates every 500ms
    const interval = setInterval(updateDownloads, 500);
    
    return () => clearInterval(interval);
  }, [updateDownloads]);

  // Start a new download with validation
  const startDownload = useCallback(async (
    title: string, 
    type: string, 
    url: string
  ): Promise<string | null> => {
    try {
      // Validate download URL
      const urlValidation = validateDownloadUrl(url);
      if (!urlValidation.isValid) {
        console.error('Download URL validation failed:', urlValidation.error);
        throw new Error(urlValidation.error || 'Invalid download URL');
      }

      // Add to download manager
      const downloadId = await downloadManager.addDownload(title, type, url);
      
      console.log(`[useDownloadManager] Download started: ${downloadId} - ${title}`);
      return downloadId;
      
    } catch (error) {
      console.error('[useDownloadManager] Failed to start download:', error);
      throw error;
    }
  }, []);

  // Cancel a download
  const cancelDownload = useCallback(async (downloadId: string): Promise<boolean> => {
    try {
      const success = await downloadManager.cancelDownload(downloadId);
      if (success) {
        console.log(`[useDownloadManager] Download cancelled: ${downloadId}`);
      }
      return success;
    } catch (error) {
      console.error(`[useDownloadManager] Failed to cancel download ${downloadId}:`, error);
      return false;
    }
  }, []);

  // Get download status
  const getDownloadStatus = useCallback((downloadId: string): DownloadState | null => {
    return downloadManager.getDownloadStatus(downloadId);
  }, []);

  // Clear completed downloads
  const clearCompletedDownloads = useCallback(() => {
    downloadManager.clearCompletedDownloads();
    updateDownloads();
  }, [updateDownloads]);

  // Computed properties for different download states
  const activeDownloads = downloads.filter(d => d.status === 'downloading');
  const pendingDownloads = downloads.filter(d => d.status === 'pending');
  const completedDownloads = downloads.filter(d => d.status === 'completed');
  const failedDownloads = downloads.filter(d => d.status === 'failed');

  return {
    // Actions
    startDownload,
    cancelDownload,
    
    // State
    downloads,
    activeDownloads,
    pendingDownloads,
    completedDownloads,
    failedDownloads,
    
    // Queue status
    queueLength: queueStatus.queueLength,
    activeDownloadCount: queueStatus.activeDownloads,
    maxConcurrentDownloads: queueStatus.maxConcurrent,
    
    // Utilities
    clearCompletedDownloads,
    getDownloadStatus
  };
}; 