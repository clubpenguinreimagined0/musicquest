import { encrypt, decrypt } from './encryption';

export const StorageType = {
  LOCAL: 'localStorage',
  SESSION: 'sessionStorage',
  MEMORY: 'memory'
};

let memoryStorage = {};

export const setItem = (key, value, storageType = StorageType.LOCAL, shouldEncrypt = false) => {
  try {
    const dataToStore = shouldEncrypt ? encrypt(value) : value;

    if (storageType === StorageType.MEMORY) {
      memoryStorage[key] = dataToStore;
    } else {
      const storage = storageType === StorageType.SESSION ? sessionStorage : localStorage;
      storage.setItem(key, dataToStore);
    }
    return true;
  } catch (error) {
    console.error(`Failed to set item ${key}:`, error);
    return false;
  }
};

export const getItem = (key, storageType = StorageType.LOCAL, isEncrypted = false) => {
  try {
    let data;

    if (storageType === StorageType.MEMORY) {
      data = memoryStorage[key];
    } else {
      const storage = storageType === StorageType.SESSION ? sessionStorage : localStorage;
      data = storage.getItem(key);
    }

    if (!data) return null;

    return isEncrypted ? decrypt(data) : data;
  } catch (error) {
    console.error(`Failed to get item ${key}:`, error);
    return null;
  }
};

export const removeItem = (key, storageType = StorageType.LOCAL) => {
  try {
    if (storageType === StorageType.MEMORY) {
      delete memoryStorage[key];
    } else {
      const storage = storageType === StorageType.SESSION ? sessionStorage : localStorage;
      storage.removeItem(key);
    }
    return true;
  } catch (error) {
    console.error(`Failed to remove item ${key}:`, error);
    return false;
  }
};

export const clearMemoryStorage = () => {
  memoryStorage = {};
};

export const clearAllStorage = () => {
  localStorage.clear();
  sessionStorage.clear();
  clearMemoryStorage();
};
