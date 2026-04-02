import { useThemeStore } from "@/shared/store/themeStore";
import { lightColors, darkColors } from "@/shared/theme/colors";

export function useColors() {
  const mode = useThemeStore((s) => s.mode);
  return mode === "dark" ? darkColors : lightColors;
}
