import { useOrgStore } from "@/shared/store/orgStore";

export function useOrgTheme() {
  const branding = useOrgStore((s) => s.branding);
  return {
    primaryColor: branding.primaryColor,
    secondaryColor: branding.secondaryColor,
    orgName: branding.orgName,
  };
}
