// Storage utility that works in both Tauri and web environments
// Enhanced with better error handling and quota management

interface StorageError extends Error {
  code?: string;
  quotaExceeded?: boolean;
  permissionDenied?: boolean;
}

function isTauri() {
  return typeof window !== 'undefined' && '__TAURI__' in window && window.__TAURI__?.storage;
}

// Check storage quota and available space
const checkStorageQuotaInternal = async (): Promise<boolean> => {
  try {
    if (isTauri()) {
      // Tauri handles quota automatically
      return true;
    }
    
    // Test localStorage quota
    const testKey = `quota_test_${Date.now()}`;
    const testValue = 'x'.repeat(1024); // 1KB test
    localStorage.setItem(testKey, testValue);
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.warn('Storage quota check failed:', error);
    return false;
  }
};

// Get storage usage information
const getStorageInfoInternal = async (): Promise<{ used: number; available: number; total: number }> => {
  try {
    if (isTauri()) {
      // Tauri doesn't provide quota info, return estimates
      return { used: 0, available: 1024 * 1024 * 100, total: 1024 * 1024 * 100 }; // 100MB estimate
    }
    
    // Estimate localStorage usage
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        used += (key.length + (value?.length || 0)) * 2; // UTF-16 characters
      }
    }
    
    return { used, available: 1024 * 1024 * 5 - used, total: 1024 * 1024 * 5 }; // 5MB typical limit
  } catch (error) {
    console.warn('Failed to get storage info:', error);
    return { used: 0, available: 1024 * 1024 * 5, total: 1024 * 1024 * 5 };
  }
};

export const get = async (key: string): Promise<string | null> => {
  try {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid storage key');
    }
    
    if (isTauri()) {
      return await window.__TAURI__!.storage.get(key);
    }
    return localStorage.getItem(key);
  } catch (error) {
    console.error('Storage get error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
        const quotaError = new Error('Storage quota exceeded') as StorageError;
        quotaError.quotaExceeded = true;
        throw quotaError;
      }
      if (error.name === 'SecurityError' || error.message.includes('permission')) {
        const permissionError = new Error('Storage permission denied') as StorageError;
        permissionError.permissionDenied = true;
        throw permissionError;
      }
    }
    
    throw error;
  }
};

export const set = async (key: string, value: string): Promise<void> => {
  try {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid storage key');
    }
    
    if (typeof value !== 'string') {
      throw new Error('Storage value must be a string');
    }
    
    // Check quota before storing
    const hasQuota = await checkStorageQuotaInternal();
    if (!hasQuota) {
      const error = new Error('Storage quota exceeded') as StorageError;
      error.quotaExceeded = true;
      throw error;
    }
    
    if (isTauri()) {
      await window.__TAURI__!.storage.set(key, value);
      return;
    }
    
    try {
      localStorage.setItem(key, value);
      // Verify the value was actually stored
      const storedValue = localStorage.getItem(key);
      if (storedValue !== value) {
        throw new Error('Storage verification failed - value not persisted');
      }
    } catch (localError) {
      // Handle localStorage specific errors
      if (localError instanceof Error) {
        if (localError.name === 'QuotaExceededError' || localError.message.includes('quota')) {
          const quotaError = new Error('Storage quota exceeded - cannot save data') as StorageError;
          quotaError.quotaExceeded = true;
          throw quotaError;
        }
        if (localError.name === 'SecurityError' || localError.message.includes('permission')) {
          const permissionError = new Error('Storage permission denied - cannot save data') as StorageError;
          permissionError.permissionDenied = true;
          throw permissionError;
        }
      }
      throw localError;
    }
  } catch (error) {
    console.error('Storage set error:', error);
    throw error;
  }
};

export const remove = async (key: string): Promise<void> => {
  try {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid storage key');
    }
    
    if (isTauri()) {
      await window.__TAURI__!.storage.remove(key);
      return;
    }
    
    try {
      localStorage.removeItem(key);
      // Verify the value was actually removed
      const remainingValue = localStorage.getItem(key);
      if (remainingValue !== null) {
        throw new Error('Storage verification failed - value not removed');
      }
    } catch (localError) {
      // Handle localStorage specific errors
      if (localError instanceof Error) {
        if (localError.name === 'SecurityError' || localError.message.includes('permission')) {
          const permissionError = new Error('Storage permission denied - cannot remove data') as StorageError;
          permissionError.permissionDenied = true;
          throw permissionError;
        }
      }
      throw localError;
    }
  } catch (error) {
    console.error('Storage remove error:', error);
    throw error;
  }
};

export const clear = async (): Promise<void> => {
  try {
    if (isTauri()) {
      await window.__TAURI__!.storage.clear();
      return;
    }
    
    try {
      localStorage.clear();
      // Verify storage was actually cleared
      if (localStorage.length !== 0) {
        throw new Error('Storage verification failed - not all data cleared');
      }
    } catch (localError) {
      // Handle localStorage specific errors
      if (localError instanceof Error) {
        if (localError.name === 'SecurityError' || localError.message.includes('permission')) {
          const permissionError = new Error('Storage permission denied - cannot clear data') as StorageError;
          permissionError.permissionDenied = true;
          throw permissionError;
        }
      }
      throw localError;
    }
  } catch (error) {
    console.error('Storage clear error:', error);
    throw error;
  }
};

// Additional utility functions
export const getStorageInfo = getStorageInfoInternal;
export const checkStorageQuota = checkStorageQuotaInternal;

// Migrate data between storage systems (useful for development)
export const migrateStorage = async (fromTauri: boolean = false): Promise<void> => {
  try {
    if (fromTauri && !isTauri()) {
      console.warn('Cannot migrate from Tauri storage in web environment');
      return;
    }
    
    if (fromTauri) {
      // Migrate from Tauri to localStorage
      // Note: Tauri storage doesn't have a keys() method, so we'll skip this for now
      console.warn('Tauri to localStorage migration not implemented (no keys() method)');
      return;
    } else {
      // Migrate from localStorage to Tauri
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            await window.__TAURI__!.storage.set(key, value);
          }
        }
      }
    }
    
    console.log('Storage migration completed');
  } catch (error) {
    console.error('Storage migration failed:', error);
    throw error;
  }
}; 