import { View, StyleSheet, Platform } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, SHADOWS } from "@/shared/theme/tokens";

type CardVariant = "default" | "elevated" | "outlined" | "filled";

type CardProps = {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: keyof typeof SPACING | number;
  style?: any;
  onPress?: () => void;
};

export function Card({
  children,
  variant = "default",
  padding = SPACING.md,
  style,
  onPress,
}: CardProps) {
  const c = useColors();

  const variantStyles = {
    default: {
      backgroundColor: c.background,
      borderColor: c.border,
      borderWidth: 1,
      ...SHADOWS.sm,
    },
    elevated: {
      backgroundColor: c.background,
      borderColor: c.border,
      borderWidth: 1,
      ...SHADOWS.md,
    },
    outlined: {
      backgroundColor: "transparent",
      borderColor: c.border,
      borderWidth: 1,
    },
    filled: {
      backgroundColor: c.backgroundStrong,
      borderColor: c.border,
      borderWidth: 1,
    },
  };

  const cardStyle = [
    styles.card,
    variantStyles[variant],
    { padding, borderRadius: BORDER_RADIUS.md },
    onPress && styles.pressable,
    style,
  ];

  if (onPress) {
    const { TouchableOpacity } = require("react-native");
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={Platform.select({
          ios: 0.7,
          android: 0.8,
          default: 0.8,
        })}
        accessibilityRole="button"
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    ...Platform.select({
      web: {
        transition: "all 0.2s ease-in-out",
        ":hover": {
          transform: "translateY(-1px)",
        },
      },
    }),
  },
  pressable: {
    ...Platform.select({
      web: {
        cursor: "pointer",
      },
    }),
  },
});
