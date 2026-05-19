import { useThemeStore } from "@/shared/store/themeStore";
import { useClientStore } from "@/shared/store/clientStore";
import { lightColors, darkColors } from "@/shared/theme/colors";

export function useColors() {
  const mode = useThemeStore((s) => s.mode);
  const branding = useClientStore((s) => s.branding);
  const base = mode === "dark" ? darkColors : lightColors;
  return {
    ...base,
    primary: branding.primaryColor || base.primary,
    secondary: branding.secondaryColor || base.secondary,
    background: branding.backgroundColor || base.background,
  };
}
