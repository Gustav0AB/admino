import { createTamagui } from "@tamagui/core";
import { config } from "@tamagui/config/v3";

const appConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
    light: {
      ...config.themes.light,
      orgPrimary: "#2563EB",
      orgPrimaryForeground: "#FFFFFF",
      orgSecondary: "#7C3AED",
      orgSecondaryForeground: "#FFFFFF",
    },
    dark: {
      ...config.themes.dark,
      orgPrimary: "#3B82F6",
      orgPrimaryForeground: "#FFFFFF",
      orgSecondary: "#8B5CF6",
      orgSecondaryForeground: "#FFFFFF",
    },
  },
});

export type AppConfig = typeof appConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default appConfig;
