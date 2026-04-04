import { create } from "zustand";

type SidebarStore = {
  isExpanded: boolean;
  toggle: () => void;
};

export const useSidebarStore = create<SidebarStore>((set) => ({
  isExpanded: false, // starts collapsed (icon-only)
  toggle: () => set((s) => ({ isExpanded: !s.isExpanded })),
}));
