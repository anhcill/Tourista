import { STORAGE_KEYS } from "./constants";

const hasWindow = () => typeof window !== "undefined";

const readStorage = (storage, key) => {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (storage, key, value) => {
  try {
    storage.setItem(key, value);
  } catch {
    // Ignore storage quota / privacy mode errors.
  }
};

const removeStorage = (storage, key) => {
  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage errors.
  }
};

const readTokenWithMigration = (key) => {
  if (!hasWindow()) return null;

  const sessionToken = readStorage(window.sessionStorage, key);
  if (sessionToken) return sessionToken;

  const legacyToken = readStorage(window.localStorage, key);
  if (legacyToken) {
    writeStorage(window.sessionStorage, key, legacyToken);
    removeStorage(window.localStorage, key);
  }

  return legacyToken;
};

export const getAccessToken = () => readTokenWithMigration(STORAGE_KEYS.TOKEN);

export const setAccessToken = (token) => {
  if (!hasWindow()) return;

  if (!token) {
    removeStorage(window.sessionStorage, STORAGE_KEYS.TOKEN);
    removeStorage(window.localStorage, STORAGE_KEYS.TOKEN);
    return;
  }

  writeStorage(window.sessionStorage, STORAGE_KEYS.TOKEN, token);
  removeStorage(window.localStorage, STORAGE_KEYS.TOKEN);
};

export const getRefreshToken = () =>
  readTokenWithMigration(STORAGE_KEYS.REFRESH_TOKEN);

export const setRefreshToken = (token) => {
  if (!hasWindow()) return;

  if (!token) {
    removeStorage(window.sessionStorage, STORAGE_KEYS.REFRESH_TOKEN);
    removeStorage(window.localStorage, STORAGE_KEYS.REFRESH_TOKEN);
    return;
  }

  writeStorage(window.sessionStorage, STORAGE_KEYS.REFRESH_TOKEN, token);
  removeStorage(window.localStorage, STORAGE_KEYS.REFRESH_TOKEN);
};

export const clearAuthTokens = () => {
  if (!hasWindow()) return;

  removeStorage(window.sessionStorage, STORAGE_KEYS.TOKEN);
  removeStorage(window.sessionStorage, STORAGE_KEYS.REFRESH_TOKEN);
  removeStorage(window.localStorage, STORAGE_KEYS.TOKEN);
  removeStorage(window.localStorage, STORAGE_KEYS.REFRESH_TOKEN);
};
