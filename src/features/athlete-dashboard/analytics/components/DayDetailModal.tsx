import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { CustomModal } from "@/shared/components/feedback/CustomModal";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { useWorkoutLog } from "../hooks/useHeatmap";
import { formatDisplayDate, totalVolumeFormatted } from "../utils/heatmapUtils";

type DayDetailModalProps = {
  date: string | null;
  onClose: () => void;
};

export function DayDetailModal({ date, onClose }: DayDetailModalProps) {
  const c = useColors();
  const { data: log, isLoading } = useWorkoutLog(date);

  const title = date ? formatDisplayDate(date) : "";

  return (
    <CustomModal
      open={date !== null}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={title}
      size="md"
    >
      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={c.primary} />
        </View>
      )}

      {!isLoading && !log && (
        <View style={styles.center}>
          <Text style={[styles.emptyIcon, { color: c.border }]}>🏖</Text>
          <Text style={[styles.emptyTitle, { color: c.text }]}>Rest day</Text>
          <Text style={[styles.emptyBody, { color: c.textMuted }]}>
            No workout logged for this day.
          </Text>
        </View>
      )}

      {!isLoading && log && (
        <View style={styles.content}>
          <View style={[styles.summaryRow, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
            <Stat label="Title" value={log.title} c={c} />
            <View style={styles.divider} />
            <Stat label="Volume" value={`${totalVolumeFormatted(log.totalVolume)} kg`} c={c} />
            <View style={styles.divider} />
            <Stat label="Duration" value={`${log.duration} min`} c={c} />
          </View>

          <Text style={[styles.sectionLabel, { color: c.textMuted }]}>Exercises</Text>

          {log.exercises.map((ex, i) => (
            <View
              key={i}
              style={[
                styles.exerciseRow,
                { borderBottomColor: c.border },
                i === log.exercises.length - 1 && styles.lastRow,
              ]}
            >
              <Text style={[styles.exName, { color: c.text }]}>{ex.name}</Text>
              <Text style={[styles.exDetail, { color: c.textMuted }]}>
                {ex.sets} × {ex.reps} @ {ex.weight} {ex.unit}
              </Text>
              <Text style={[styles.exVolume, { color: c.primary }]}>
                {totalVolumeFormatted(ex.sets * ex.reps * ex.weight)} {ex.unit}
              </Text>
            </View>
          ))}
        </View>
      )}
    </CustomModal>
  );
}

function Stat({ label, value, c }: { label: string; value: string; c: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statLabel, { color: c.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: c.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    paddingVertical: SPACING.xl,
    alignItems: "center",
    gap: SPACING.sm,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: "600",
  },
  emptyBody: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: "center",
  },
  content: {
    gap: SPACING.md,
  },
  summaryRow: {
    flexDirection: "row",
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  stat: {
    flex: 1,
    padding: SPACING.sm,
    alignItems: "center",
    gap: 2,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "700",
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "#E4E4E7",
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  exName: {
    flex: 2,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "500",
  },
  exDetail: {
    flex: 2,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  exVolume: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "700",
    textAlign: "right",
  },
});
