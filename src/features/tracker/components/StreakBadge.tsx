import React from "react";
import { View, StyleSheet } from "react-native";
import { Body, BodyStrong, Caption } from "@/shared/components";
import { useColors } from "@/shared/hooks/useColors";
import { SPACING, BORDER_RADIUS } from "@/shared/theme/tokens";
import { useTrackerStore } from "@/shared/store/trackerStore";

export function StreakBadge() {
  const streak = useTrackerStore((s) => s.streak);
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundStrong, borderColor: colors.border }]}>
      <Body style={styles.flame}>🔥</Body>
      <View>
        <BodyStrong style={{ color: colors.text }}>{streak}</BodyStrong>
        <Caption style={{ color: colors.textMuted }}>day streak</Caption>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  flame: {
    fontSize: 24,
  },
});
