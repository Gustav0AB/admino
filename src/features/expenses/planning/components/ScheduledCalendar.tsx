import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import type { ScheduledExpense, ScheduledExpenseStatus } from "../types";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const STATUS_COLOR: Record<ScheduledExpenseStatus, string> = {
  pending: "#f59e0b",
  done: "#22c55e",
  cancelled: "#9ca3af",
};

type Props = {
  scheduledExpenses: ScheduledExpense[];
  year: number;
  month: number; // 0-indexed
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

export function ScheduledCalendar({
  scheduledExpenses,
  year,
  month,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const c = useColors();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Build date → expenses map
  const byDate = new Map<string, ScheduledExpense[]>();
  for (const exp of scheduledExpenses) {
    if (!exp.scheduledDate) continue;
    const list = byDate.get(exp.scheduledDate) ?? [];
    byDate.set(exp.scheduledDate, [...list, exp]);
  }

  // Grid cells
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const dateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  // Month summary for nav subtitle
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthExpenses = scheduledExpenses.filter((e) => e.scheduledDate.startsWith(monthPrefix));
  const monthKnownTotal = monthExpenses
    .filter((e) => e.amountKnown && e.status !== "cancelled")
    .reduce((s, e) => s + e.amount, 0);
  const monthUnknownCount = monthExpenses.filter(
    (e) => !e.amountKnown && e.status !== "cancelled"
  ).length;

  return (
    <View style={styles.root}>
      {/* Month navigation */}
      <View style={[styles.navRow, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.navBtn} activeOpacity={0.7}>
          <Text style={[styles.navArrow, { color: c.text }]}>‹</Text>
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <Text style={[styles.navTitle, { color: c.text }]}>
            {MONTH_NAMES[month]} {year}
          </Text>
          {(monthKnownTotal > 0 || monthUnknownCount > 0) && (
            <Text style={[styles.navSub, { color: c.textMuted }]}>
              {monthKnownTotal > 0
                ? `$${monthKnownTotal.toLocaleString("es-MX", { minimumFractionDigits: 0 })} programado`
                : ""}
              {monthKnownTotal > 0 && monthUnknownCount > 0 ? " · " : ""}
              {monthUnknownCount > 0 ? `${monthUnknownCount} por definir` : ""}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={onNextMonth} style={styles.navBtn} activeOpacity={0.7}>
          <Text style={[styles.navArrow, { color: c.text }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day-of-week headers */}
      <View style={[styles.dayHeaders, { borderBottomColor: c.border }]}>
        {DAY_NAMES.map((d) => (
          <Text key={d} style={[styles.dayHeaderText, { color: c.textMuted }]}>{d}</Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {cells.map((day, idx) => {
          if (day === null) {
            return <View key={`e-${idx}`} style={styles.cell} />;
          }

          const ds = dateStr(day);
          const items = byDate.get(ds) ?? [];
          const isToday = ds === todayStr;
          const isSelected = ds === selectedDate;

          // Collect unique statuses for dots (max 3)
          const dotStatuses = Array.from(
            new Set(items.filter((e) => e.status !== "cancelled").map((e) => e.status))
          ).slice(0, 3) as ScheduledExpenseStatus[];

          return (
            <TouchableOpacity
              key={ds}
              style={[
                styles.cell,
                isToday && [styles.cellToday, { borderColor: c.primary }],
                isSelected && {
                  backgroundColor: c.primary + "28",
                  borderColor: c.primary,
                  borderWidth: 1,
                  borderRadius: BORDER_RADIUS.sm,
                },
              ]}
              onPress={() => onSelectDate(isSelected ? null : ds)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.cellDay,
                  { color: isSelected ? c.primary : isToday ? c.primary : c.text },
                  (isToday || isSelected) && { fontWeight: "700" },
                ]}
              >
                {day}
              </Text>
              {dotStatuses.length > 0 && (
                <View style={styles.dotRow}>
                  {dotStatuses.map((st, i) => (
                    <View
                      key={i}
                      style={[styles.dot, { backgroundColor: STATUS_COLOR[st] }]}
                    />
                  ))}
                  {items.length > 3 && (
                    <Text style={[styles.moreCount, { color: c.textMuted }]}>
                      +{items.length - 3}
                    </Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  navRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    overflow: "hidden",
  },
  navBtn: { width: 44, height: 52, alignItems: "center", justifyContent: "center" },
  navArrow: { fontSize: 24, fontWeight: "300" },
  navCenter: { flex: 1, alignItems: "center", gap: 2 },
  navTitle: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: "700" },
  navSub: { fontSize: TYPOGRAPHY.fontSize.xs },

  dayHeaders: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingBottom: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: "center",
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: "600",
  },

  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  cellToday: { borderWidth: 1, borderRadius: BORDER_RADIUS.sm },
  cellDay: { fontSize: TYPOGRAPHY.fontSize.sm },
  dotRow: { flexDirection: "row", gap: 2, marginTop: 2, alignItems: "center" },
  dot: { width: 5, height: 5, borderRadius: 3 },
  moreCount: { fontSize: 8, fontWeight: "700" },
});
