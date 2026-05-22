import { useClientStore } from "@/shared/store/clientStore";

export function useClientTheme() {
  const branding = useClientStore((s) => s.branding);
  return {
    primaryColor: branding.primaryColor,
    secondaryColor: branding.secondaryColor,
    orgName: branding.orgName,
  };
}
