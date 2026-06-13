import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { useExpensesStore } from "../store";
import { usePlanningStore } from "../planning/store";
import { formatMXN, MESES_LIST } from "../helpers";

const DAYS_AHEAD = 30;

type UpcomingItem = {
  id: string;
  title: string;
  amount: number | null;
  dueDate: Date;
  type: "recurring" | "scheduled" | "credit-card" | "msi";
  tag: string | undefined;
};

function nextOccurrence(day: number, from: Date): Date | null {
  const d = new Date(from.getFullYear(), from.getMonth(), day);
  if (d >= from) return d;
  // Try next month
  const next = new Date(from.getFullYear(), from.getMonth() + 1, day);
  return next;
}

function withinWindow(date: Date, from: Date, days: number): boolean {
  const limit = new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
  return date >= from && date <= limit;
}

function formatRelative(date: Date, today: Date): string {
  const diff = Math.round((date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff <= 6) return `En ${diff} días`;
  return `${date.getDate()} ${MESES_LIST[date.getMonth()] ?? ""}`;
}

function urgencyColor(date: Date, today: Date): string {
  const diff = Math.round((date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (diff <= 2) return "#EF4444";
  if (diff <= 7) return "#F59E0B";
  return "#16A34A";
}

const TYPE_ICONS: Record<UpcomingItem["type"], string> = {
  recurring: "🔄",
  scheduled: "📅",
  "credit-card": "💳",
  msi: "📦",
};

const TYPE_LABELS: Record<UpcomingItem["type"], string> = {
  recurring: "Recurrente",
  scheduled: "Agendado",
  "credit-card": "Tarjeta",
  msi: "MSI",
};

export function UpcomingTab() {
  const c = useColors();
  const { recurringExpenses, creditCards } = useExpensesStore();
  const { scheduledExpenses, installmentPayments } = usePlanningStore();

  const { items, today } = useMemo(() => {
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const result: UpcomingItem[] = [];

    // Recurring expenses
    for (const r of recurringExpenses) {
      const currentMes = MESES_LIST[todayMidnight.getMonth()] ?? "";
      const cancelled = r.cancelledMonths.includes(currentMes);
      for (const day of r.days) {
        const occ = nextOccurrence(day, todayMidnight);
        if (!occ) continue;
        const occMes = MESES_LIST[occ.getMonth()] ?? "";
        const isCancelled = r.cancelledMonths.includes(occMes);
        if (isCancelled) continue;
        if (withinWindow(occ, todayMidnight, DAYS_AHEAD)) {
          result.push({
            id: `rec-${r.id}-${day}`,
            title: r.title,
            amount: r.amount,
            dueDate: occ,
            type: "recurring",
            tag: r.metodoPago === "credito" ? "crédito" : undefined,
          });
        }
      }
    }

    // Scheduled expenses
    for (const s of scheduledExpenses) {
      if (s.status !== "pending") continue;
      const d = new Date(s.scheduledDate + "T00:00:00");
      if (withinWindow(d, todayMidnight, DAYS_AHEAD)) {
        result.push({
          id: `sched-${s.id}`,
          title: s.title,
          amount: s.amountKnown ? s.amount : null,
          dueDate: d,
          type: "scheduled",
          tag: undefined,
        });
      }
    }

    // Credit card pay days
    for (const card of creditCards) {
      if (!card.payDay) continue;
      const occ = nextOccurrence(card.payDay, todayMidnight);
      if (!occ) continue;
      if (withinWindow(occ, todayMidnight, DAYS_AHEAD)) {
        result.push({
          id: `cc-${card.id}`,
          title: `Pago ${card.name}`,
          amount: null,
          dueDate: occ,
          type: "credit-card",
          tag: card.name,
        });
      }
    }

    // Active MSI installments (no specific day — use end of current month as proxy)
    const endOfMonth = new Date(todayMidnight.getFullYear(), todayMidnight.getMonth() + 1, 0);
    for (const ip of installmentPayments) {
      if (ip.status !== "active") continue;
      result.push({
        id: `msi-${ip.id}`,
        title: ip.title,
        amount: ip.monthlyAmount,
        dueDate: endOfMonth,
        type: "msi",
        tag: `${ip.paidMonths}/${ip.totalMonths} pagados`,
      });
    }

    result.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    return { items: result, today: todayMidnight };
  }, [recurringExpenses, creditCards, scheduledExpenses, installmentPayments]);

  const totalKnown = items.reduce((s, i) => s + (i.amount ?? 0), 0);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header summary */}
      <View style={[styles.summaryCard, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
        <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Compromisos próximos 30 días</Text>
        <Text style={[styles.summaryAmount, { color: c.text }]}>${formatMXN(totalKnown)}</Text>
        <Text style={[styles.summaryCount, { color: c.textMuted }]}>{items.length} vencimiento{items.length !== 1 ? "s" : ""}</Text>
      </View>

      {items.length === 0 ? (
        <View style={[styles.emptyState, { borderColor: c.border }]}>
          <Text style={[styles.emptyText, { color: c.textMuted }]}>
            Sin vencimientos en los próximos 30 días.
          </Text>
        </View>
      ) : (
        items.map((item) => {
          const color = urgencyColor(item.dueDate, today);
          const relative = formatRelative(item.dueDate, today);
          return (
            <View key={item.id} style={[styles.item, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
              <View style={[styles.urgencyBar, { backgroundColor: color }]} />
              <View style={styles.itemBody}>
                <View style={styles.itemTop}>
                  <Text style={[styles.itemIcon]}>{TYPE_ICONS[item.type]}</Text>
                  <View style={styles.itemMeta}>
                    <Text style={[styles.itemTitle, { color: c.text }]} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.itemBadges}>
                      <View style={[styles.typePill, { backgroundColor: `${c.primary}14` }]}>
                        <Text style={[styles.typePillText, { color: c.primary }]}>{TYPE_LABELS[item.type]}</Text>
                      </View>
                      {item.tag && (
                        <View style={[styles.tagPill, { backgroundColor: `${color}18` }]}>
                          <Text style={[styles.tagPillText, { color }]}>{item.tag}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.itemRight}>
                    <Text style={[styles.itemAmount, { color: c.text }]}>
                      {item.amount != null ? `$${formatMXN(item.amount)}` : "—"}
                    </Text>
                    <View style={[styles.relativePill, { backgroundColor: `${color}18` }]}>
                      <Text style={[styles.relativeText, { color }]}>{relative}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xl },

  summaryCard: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.md,
    alignItems: "center",
    gap: 4,
    marginBottom: SPACING.xs,
  },
  summaryLabel: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  summaryAmount: { fontSize: 28, fontWeight: "800" },
  summaryCount: { fontSize: TYPOGRAPHY.fontSize.xs },

  emptyState: { borderWidth: 1, borderStyle: "dashed", borderRadius: BORDER_RADIUS.md, padding: SPACING.xl, alignItems: "center" },
  emptyText: { fontSize: TYPOGRAPHY.fontSize.sm, textAlign: "center" },

  item: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    overflow: "hidden",
  },
  urgencyBar: { width: 4 },
  itemBody: { flex: 1, padding: SPACING.sm },
  itemTop: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  itemIcon: { fontSize: 20 },
  itemMeta: { flex: 1, gap: 4 },
  itemTitle: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" },
  itemBadges: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs },
  typePill: { paddingHorizontal: SPACING.xs, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm },
  typePillText: { fontSize: 10, fontWeight: "600" },
  tagPill: { paddingHorizontal: SPACING.xs, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm },
  tagPillText: { fontSize: 10 },
  itemRight: { alignItems: "flex-end", gap: 4 },
  itemAmount: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "700" },
  relativePill: { paddingHorizontal: SPACING.xs, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm },
  relativeText: { fontSize: 10, fontWeight: "700" },
});
