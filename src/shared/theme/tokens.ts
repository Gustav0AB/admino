// Font families
export const FONTS = {
  heading: {
    regular: "InstrumentSans_400Regular",
    semibold: "InstrumentSans_600SemiBold",
    bold: "InstrumentSans_700Bold",
  },
  body: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semibold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
  },
} as const;

// Screen dimensions
export const SCREEN_WIDTH = typeof window === "undefined" ? 1024 : window.innerWidth;
export const SCREEN_HEIGHT = typeof window === "undefined" ? 768 : window.innerHeight;

// Breakpoints for responsive design
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

// Spacing scale (in pixels)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// Border radius scale
export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// Typography scale
export const TYPOGRAPHY = {
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 48,
  },
  fontWeight: {
    light: "300" as const,
    normal: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
    extrabold: "800" as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
} as const;

export const SHADOWS = {
  none: {},
  sm: { boxShadow: "0 1px 2px rgba(0,0,0,0.10)" },
  md: { boxShadow: "0 2px 4px rgba(0,0,0,0.15)" },
  lg: { boxShadow: "0 4px 8px rgba(0,0,0,0.20)" },
} as const;

// Animation durations
export const ANIMATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

// Z-index scale
export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
  toast: 1070,
} as const;

// Utility functions
export const isMobile = () => SCREEN_WIDTH < BREAKPOINTS.tablet;
export const isTablet = () =>
  SCREEN_WIDTH >= BREAKPOINTS.tablet && SCREEN_WIDTH < BREAKPOINTS.desktop;
export const isDesktop = () => SCREEN_WIDTH >= BREAKPOINTS.desktop;

export const getResponsiveValue = <T>(
  values: { mobile?: T; tablet?: T; desktop?: T },
  defaultValue: T,
): T => {
  if (isDesktop() && values.desktop !== undefined) return values.desktop;
  if (isTablet() && values.tablet !== undefined) return values.tablet;
  return values.mobile ?? defaultValue;
};
