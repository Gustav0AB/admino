import { create } from "zustand";
import type { ClientBranding, ClientFeature } from "@/shared/types/client";

const MOCK_BRANDING: ClientBranding = {
  primaryColor: "#2563EB",
  secondaryColor: "#7C3AED",
  backgroundColor: "#FFFFFF",
  orgName: "Admino",
  logoUrl: null,
};

const MOCK_FEATURES: ClientFeature[] = [
  "payments",
  "training_planning",
  "tracker",
];

type ClientState = {
  branding: ClientBranding;
  features: ClientFeature[];
  isLoaded: boolean;
  loadBranding: () => Promise<void>;
  setBranding: (partial: Partial<ClientBranding>) => void;
  hasFeature: (feature: ClientFeature) => boolean;
};

export const useClientStore = create<ClientState>()((set, get) => ({
  branding: MOCK_BRANDING,
  features: MOCK_FEATURES,
  isLoaded: false,
  loadBranding: async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 600));
    set({ branding: MOCK_BRANDING, features: MOCK_FEATURES, isLoaded: true });
  },
  setBranding: (partial) =>
    set((s) => ({ branding: { ...s.branding, ...partial } })),
  hasFeature: (feature) => get().features.includes(feature),
}));
