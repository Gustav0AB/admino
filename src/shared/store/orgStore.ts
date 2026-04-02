import { create } from "zustand";
import type { OrgBranding } from "@/shared/types/organization";

const MOCK_BRANDING: OrgBranding = {
  primaryColor: "#2563EB",
  secondaryColor: "#7C3AED",
  orgName: "Admino Sports",
  logoUrl: null,
};

type OrgState = {
  branding: OrgBranding;
  isLoaded: boolean;
  loadBranding: () => Promise<void>;
};

export const useOrgStore = create<OrgState>()((set) => ({
  branding: MOCK_BRANDING,
  isLoaded: false,
  loadBranding: async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 600));
    set({ branding: MOCK_BRANDING, isLoaded: true });
  },
}));
