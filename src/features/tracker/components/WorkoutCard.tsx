import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, H3, Body, BodyStrong, Caption, StatusBadge } from "@/shared/components";
import { useColors } from "@/shared/hooks/useColors";
import { SPACING, BORDER_RADIUS } from "@/shared/theme/tokens";
import type { WorkoutOfDay, WorkoutStatus } from "@/shared/store/trackerStore";

type Props = {
  workout: WorkoutOfDay;
};

const STATUS_MAP: Record<WorkoutStatus, "pending" | "active" | "completed" | "warning" | "info"> = {
  pending: "pending",
  in_progress: "active",
  completed: "completed",
  modified: "warning",
};

export function WorkoutCard({ workout }: Props) {
  const colors = useColors();

  return (
    <Card variant="elevated" padding="md">
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Caption style={{ color: colors.textMuted }}>
            {new Date(workout.date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Caption>
          <H3 style={{ color: colors.text, marginTop: SPACING.xs }}>{workout.title}</H3>
        </View>
        <StatusBadge status={STATUS_MAP[workout.status]} />
      </View>

      {workout.status === "modified" && (
        <View style={[styles.liveChip, { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" }]}>
          <Body style={{ color: "#92400E", fontSize: 12 }}>⚡ Coach updated this plan live</Body>
        </View>
      )}

      {workout.description && (
        <Body style={{ color: colors.textMuted, marginTop: SPACING.sm }}>
          {workout.description}
        </Body>
      )}

      <View style={[styles.divider, { borderColor: colors.border }]} />

      <View style={styles.exerciseList}>
        {workout.exercises.map((ex, index) => (
          <View
            key={ex.id}
            style={[
              styles.exerciseRow,
              index < workout.exercises.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
            ]}
          >
            <View style={[styles.indexBadge, { backgroundColor: colors.backgroundStrong }]}>
              <Caption style={{ color: colors.textMuted }}>{index + 1}</Caption>
            </View>
            <View style={styles.exerciseInfo}>
              <BodyStrong style={{ color: colors.text }}>{ex.name}</BodyStrong>
              <Caption style={{ color: colors.textMuted }}>
                {ex.sets} sets × {ex.reps} reps
              </Caption>
            </View>
            {ex.notes && (
              <Caption style={{ color: colors.textPlaceholder, flex: 1, textAlign: "right" }}>
                {ex.notes}
              </Caption>
            )}
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerText: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  liveChip: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  divider: {
    borderBottomWidth: 1,
    marginVertical: SPACING.md,
  },
  exerciseList: {
    gap: 0,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseInfo: {
    flex: 1,
  },
});
