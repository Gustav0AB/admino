type StorageDriver = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
};

const localStorageDriver: StorageDriver = {
  get:    (key) => Promise.resolve(localStorage.getItem(key)),
  set:    (key, value) => { localStorage.setItem(key, value); return Promise.resolve(); },
  remove: (key) => { localStorage.removeItem(key); return Promise.resolve(); },
};

export const secureStorage: StorageDriver = localStorageDriver;
export const appStorage: StorageDriver = localStorageDriver;

export const StorageKeys = {
  AUTH_TOKEN:   "auth_token",
  THEME_MODE:   "theme_mode",
  LANGUAGE:     "language",
  LAST_SESSION: "last_session",
} as const;
