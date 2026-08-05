import { create } from "zustand";
import { ENV } from "@/shared/config/env";
import { useAuthStore } from "@/shared/store/authStore";
import type { ClientBranding, ClientFeature } from "@/shared/types/client";

const DEFAULT_BRANDING: ClientBranding = {
  primaryColor: "#2563EB",
  secondaryColor: "#7C3AED",
  backgroundColor: "#FFFFFF",
  orgName: "Admino",
  slug: "",
  logoUrl: null,
};

type ClientState = {
  branding: ClientBranding;
  features: ClientFeature[];
  loadConfig: () => Promise<void>;
  setBranding: (partial: Partial<ClientBranding>) => void;
  hasFeature: (feature: ClientFeature) => boolean;
};

export const useClientStore = create<ClientState>()((set, get) => ({
  branding: DEFAULT_BRANDING,
  features: [],
  loadConfig: async () => {
    const token = useAuthStore.getState().token;
    const user = useAuthStore.getState().user;

    // SYSTEM_ADMIN sees everything — no org config needed
    if (!token || !user || user.role === "SYSTEM_ADMIN") {
      set({ branding: DEFAULT_BRANDING, features: [] });
      return;
    }

    try {
      const res = await fetch(`${ENV.API_URL}/clients/config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load config");
      const envelope = await res.json() as {
        data: {
          orgName: string;
          slug: string;
          primaryColor: string;
          secondaryColor: string;
          logoUrl: string | null;
          clientPermissions: ClientFeature[];
          memberPermissions: ClientFeature[];
        };
      };
      const d = envelope.data;
      set({
        branding: {
          orgName: d.orgName,
          slug: d.slug ?? "",
          primaryColor: d.primaryColor,
          secondaryColor: d.secondaryColor,
          backgroundColor: "#FFFFFF",
          logoUrl: d.logoUrl,
        },
        features: user.role === "MEMBER" ? d.memberPermissions : d.clientPermissions,
      });
    } catch {}
  },
  setBranding: (partial) =>
    set((s) => ({ branding: { ...s.branding, ...partial } })),
  hasFeature: (feature) => get().features.includes(feature),
}));
