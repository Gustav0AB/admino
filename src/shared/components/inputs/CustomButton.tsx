import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  type TouchableOpacityProps,
} from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { useOrgTheme } from "@/shared/theme/useOrgTheme";
import { componentStyles, commonStyles } from "@/shared/theme/styles";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type CustomButtonProps = TouchableOpacityProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
  loading?: boolean;
};

export function CustomButton({
  variant = "primary",
  size = "md",
  children,
  style,
  disabled,
  loading,
  ...props
}: CustomButtonProps) {
  const c = useColors();
  const { primaryColor, secondaryColor } = useOrgTheme();

  const sizeStyles = {
    sm: {
      height: 36,
      paddingHorizontal: SPACING.sm,
      borderRadius: BORDER_RADIUS.sm,
    },
    md: {
      height: 44,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
    },
    lg: {
      height: 52,
      paddingHorizontal: SPACING.lg,
      borderRadius: BORDER_RADIUS.lg,
    },
  };

  const variantStyles = {
    primary: {
      backgroundColor: primaryColor,
      borderWidth: 0,
    },
    secondary: {
      backgroundColor: secondaryColor,
      borderWidth: 0,
    },
    outline: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: primaryColor,
    },
    ghost: {
      backgroundColor: "transparent",
      borderWidth: 0,
    },
  };

  const textColors = {
    primary: c.white,
    secondary: c.white,
    outline: primaryColor,
    ghost: primaryColor,
  };

  const textSizes = {
    sm: TYPOGRAPHY.fontSize.sm,
    md: TYPOGRAPHY.fontSize.md,
    lg: TYPOGRAPHY.fontSize.lg,
  };

  return (
    <TouchableOpacity
      style={[
        componentStyles.buttonBase,
        sizeStyles[size],
        variantStyles[variant],
        disabled && styles.disabled,
        loading && styles.loading,
        style,
      ]}
      activeOpacity={Platform.select({ ios: 0.7, android: 0.8, default: 0.8 })}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      {...props}
    >
      <Text
        style={[
          styles.label,
          {
            color: textColors[variant],
            fontSize: textSizes[size],
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
          },
        ]}
      >
        {loading ? "Loading..." : children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  label: {
    textAlign: "center",
    ...Platform.select({
      web: {
        userSelect: "none",
      },
    }),
  },
  disabled: {
    opacity: 0.5,
  },
  loading: {
    opacity: 0.8,
  },
});
