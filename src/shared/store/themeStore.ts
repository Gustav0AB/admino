import { create } from "zustand";

type ThemeMode = "light" | "dark";

type ThemeState = {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  mode: "light",
  toggle: () =>
    set((state) => ({ mode: state.mode === "light" ? "dark" : "light" })),
  setMode: (mode) => set({ mode }),
}));
