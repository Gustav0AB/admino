import type { ClientBranding } from "@/shared/types/client";
import type { ApiResponse } from "@/shared/types/api";

export const mockGetOrganizationBranding: ApiResponse<ClientBranding> = {
  status: 200,
  message: "OK",
  data: {
    orgName: "Demo Athletics",
    slug: "demo-athletics",
    primaryColor: "#2563EB",
    secondaryColor: "#1E40AF",
    backgroundColor: "#FFFFFF",
    logoUrl: null,
  },
};
