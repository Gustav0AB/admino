import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useAuthStore } from "@/shared/store/authStore";

// ponytail: raw notes are kept verbatim; user can re-analyze them at any time
type AssistantState = {
  rawNotes: string;
  setRawNotes: (notes: string) => void;
};

const userScopedStorage = createJSONStorage(() => ({
  getItem: (name: string) => localStorage.getItem(`${name}-${useAuthStore.getState().user?.id ?? "anonymous"}`),
  setItem: (name: string, value: string) => localStorage.setItem(`${name}-${useAuthStore.getState().user?.id ?? "anonymous"}`, value),
  removeItem: (name: string) => localStorage.removeItem(`${name}-${useAuthStore.getState().user?.id ?? "anonymous"}`),
}));

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set) => ({
      rawNotes: "",
      setRawNotes: (rawNotes) => set({ rawNotes }),
    }),
    { name: "assistant-notes", storage: userScopedStorage },
  ),
);
