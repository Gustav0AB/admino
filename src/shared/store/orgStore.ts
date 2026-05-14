import { create } from "zustand";
import type { OrgBranding, OrgFeature } from "@/shared/types/organization";

const MOCK_BRANDING: OrgBranding = {
  primaryColor: "#2563EB",
  secondaryColor: "#7C3AED",
  orgName: "Admino Sports",
  logoUrl: null,
};

// Mock: which features this org has enabled. A SYSTEM_ADMIN sees all features always.
const MOCK_FEATURES: OrgFeature[] = ["payments", "training_planning", "tracker"];

type OrgState = {
  branding: OrgBranding;
  features: OrgFeature[];
  isLoaded: boolean;
  loadBranding: () => Promise<void>;
  hasFeature: (feature: OrgFeature) => boolean;
};

export const useOrgStore = create<OrgState>()((set, get) => ({
  branding: MOCK_BRANDING,
  features: MOCK_FEATURES,
  isLoaded: false,
  loadBranding: async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 600));
    set({ branding: MOCK_BRANDING, features: MOCK_FEATURES, isLoaded: true });
  },
  hasFeature: (feature) => get().features.includes(feature),
}));
