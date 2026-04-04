import { View, Text, StyleSheet, Platform, type StyleProp, type ViewStyle } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";

export type BadgeStatus =
  | "active"
  | "pending"
  | "completed"
  | "cancelled"
  | "error"
  | "warning"
  | "info";
export type BadgeSize = "sm" | "md";

type StatusConfig = {
  label: string;
  backgroundColor: string;
  color: string;
};

const getStatusConfig = (status: BadgeStatus, c: any): StatusConfig => {
  const configs = {
    active: { label: "Active", backgroundColor: "#D1FAE5", color: "#065F46" },
    pending: { label: "Pending", backgroundColor: "#FEF3C7", color: "#92400E" },
    completed: {
      label: "Completed",
      backgroundColor: "#DBEAFE",
      color: "#1E40AF",
    },
    cancelled: {
      label: "Cancelled",
      backgroundColor: "#FEE2E2",
      color: "#991B1B",
    },
    error: {
      label: "Error",
      backgroundColor: c.danger + "20",
      color: c.danger,
    },
    warning: { label: "Warning", backgroundColor: "#FEF3C7", color: "#92400E" },
    info: {
      label: "Info",
      backgroundColor: c.primary + "20",
      color: c.primary,
    },
  };
  return configs[status];
};

type StatusBadgeProps = {
  status: BadgeStatus;
  size?: BadgeSize;
  customLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function StatusBadge({
  status,
  size = "md",
  customLabel,
  style,
}: StatusBadgeProps) {
  const c = useColors();
  const config = getStatusConfig(status, c);

  const sizeStyles = {
    sm: {
      paddingHorizontal: SPACING.xs,
      paddingVertical: 2,
      borderRadius: BORDER_RADIUS.sm,
    },
    md: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 3,
      borderRadius: BORDER_RADIUS.md,
    },
  };

  const fontSize =
    size === "sm" ? TYPOGRAPHY.fontSize.xs : TYPOGRAPHY.fontSize.sm;

  return (
    <View
      style={[
        styles.badge,
        sizeStyles[size],
        { backgroundColor: config.backgroundColor },
        style,
      ]}
      accessibilityLabel={`Status: ${customLabel || config.label}`}
    >
      <Text
        style={[
          styles.label,
          {
            color: config.color,
            fontSize,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
          },
        ]}
      >
        {customLabel || config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    ...Platform.select({
      web: {
        display: "inline-flex",
        width: "auto",
      },
    }),
  },
  label: {
    textAlign: "center",
    letterSpacing: 0.3,
    ...Platform.select({
      web: {
        userSelect: "none",
      },
    }),
  },
});
