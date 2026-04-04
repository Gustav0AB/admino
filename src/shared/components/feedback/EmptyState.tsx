import { type ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from "@/shared/theme/tokens";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const c = useColors();

  return (
    <View style={styles.container}>
      {icon !== undefined && (
        <View style={[styles.iconWrap, { backgroundColor: c.backgroundStrong }]}>
          {icon}
        </View>
      )}
      <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      {description !== undefined && (
        <Text style={[styles.description, { color: c.textMuted }]}>{description}</Text>
      )}
      {action !== undefined && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: c.primary }]}
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Text style={[styles.buttonText, { color: c.primaryForeground }]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: "600",
    textAlign: "center",
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },
  button: {
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.md,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: "600",
  },
});
