import { createJSONStorage } from "zustand/middleware";
import { useAuthStore } from "./authStore";

function keyFor(name: string) {
  return `${name}-${useAuthStore.getState().user?.id ?? "anonymous"}`;
}

export const userScopedStorage = createJSONStorage(() => ({
  getItem: (name: string) => localStorage.getItem(keyFor(name)),
  setItem: (name: string, value: string) => localStorage.setItem(keyFor(name), value),
  removeItem: (name: string) => localStorage.removeItem(keyFor(name)),
}));
