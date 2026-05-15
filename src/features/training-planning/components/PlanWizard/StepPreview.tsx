import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import type { CreatePlanValues } from "../../types";
import { calcTotalWeeks, formatDate } from "../../utils/planUtils";

export function StepPreview() {
  const { t } = useTranslation();
  const c = useColors();
  const { watch } = useFormContext<CreatePlanValues>();
  const values = watch();

  const totalWeeks =
    values.startDate && values.endDate
      ? calcTotalWeeks(values.startDate, values.endDate)
      : 0;

  return (
    <View style={styles.container}>
      <Text style={[styles.hint, { color: c.textMuted }]}>
        {t("trainingPlanning.planPreviewSummary")}
      </Text>

      <View style={[styles.section, { borderColor: c.border }]}>
        <Row label={t("trainingPlanning.planName")} value={values.name || "—"} c={c} />
        <Row label={t("trainingPlanning.description")} value={values.description || "—"} c={c} />
        <Row
          label={t("trainingPlanning.layoutType")}
          value={
            values.layoutType === "day-based"
              ? t("trainingPlanning.layoutDayBased")
              : t("trainingPlanning.layoutCycleBased")
          }
          c={c}
        />
        <Row
          label={t("trainingPlanning.startDate")}
          value={values.startDate ? formatDate(values.startDate) : "—"}
          c={c}
        />
        <Row
          label={t("trainingPlanning.endDate")}
          value={values.endDate ? formatDate(values.endDate) : "—"}
          c={c}
        />
        <Row
          label={t("trainingPlanning.totalWeeks")}
          value={`${totalWeeks} ${t("trainingPlanning.weeks")}`}
          c={c}
        />
      </View>

      <Text style={[styles.sectionTitle, { color: c.text }]}>
        {t("trainingPlanning.exercises")} ({values.exercises?.length ?? 0})
      </Text>

      {(values.exercises ?? []).map((ex, i) => (
        <View key={ex.id} style={[styles.exerciseCard, { borderColor: c.border, backgroundColor: c.backgroundStrong }]}>
          <Text style={[styles.exerciseName, { color: c.text }]}>
            {i + 1}. {ex.name || "—"}
          </Text>
          <Text style={[styles.exerciseMeta, { color: c.textMuted }]}>
            {ex.sets.length} {t("trainingPlanning.sets")} · {ex.restSeconds}s rest
          </Text>
          <View style={styles.setsTable}>
            <View style={styles.setsHeader}>
              <Text style={[styles.setHeaderCell, { color: c.textMuted }]}>Set</Text>
              <Text style={[styles.setHeaderCell, { color: c.textMuted }]}>{t("trainingPlanning.reps")}</Text>
              <Text style={[styles.setHeaderCell, { color: c.textMuted }]}>{t("trainingPlanning.weight")}</Text>
            </View>
            {ex.sets.map((s, si) => (
              <View key={si} style={[styles.setRow, { borderTopColor: c.border }]}>
                <Text style={[styles.setCell, { color: c.text }]}>{si + 1}</Text>
                <Text style={[styles.setCell, { color: c.text }]}>{s.reps}</Text>
                <Text style={[styles.setCell, { color: c.text }]}>
                  {s.weight} {s.unit}
                </Text>
              </View>
            ))}
          </View>
          {ex.notes ? (
            <Text style={[styles.notes, { color: c.textMuted }]}>
              {t("trainingPlanning.notes")}: {ex.notes}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function Row({
  label,
  value,
  c,
}: {
  label: string;
  value: string;
  c: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: c.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: c.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  hint: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  section: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  rowLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    flex: 1,
  },
  rowValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: "600",
  },
  exerciseCard: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  exerciseName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: "600",
  },
  exerciseMeta: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  setsTable: {
    gap: 0,
  },
  setsHeader: {
    flexDirection: "row",
    paddingBottom: SPACING.xs,
  },
  setHeaderCell: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  setRow: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: SPACING.xs,
  },
  setCell: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  notes: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontStyle: "italic",
  },
});
