// Mock for @tauri-apps/api/storage for web/dev environments
// Enhanced with better error handling and data validation

const STORAGE_PREFIX = 'tauri_mock_';

// Validate data before storage
const validateData = (key, value) => {
  if (typeof key !== 'string' || key.length === 0) {
    throw new Error('Invalid storage key');
  }
  if (typeof value !== 'string') {
    throw new Error('Storage value must be a string');
  }
  if (value.length > 1024 * 1024) { // 1MB limit
    throw new Error('Storage value too large');
  }
};

// Check storage quota
const checkStorageQuota = () => {
  try {
    const testKey = `${STORAGE_PREFIX}quota_test_${Date.now()}`;
    const testValue = 'x'.repeat(1024); // 1KB test
    localStorage.setItem(testKey, testValue);
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.warn('Storage quota exceeded:', error);
    return false;
  }
};

export const get = async (key) => {
  try {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid key provided to storage.get');
    }
    
    const fullKey = `${STORAGE_PREFIX}${key}`;
    const value = localStorage.getItem(fullKey);
    
    console.log('Mock storage get:', key, value ? '(found)' : '(not found)');
    return value;
  } catch (error) {
    console.error('Mock storage get error:', error);
    throw error;
  }
};

export const set = async (key, value) => {
  try {
    validateData(key, value);
    
    if (!checkStorageQuota()) {
      throw new Error('Storage quota exceeded');
    }
    
    const fullKey = `${STORAGE_PREFIX}${key}`;
    localStorage.setItem(fullKey, value);
    
    console.log('Mock storage set:', key, `(${value.length} chars)`);
  } catch (error) {
    console.error('Mock storage set error:', error);
    throw error;
  }
};

export const remove = async (key) => {
  try {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid key provided to storage.remove');
    }
    
    const fullKey = `${STORAGE_PREFIX}${key}`;
    localStorage.removeItem(fullKey);
    
    console.log('Mock storage remove:', key);
  } catch (error) {
    console.error('Mock storage remove error:', error);
    throw error;
  }
};

export const clear = async () => {
  try {
    // Only clear keys with our prefix to avoid affecting other app data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log('Mock storage clear:', `${keysToRemove.length} items removed`);
  } catch (error) {
    console.error('Mock storage clear error:', error);
    throw error;
  }
};

export default {
  get,
  set,
  remove,
  clear
}; 