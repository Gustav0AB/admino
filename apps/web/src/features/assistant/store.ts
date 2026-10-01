import { create } from "zustand";
import { persist } from "zustand/middleware";
import { userScopedStorage } from "@/shared/store/userScopedStorage";

export type SavedNote = {
  id: string;
  text: string;
  instruction: string;
  createdAt: string;
  summary?: string;
};

type AssistantState = {
  rawNotes: string;
  notes: SavedNote[];
  setRawNotes: (notes: string) => void;
  saveNote: (note: Pick<SavedNote, "text" | "instruction">) => string;
  updateNote: (id: string, patch: Partial<SavedNote>) => void;
  removeNote: (id: string) => void;
};

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set) => ({
      rawNotes: "",
      notes: [],
      setRawNotes: (rawNotes) => set({ rawNotes }),
      saveNote: ({ text, instruction }) => {
        const id = crypto.randomUUID();
        set((state) => ({
          notes: [{ id, text, instruction, createdAt: new Date().toISOString() }, ...state.notes].slice(0, 50),
        }));
        return id;
      },
      updateNote: (id, patch) => set((state) => ({
        notes: state.notes.map((note) => note.id === id ? { ...note, ...patch } : note),
      })),
      removeNote: (id) => set((state) => ({
        notes: state.notes.filter((note) => note.id !== id),
      })),
    }),
    { name: "assistant-notes", storage: userScopedStorage },
  ),
);
