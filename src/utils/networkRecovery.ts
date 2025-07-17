// Network error recovery and fallback system
// Handles various network issues and provides recovery mechanisms

interface NetworkError {
  type: 'timeout' | 'cors' | 'connection' | 'server' | 'unknown';
  message: string;
  url?: string;
  status?: number;
  retryCount: number;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

class NetworkRecoveryManager {
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  };

  private errorHistory: Record<string, NetworkError[]> = new Map();
  private activeRetries: Set<string> = new Set();

  /**
   * Enhanced fetch with automatic retry and recovery
   */
  async fetchWithRetry(
    url: string, 
    options: RequestInit = {}, 
    customRetryConfig?: Partial<RetryConfig>,
    onError?: (error: NetworkError) => void
  ): Promise<Response> {
    const config = { ...this.retryConfig, ...customRetryConfig };
    const retryKey = `${url}-${JSON.stringify(options)}`;
    
    if (this.activeRetries.has(retryKey)) {
      throw new Error('Request already in progress');
    }

    this.activeRetries.add(retryKey);
    
    try {
      return await this.attemptFetch(url, options, config, retryKey, 0, onError);
    } finally {
      this.activeRetries.delete(retryKey);
    }
  }

  private async attemptFetch(
    url: string, 
    options: RequestInit, 
    config: RetryConfig, 
    retryKey: string,
    attempt: number = 0,
    onError?: (error: NetworkError) => void
  ): Promise<Response> {
    try {
      console.log(`Network request attempt ${attempt + 1}/${config.maxRetries + 1}:`, url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        this.recordSuccess(retryKey);
        return response;
      }
      
      // Handle different HTTP error codes
      const error = this.classifyHttpError(response.status, response.statusText);
      this.recordError(retryKey, error);
      if (onError) onError(error);
      
      if (this.shouldRetry(error, attempt, config)) {
        return await this.retryWithBackoff(url, options, config, retryKey, attempt, error, onError);
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
    } catch (fetchError) {
      const error = this.classifyFetchError(fetchError);
      this.recordError(retryKey, error);
      if (onError) onError(error);
      
      if (this.shouldRetry(error, attempt, config)) {
        return await this.retryWithBackoff(url, options, config, retryKey, attempt, error, onError);
      }
      
      throw fetchError;
    }
  }

  private async retryWithBackoff(
    url: string, 
    options: RequestInit, 
    config: RetryConfig, 
    retryKey: string, 
    attempt: number, 
    error: NetworkError,
    onError?: (error: NetworkError) => void
  ): Promise<Response> {
    const delay = Math.min(
      config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
      config.maxDelay
    );
    console.warn(`Retrying network request in ${delay}ms...`);
    await new Promise(res => setTimeout(res, delay));
    return this.attemptFetch(url, options, config, retryKey, attempt + 1, onError);
  }

  private shouldRetry(error: NetworkError, attempt: number, config: RetryConfig): boolean {
    if (attempt >= config.maxRetries) {
      return false;
    }
    
    // Don't retry certain error types
    if (error.type === 'cors' && attempt > 0) {
      return false; // CORS errors won't be fixed by retrying
    }
    
    return true;
  }

  private classifyHttpError(status: number, statusText: string): NetworkError {
    let type: NetworkError['type'] = 'unknown';
    
    if (status >= 500) {
      type = 'server';
    } else if (status === 0) {
      type = 'connection';
    } else if (status === 403 || status === 401) {
      type = 'cors';
    }
    
    return {
      type,
      message: `HTTP ${status}: ${statusText}`,
      status,
      retryCount: 0
    };
  }

  private classifyFetchError(error: unknown): NetworkError {
    let type: NetworkError['type'] = 'unknown';
    let message = '';
    if (error instanceof Error) {
      message = error.message || 'Unknown fetch error';
      if ((error as { name?: string }).name === 'AbortError') {
        type = 'timeout';
        message = 'Request timeout';
      } else if (message.includes('CORS')) {
        type = 'cors';
        message = 'CORS policy violation';
      } else if (message.includes('Failed to fetch')) {
        type = 'connection';
        message = 'Network connection failed';
      } else if (message.includes('ERR_NETWORK')) {
        type = 'connection';
        message = 'Network error';
      }
    } else {
      message = 'Unknown fetch error';
    }
    return {
      type,
      message,
      retryCount: 0
    };
  }

  private recordError(retryKey: string, error: NetworkError) {
    if (!this.errorHistory[retryKey]) {
      this.errorHistory[retryKey] = [];
    }
    
    const history = this.errorHistory[retryKey];
    history.push({ ...error, retryCount: history.length });
  }

  private recordSuccess(retryKey: string) {
    delete this.errorHistory[retryKey];
  }

  /**
   * Get error statistics for a URL
   */
  getErrorStats(url: string): NetworkError[] {
    return this.errorHistory[url] || [];
  }

  /**
   * Check if a URL has recent errors
   */
  hasRecentErrors(url: string, timeWindow: number = 60000): boolean {
    const errors = this.getErrorStats(url);
    const now = Date.now();
    return errors.some(error => 
      typeof (error as { timestamp?: number }).timestamp === 'number' && (now - (error as { timestamp: number }).timestamp) < timeWindow
    );
  }

  /**
   * Clear error history for a URL
   */
  clearErrorHistory(url: string) {
    delete this.errorHistory[url];
  }

  /**
   * Get alternative URLs for a given URL (for fallback)
   */
  getAlternativeUrls(originalUrl: string): string[] {
    try {
      const url = new URL(originalUrl);
      const alternatives: string[] = [];
      
      // Try different protocols
      if (url.protocol === 'http:') {
        alternatives.push(originalUrl.replace('http:', 'https:'));
      }
      
      // Try different CORS proxies
      const corsProxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(originalUrl)}`,
        `https://cors-anywhere.herokuapp.com/${originalUrl}`,
        `https://thingproxy.freeboard.io/fetch/${originalUrl}`,
        `https://corsproxy.io/?${encodeURIComponent(originalUrl)}`
      ];
      
      alternatives.push(...corsProxies);
      
      return alternatives;
    } catch {
      return [];
    }
  }

  /**
   * Test URL availability
   */
  async testUrlAvailability(url: string, timeout: number = 5000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Find the best available URL from a list
   */
  async findBestUrl(urls: string[]): Promise<string | null> {
    const availabilityChecks = await Promise.allSettled(
      urls.map(url => this.testUrlAvailability(url))
    );
    
    for (let i = 0; i < urls.length; i++) {
      const check = availabilityChecks[i];
      if (check.status === 'fulfilled' && check.value) {
        return urls[i];
      }
    }
    
    return null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const networkRecovery = new NetworkRecoveryManager();

// Export types for external use
export type { NetworkError, RetryConfig }; 