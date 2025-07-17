// Thread-safe download manager for handling concurrent downloads
// Implements mutex-like behavior using async/await patterns
import { validateDownloadUrl, createSecureFilename } from './security';
import { networkRecovery } from './networkRecovery';

interface DownloadRequest {
  id: string;
  title: string;
  type: string;
  url: string;
  filename: string;
  timestamp: number;
}

interface DownloadState {
  id: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  error?: string;
  startTime?: number;
  endTime?: number;
}

class DownloadManager {
  private downloadQueue: DownloadRequest[] = [];
  private activeDownloads: Map<string, DownloadState> = new Map();
  private isProcessing = false;
  private maxConcurrentDownloads = 3; // Limit concurrent downloads
  private downloadTimeout = 30000; // 30 seconds timeout
  private rateLimitDelay = 1000; // 1 second between downloads

  // Mutex-like lock for critical sections
  private processingLock = false;
  private memoryUsageLimit = 1024 * 1024 * 100; // 100MB
  private cleanupInterval = 1000 * 60 * 5; // 5 minutes
  private circuitBreakerOpen = false;
  private circuitBreakerTimeout = 1000 * 60; // 1 minute
  private failureThreshold = 5;
  private failureCount = 0;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private memoryMonitorTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.cleanupStaleDownloads();
    this.setupAutoCleanup();
    this.setupMemoryMonitoring();
    this.setupCircuitBreaker();
  }

  /**
   * Thread-safe method to add a download to the queue
   */
  async addDownload(title: string, type: string, url: string): Promise<string> {
    const downloadId = this.generateDownloadId();
    
    const request: DownloadRequest = {
      id: downloadId,
      title,
      type,
      url,
      filename: this.createSecureFilename(title, type),
      timestamp: Date.now()
    };

    // Add to queue atomically
    this.downloadQueue.push(request);
    
    // Initialize download state
    this.activeDownloads.set(downloadId, {
      id: downloadId,
      status: 'pending'
    });

    console.log(`[DownloadManager] Added download to queue: ${downloadId} - ${title}`);
    
    // Start processing if not already running
    this.processQueue();
    
    return downloadId;
  }

  private setupAutoCleanup() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    this.cleanupTimer = setInterval(() => {
      this.cleanupStaleDownloads();
    }, this.cleanupInterval);
  }

  private setupMemoryMonitoring() {
    if (this.memoryMonitorTimer) clearInterval(this.memoryMonitorTimer);
    this.memoryMonitorTimer = setInterval(() => {
      const used = this.estimateMemoryUsage();
      if (used > this.memoryUsageLimit) {
        console.warn('[DownloadManager] Memory usage exceeded limit, clearing completed downloads');
        this.clearCompletedDownloads();
      }
    }, 1000 * 60); // Check every minute
  }

  private estimateMemoryUsage(): number {
    // Simple estimation: count active downloads * average size (simulate)
    return this.activeDownloads.size * 1024 * 1024 * 2; // Assume 2MB per download (adjust as needed)
  }

  private setupCircuitBreaker() {
    // Reset circuit breaker after timeout
    setInterval(() => {
      if (this.circuitBreakerOpen) {
        this.circuitBreakerOpen = false;
        this.failureCount = 0;
        console.log('[DownloadManager] Circuit breaker reset');
      }
    }, this.circuitBreakerTimeout);
  }

  private openCircuitBreaker() {
    this.circuitBreakerOpen = true;
    setTimeout(() => {
      this.circuitBreakerOpen = false;
      this.failureCount = 0;
      console.log('[DownloadManager] Circuit breaker auto-reset');
    }, this.circuitBreakerTimeout);
  }

  /**
   * Thread-safe method to process the download queue
   */
  private async processQueue(): Promise<void> {
    // Use mutex-like behavior to prevent concurrent processing
    if (this.processingLock) {
      console.log('[DownloadManager] Queue processing already in progress, skipping');
      return;
    }
    if (this.circuitBreakerOpen) {
      console.warn('[DownloadManager] Circuit breaker is open, skipping queue processing');
      return;
    }

    this.processingLock = true;

    try {
      while (this.downloadQueue.length > 0 && this.getActiveDownloadCount() < this.maxConcurrentDownloads) {
        const request = this.downloadQueue.shift();
        if (request) {
          // Process download asynchronously
          this.processDownload(request).catch(error => {
            console.error(`[DownloadManager] Error processing download ${request.id}:`, error);
            this.updateDownloadState(request.id, 'failed', undefined, error.message);
            this.failureCount++;
            if (this.failureCount >= this.failureThreshold) {
              this.openCircuitBreaker();
            }
          });
          
          // Rate limiting between downloads
          if (this.downloadQueue.length > 0) {
            await this.delay(this.rateLimitDelay);
          }
        }
      }
    } finally {
      this.processingLock = false;
    }
  }

  /**
   * Process a single download with proper error handling and network recovery
   */
  private async processDownload(request: DownloadRequest): Promise<void> {
    console.log(`[DownloadManager] Starting download: ${request.id} - ${request.title}`);
    
    this.updateDownloadState(request.id, 'downloading', 0);
    
    try {
      // Enhanced URL validation with security checks
      const urlValidation = validateDownloadUrl(request.url);
      if (!urlValidation.isValid) {
        throw new Error(urlValidation.error || 'Invalid download URL');
      }

      // Use validated URL
      const validatedUrl = urlValidation.sanitizedUrl || request.url;

      // Try multiple download strategies
      await this.tryDownloadStrategies(request, validatedUrl);
      
      this.updateDownloadState(request.id, 'completed', 100);
      console.log(`[DownloadManager] Download completed: ${request.id}`);
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`[DownloadManager] Download failed: ${request.id}`, err);
      this.updateDownloadState(request.id, 'failed', 0, err.message);
    }
  }

  /**
   * Try multiple download strategies with fallback
   */
  private async tryDownloadStrategies(request: DownloadRequest, url: string): Promise<void> {
    const strategies = [
      // Strategy 1: Direct download
      () => this.createDownloadLink({ ...request, url }),
      
      // Strategy 2: Network recovery with retry
      async () => {
        const response = await networkRecovery.fetchWithRetry(url, {
          method: 'HEAD'
        });
        
        if (response.ok) {
          return this.createDownloadLink({ ...request, url });
        }
        throw new Error(`URL not accessible: ${response.status}`);
      },
      
      // Strategy 3: Try alternative URLs
      async () => {
        const alternatives = networkRecovery.getAlternativeUrls(url);
        const bestUrl = await networkRecovery.findBestUrl(alternatives);
        
        if (bestUrl) {
          return this.createDownloadLink({ ...request, url: bestUrl });
        }
        throw new Error('No alternative URLs available');
      }
    ];

    let lastError: Error | null = null;
    
    for (let i = 0; i < strategies.length; i++) {
      try {
        console.log(`[DownloadManager] Trying download strategy ${i + 1} for ${request.id}`);
        await strategies[i]();
        return; // Success
      } catch (error) {
        lastError = error as Error;
        console.warn(`[DownloadManager] Strategy ${i + 1} failed for ${request.id}:`, error);
        
        if (i < strategies.length - 1) {
          // Wait before trying next strategy
          await this.delay(2000);
        }
      }
    }
    
    throw lastError || new Error('All download strategies failed');
  }

  /**
   * Create download link with proper DOM manipulation
   */
  private async createDownloadLink(request: DownloadRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create download link
        const link = document.createElement('a');
        link.href = request.url;
        link.download = request.filename;
        link.rel = 'noopener noreferrer';
        link.target = '_blank';
        
        // Add event listeners for tracking
        link.addEventListener('click', () => {
          console.log(`[DownloadManager] Download link clicked: ${request.id}`);
        });
        
        link.addEventListener('error', (error) => {
          console.error(`[DownloadManager] Download link error: ${request.id}`, error);
          reject(new Error('Download link creation failed'));
        });
        
        // Add to DOM, click, then remove atomically
        document.body.appendChild(link);
        link.click();
        
        // Use setTimeout to ensure the click event is processed
        setTimeout(() => {
          try {
            document.body.removeChild(link);
            resolve();
          } catch (error) {
            console.warn(`[DownloadManager] Error removing download link: ${request.id}`, error);
            resolve(); // Don't fail the download if cleanup fails
          }
        }, 100);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Thread-safe method to cancel a download
   */
  async cancelDownload(downloadId: string): Promise<boolean> {
    const download = this.activeDownloads.get(downloadId);
    if (!download) {
      return false;
    }

    if (download.status === 'pending') {
      // Remove from queue
      this.downloadQueue = this.downloadQueue.filter(req => req.id !== downloadId);
    }

    this.updateDownloadState(downloadId, 'cancelled');
    console.log(`[DownloadManager] Download cancelled: ${downloadId}`);
    
    return true;
  }

  /**
   * Thread-safe method to get download status
   */
  getDownloadStatus(downloadId: string): DownloadState | null {
    return this.activeDownloads.get(downloadId) || null;
  }

  /**
   * Thread-safe method to get all active downloads
   */
  getAllDownloads(): DownloadState[] {
    return Array.from(this.activeDownloads.values());
  }

  /**
   * Thread-safe method to get queue status
   */
  getQueueStatus(): { queueLength: number; activeDownloads: number; maxConcurrent: number } {
    return {
      queueLength: this.downloadQueue.length,
      activeDownloads: this.getActiveDownloadCount(),
      maxConcurrent: this.maxConcurrentDownloads
    };
  }

  /**
   * Thread-safe method to clear completed downloads
   */
  clearCompletedDownloads(): void {
    for (const [id, download] of this.activeDownloads.entries()) {
      if (download.status === 'completed' || download.status === 'failed' || download.status === 'cancelled') {
        this.activeDownloads.delete(id);
      }
    }
  }

  /**
   * Update download state atomically
   */
  private updateDownloadState(id: string, status: DownloadState['status'], progress?: number, error?: string): void {
    const state = this.activeDownloads.get(id);
    if (state) {
      state.status = status;
      state.progress = progress !== undefined ? progress : 0;
      if (error) state.error = error;
      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        state.endTime = Date.now();
      }
    }
  }

  /**
   * Get count of currently active downloads
   */
  private getActiveDownloadCount(): number {
    return Array.from(this.activeDownloads.values()).filter(
      download => download.status === 'downloading'
    ).length;
  }

  /**
   * Generate unique download ID
   */
  private generateDownloadId(): string {
    return `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create secure filename using security utility
   */
  private createSecureFilename(title: string, type: string): string {
    return createSecureFilename(title, type);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up stale downloads (older than 1 hour)
   */
  private cleanupStaleDownloads(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [id, download] of this.activeDownloads.entries()) {
      if (download.endTime && download.endTime < oneHourAgo) {
        this.activeDownloads.delete(id);
      }
    }
  }

  /**
   * Retry a failed download by re-queuing it
   */
  async retryDownload(downloadId: string): Promise<boolean> {
    const state = this.getDownloadStatus(downloadId);
    if (!state || state.status !== 'failed') {
      console.warn(`[DownloadManager] Cannot retry download: ${downloadId} is not failed or does not exist`);
      return false;
    }
    // Find the original request (from activeDownloads or reconstruct)
    const original = Array.from(this.activeDownloads.values()).find(d => d.id === downloadId);
    if (!original) {
      console.warn(`[DownloadManager] Cannot retry download: original request not found`);
      return false;
    }
    // Reset state and re-queue
    this.updateDownloadState(downloadId, 'pending', 0, undefined);
    this.downloadQueue.push({
      id: downloadId,
      title: typeof (original as unknown as Record<string, unknown>).title === 'string' ? (original as unknown as Record<string, unknown>).title as string : 'Unknown',
      type: typeof (original as unknown as Record<string, unknown>).type === 'string' ? (original as unknown as Record<string, unknown>).type as string : 'unknown',
      url: typeof (original as unknown as Record<string, unknown>).url === 'string' ? (original as unknown as Record<string, unknown>).url as string : '',
      filename: typeof (original as unknown as Record<string, unknown>).filename === 'string' ? (original as unknown as Record<string, unknown>).filename as string : 'download',
      timestamp: Date.now()
    });
    this.processQueue();
    return true;
  }
}

// Export an instance
export const downloadManager = new DownloadManager();

// Export types for external use
export type { DownloadRequest, DownloadState }; 