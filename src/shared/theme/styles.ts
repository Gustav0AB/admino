import { StyleSheet, Platform } from "react-native";
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from "./tokens";

// Common cross-platform styles
export const commonStyles = StyleSheet.create({
  // Layout
  flex1: { flex: 1 },
  flexRow: { flexDirection: "row" },
  flexColumn: { flexDirection: "column" },
  alignCenter: { alignItems: "center" },
  justifyCenter: { justifyContent: "center" },
  justifyBetween: { justifyContent: "space-between" },
  justifyAround: { justifyContent: "space-around" },
  alignSelfStretch: { alignSelf: "stretch" },
  alignSelfCenter: { alignSelf: "center" },

  // Spacing
  gapXs: { gap: SPACING.xs },
  gapSm: { gap: SPACING.sm },
  gapMd: { gap: SPACING.md },
  gapLg: { gap: SPACING.lg },
  gapXl: { gap: SPACING.xl },

  // Padding
  pXs: { padding: SPACING.xs },
  pSm: { padding: SPACING.sm },
  pMd: { padding: SPACING.md },
  pLg: { padding: SPACING.lg },
  pXl: { padding: SPACING.xl },

  pxXs: { paddingHorizontal: SPACING.xs },
  pxSm: { paddingHorizontal: SPACING.sm },
  pxMd: { paddingHorizontal: SPACING.md },
  pxLg: { paddingHorizontal: SPACING.lg },
  pxXl: { paddingHorizontal: SPACING.xl },

  pyXs: { paddingVertical: SPACING.xs },
  pySm: { paddingVertical: SPACING.sm },
  pyMd: { paddingVertical: SPACING.md },
  pyLg: { paddingVertical: SPACING.lg },
  pyXl: { paddingVertical: SPACING.xl },

  // Margin
  mXs: { margin: SPACING.xs },
  mSm: { margin: SPACING.sm },
  mMd: { margin: SPACING.md },
  mLg: { margin: SPACING.lg },
  mXl: { margin: SPACING.xl },

  // Border radius
  roundedNone: { borderRadius: BORDER_RADIUS.none },
  roundedSm: { borderRadius: BORDER_RADIUS.sm },
  roundedMd: { borderRadius: BORDER_RADIUS.md },
  roundedLg: { borderRadius: BORDER_RADIUS.lg },
  roundedXl: { borderRadius: BORDER_RADIUS.xl },
  roundedFull: { borderRadius: BORDER_RADIUS.full },

  // Shadows
  shadowSm: SHADOWS.sm,
  shadowMd: SHADOWS.md,
  shadowLg: SHADOWS.lg,

  // Text
  textXs: { fontSize: TYPOGRAPHY.fontSize.xs },
  textSm: { fontSize: TYPOGRAPHY.fontSize.sm },
  textMd: { fontSize: TYPOGRAPHY.fontSize.md },
  textLg: { fontSize: TYPOGRAPHY.fontSize.lg },
  textXl: { fontSize: TYPOGRAPHY.fontSize.xl },
  textXxl: { fontSize: TYPOGRAPHY.fontSize.xxl },

  fontLight: { fontWeight: TYPOGRAPHY.fontWeight.light },
  fontNormal: { fontWeight: TYPOGRAPHY.fontWeight.normal },
  fontMedium: { fontWeight: TYPOGRAPHY.fontWeight.medium },
  fontSemibold: { fontWeight: TYPOGRAPHY.fontWeight.semibold },
  fontBold: { fontWeight: TYPOGRAPHY.fontWeight.bold },
  fontExtrabold: { fontWeight: TYPOGRAPHY.fontWeight.extrabold },

  // Interactive
  pressable: {
    opacity: 1,
  },
  pressablePressed: {
    opacity: 0.7,
  },

  // Platform specific adjustments
  ...Platform.select({
    ios: {
      // iOS specific styles
    },
    android: {
      // Android specific styles
    },
    default: {
      // Web specific styles
    },
  }),
});

// Utility functions for dynamic styles
export const createVariantStyles = <T extends Record<string, any>>(
  baseStyles: StyleSheet.NamedStyles<any>,
  variants: T,
) => {
  return StyleSheet.create({
    ...baseStyles,
    ...variants,
  });
};

export const createResponsiveStyles = <T extends Record<string, any>>(
  styles: T,
) => {
  return StyleSheet.create(styles);
};

// Common component styles
export const componentStyles = StyleSheet.create({
  // Button base
  buttonBase: {
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.sm,
  },

  // Input base
  inputBase: {
    height: 44,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
  },

  // Card base
  cardBase: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },

  // Modal overlay
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Modal content
  modalContent: {
    backgroundColor: "white",
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    margin: SPACING.md,
    maxWidth: 400,
    width: "90%",
    ...SHADOWS.lg,
  },
});
