import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, BREAKPOINTS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { usePlanningStore } from "@/features/expenses/planning/store";
import type { ScheduledExpenseCategory } from "@/features/expenses/planning/types";
import { formatMXN } from "../helpers";

const CATEGORY_ICON: Record<ScheduledExpenseCategory, string> = {
  mechanic: "🔧",
  insurance: "🛡",
  medical: "🏥",
  utilities: "💡",
  subscription: "📅",
  other: "📌",
};

export function UpcomingSection() {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isMobile = width < BREAKPOINTS.tablet;

  const [expanded, setExpanded] = useState(!isMobile);

  const { scheduledExpenses, vacations } = usePlanningStore();

  const activeScheduled = scheduledExpenses
    .filter((e) => e.status !== "cancelled")
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  const activeVacations = vacations.filter(
    (v) => v.status !== "cancelled" && (v.budget ?? 0) > 0,
  );

  if (activeScheduled.length === 0 && activeVacations.length === 0) {
    return null;
  }

  const total =
    activeScheduled
      .filter((e) => e.amountKnown)
      .reduce((s, e) => s + e.amount, 0) +
    activeVacations.reduce((s, v) => s + (v.budget ?? 0), 0);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: c.backgroundStrong, borderTopColor: c.border },
      ]}
    >
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
      >
        <Text style={[styles.headerTitle, { color: c.text }]}>
          Próximos programados
        </Text>
        <Text style={[styles.toggle, { color: c.textMuted }]}>
          {expanded ? "▲" : "▼"}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {activeScheduled.map((e) => (
            <View
              key={e.id}
              style={[styles.row, { borderBottomColor: c.border }]}
            >
              <Text style={styles.icon}>{CATEGORY_ICON[e.category]}</Text>
              <View style={styles.rowMain}>
                <Text style={[styles.rowTitle, { color: c.text }]}>
                  {e.title}
                </Text>
                {(e.scheduledDate || e.time) && (
                  <Text style={[styles.rowSub, { color: c.textMuted }]}>
                    {e.scheduledDate}
                    {e.time ? ` ${e.time}` : ""}
                  </Text>
                )}
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.rowAmount, { color: c.text }]}>
                  {e.amountKnown ? `$${formatMXN(e.amount)}` : "Por definir"}
                </Text>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        e.status === "done" ? "#16A34A" : "#CA8A04",
                    },
                  ]}
                />
              </View>
            </View>
          ))}

          {activeVacations.map((v) => (
            <View
              key={v.id}
              style={[styles.row, { borderBottomColor: c.border }]}
            >
              <Text style={styles.icon}>✈️</Text>
              <View style={styles.rowMain}>
                <Text style={[styles.rowTitle, { color: c.text }]}>
                  {v.name}
                </Text>
                {(v.startDate || v.endDate) && (
                  <Text style={[styles.rowSub, { color: c.textMuted }]}>
                    {v.startDate}
                    {v.endDate ? ` – ${v.endDate}` : ""}
                  </Text>
                )}
              </View>
              <Text style={[styles.rowAmount, { color: c.text }]}>
                ${formatMXN(v.budget ?? 0)}
              </Text>
            </View>
          ))}

          <View style={[styles.totalRow, { borderTopColor: c.border }]}>
            <Text style={[styles.totalLabel, { color: c.textMuted }]}>
              Total estimado
            </Text>
            <Text style={[styles.totalAmount, { color: c.text }]}>
              ${formatMXN(total)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.md,
    overflow: "hidden",
    marginTop: SPACING.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
  },
  toggle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  body: {
    paddingBottom: SPACING.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    fontSize: TYPOGRAPHY.fontSize.md,
    width: 24,
    textAlign: "center",
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  rowSub: {
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  rowAmount: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "500",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: SPACING.xs,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
  },
  totalAmount: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "700",
  },
});
