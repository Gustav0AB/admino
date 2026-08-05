import { create } from "zustand";
import { persist } from "zustand/middleware";
import { userScopedStorage } from "@/shared/store/userScopedStorage";

// ponytail: raw notes are kept verbatim; user can re-analyze them at any time
type AssistantState = {
  rawNotes: string;
  setRawNotes: (notes: string) => void;
};

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set) => ({
      rawNotes: "",
      setRawNotes: (rawNotes) => set({ rawNotes }),
    }),
    { name: "assistant-notes", storage: userScopedStorage },
  ),
);
