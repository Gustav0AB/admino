import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";

export function AthletesTab() {
  const c = useColors();
  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.placeholder, { borderColor: c.border, backgroundColor: c.backgroundStrong }]}>
        <Text style={[styles.label, { color: c.textMuted }]}>
          Here will be the athlete info
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
  },
  placeholder: {
    flex: 1,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.md,
  },
});
