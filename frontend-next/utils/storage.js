/**
 * Storage utility to safely interact with localStorage
 * with fallbacks for environments where localStorage is not available
 */
import logger from './logger';

// In-memory fallback when localStorage is not available
const memoryStorage = new Map();

// Check if localStorage is available
const isLocalStorageAvailable = () => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    logger.warn('localStorage is not available, using memory storage fallback');
    return false;
  }
};

// Storage utility methods
const storage = {
  /**
   * Set an item in storage
   * @param {string} key - The key to store the value under
   * @param {any} value - The value to store
   */
  setItem: (key, value) => {
    try {
      if (isLocalStorageAvailable()) {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      } else {
        memoryStorage.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error('Error setting storage item', { key, error });
      return false;
    }
  },

  /**
   * Get an item from storage
   * @param {string} key - The key to retrieve
   * @param {any} defaultValue - Default value if key doesn't exist
   * @returns {any} The stored value or defaultValue if not found
   */
  getItem: (key, defaultValue = null) => {
    try {
      if (isLocalStorageAvailable()) {
        const item = localStorage.getItem(key);
        if (item === null) return defaultValue;
        
        try {
          return JSON.parse(item);
        } catch {
          return item; // Return as is if not valid JSON
        }
      } else {
        return memoryStorage.has(key) ? memoryStorage.get(key) : defaultValue;
      }
    } catch (error) {
      logger.error('Error getting storage item', { key, error });
      return defaultValue;
    }
  },

  /**
   * Remove an item from storage
   * @param {string} key - The key to remove
   */
  removeItem: (key) => {
    try {
      if (isLocalStorageAvailable()) {
        localStorage.removeItem(key);
      } else {
        memoryStorage.delete(key);
      }
      return true;
    } catch (error) {
      logger.error('Error removing storage item', { key, error });
      return false;
    }
  },

  /**
   * Clear all items from storage
   */
  clear: () => {
    try {
      if (isLocalStorageAvailable()) {
        localStorage.clear();
      } else {
        memoryStorage.clear();
      }
      return true;
    } catch (error) {
      logger.error('Error clearing storage', { error });
      return false;
    }
  }
};

export default storage; 