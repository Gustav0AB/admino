import { View, Text, StyleSheet } from "react-native";

export type BadgeStatus = "active" | "pending" | "completed" | "cancelled";

type StatusConfig = {
  label: string;
  backgroundColor: string;
  color: string;
};

const STATUS_CONFIG: Record<BadgeStatus, StatusConfig> = {
  active: { label: "Active", backgroundColor: "#D1FAE5", color: "#065F46" },
  pending: { label: "Pending", backgroundColor: "#FEF3C7", color: "#92400E" },
  completed: { label: "Completed", backgroundColor: "#DBEAFE", color: "#1E40AF" },
  cancelled: { label: "Cancelled", backgroundColor: "#FEE2E2", color: "#991B1B" },
};

type StatusBadgeProps = {
  status: BadgeStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <View
      style={[styles.pill, { backgroundColor: config.backgroundColor }]}
      accessibilityLabel={`Status: ${config.label}`}
    >
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
