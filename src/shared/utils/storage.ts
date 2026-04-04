import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

type StorageDriver = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
};

const webSecureDriver: StorageDriver = {
  get:    (key) => Promise.resolve(localStorage.getItem(key)),
  set:    (key, value) => { localStorage.setItem(key, value); return Promise.resolve(); },
  remove: (key) => { localStorage.removeItem(key); return Promise.resolve(); },
};

const nativeSecureDriver: StorageDriver = {
  get:    (key) => SecureStore.getItemAsync(key),
  set:    (key, value) => SecureStore.setItemAsync(key, value),
  remove: (key) => SecureStore.deleteItemAsync(key),
};

const asyncDriver: StorageDriver = {
  get:    (key) => AsyncStorage.getItem(key),
  set:    (key, value) => AsyncStorage.setItem(key, value),
  remove: (key) => AsyncStorage.removeItem(key),
};

export const secureStorage: StorageDriver =
  Platform.OS === "web" ? webSecureDriver : nativeSecureDriver;

export const appStorage: StorageDriver = asyncDriver;

export const StorageKeys = {
  AUTH_TOKEN:   "auth_token",
  THEME_MODE:   "theme_mode",
  LANGUAGE:     "language",
  LAST_SESSION: "last_session",
} as const;
