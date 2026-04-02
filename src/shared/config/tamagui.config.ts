import { createTamagui, createTokens, createFont } from "@tamagui/core";
import { shorthands } from "@tamagui/shorthands";
import { themes, tokens as baseTokens } from "@tamagui/themes";
import { animations } from "@tamagui/config/v3";

const interFont = createFont({
  family: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  size: {
    1: 11,
    2: 12,
    3: 13,
    4: 14,
    5: 16,
    6: 18,
    7: 20,
    8: 23,
    9: 30,
    10: 46,
    11: 55,
    12: 62,
    13: 72,
    14: 92,
    15: 114,
    16: 134,
  },
  lineHeight: {
    1: 17,
    2: 18,
    3: 19,
    4: 20,
    5: 22,
    6: 24,
    7: 27,
    8: 30,
    9: 38,
    10: 56,
    11: 64,
    12: 71,
    13: 82,
    14: 104,
    15: 126,
    16: 148,
  },
  weight: {
    1: "300",
    2: "400",
    3: "500",
    4: "600",
    5: "700",
    6: "800",
  },
  letterSpacing: {
    1: 0,
    2: -0.2,
    3: -0.3,
    4: -0.4,
    5: -0.5,
    6: -1,
    7: -1.5,
    8: -2,
    9: -2.5,
    10: -3.5,
    11: -4,
    12: -4.5,
    13: -5,
    14: -7,
    15: -8,
    16: -9,
  },
  face: {
    300: { normal: "InterLight", italic: "InterLightItalic" },
    400: { normal: "Inter", italic: "InterItalic" },
    500: { normal: "InterMedium", italic: "InterMediumItalic" },
    600: { normal: "InterSemiBold", italic: "InterSemiBoldItalic" },
    700: { normal: "InterBold", italic: "InterBoldItalic" },
    800: { normal: "InterExtraBold", italic: "InterExtraBoldItalic" },
  },
});

const tokens = createTokens({
  ...baseTokens,
  color: {
    ...baseTokens.color,
    brand50: "#f0f7ff",
    brand100: "#c2deff",
    brand200: "#90c2ff",
    brand300: "#5aa6ff",
    brand400: "#2d8bff",
    brand500: "#0070f3",
    brand600: "#0057c2",
    brand700: "#003e8f",
    brand800: "#002660",
    brand900: "#000e33",
  },
});

const appConfig = createTamagui({
  animations,
  defaultTheme: "light",
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  shorthands,
  fonts: {
    heading: interFont,
    body: interFont,
  },
  themes,
  tokens,
  media: {
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1650 },
    xxl: { minWidth: 1651 },
    gtXs: { minWidth: 661 },
    gtSm: { minWidth: 801 },
    gtMd: { minWidth: 1021 },
    gtLg: { minWidth: 1281 },
    short: { maxHeight: 820 },
    tall: { minHeight: 821 },
    hoverNone: { hover: "none" },
    pointerCoarse: { pointer: "coarse" },
  },
});

export type AppConfig = typeof appConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default appConfig;
