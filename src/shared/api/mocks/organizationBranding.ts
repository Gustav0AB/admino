import type { OrgBranding } from "@/shared/types/organization";
import type { ApiResponse } from "@/shared/types/api";

export const mockGetOrganizationBranding: ApiResponse<OrgBranding> = {
  status: 200,
  message: "OK",
  data: {
    orgName: "Demo Athletics",
    primaryColor: "#2563EB",
    secondaryColor: "#1E40AF",
    logoUrl: null,
  },
};
