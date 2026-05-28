import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CustomSelect } from "@/shared/components/inputs/CustomSelect";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { useExpensesStore } from "../store";
import { usePlanningStore } from "@/features/expenses/planning/store";
import {
  currentMonthName,
  currentYear,
  formatMXN,
  getAvailableMeses,
  getAvailableAños,
  getCreditHistoryForCard,
  getCurrentCreditBalance,
  MESES_LIST,
} from "../helpers";

export function ResumenTab() {
  const c = useColors();
  const { expenses, creditCards, recurringExpenses } = useExpensesStore();
  const { scheduledExpenses, vacations } = usePlanningStore();

  const availableMeses = useMemo(() => getAvailableMeses(expenses), [expenses]);
  const availableAños = useMemo(() => getAvailableAños(expenses), [expenses]);
  const [selectedMes, setSelectedMes] = useState(currentMonthName());
  const [selectedAño, setSelectedAño] = useState(currentYear());

  const añoOptions = [
    { label: "Todos los años", value: 0 },
    ...availableAños.map((y) => ({ label: String(y), value: y })),
  ];

  const mesOptions = [
    { label: "Todos los meses", value: "__all__" },
    ...MESES_LIST.filter((m) => availableMeses.includes(m)).map((m) => ({ label: m, value: m })),
  ];

  const filtered = useMemo(() => {
    let result = selectedMes === "__all__" ? expenses : expenses.filter((e) => e.mes === selectedMes);
    if (selectedAño > 0) result = result.filter((e) => (e.año ?? currentYear()) === selectedAño);
    return result;
  }, [expenses, selectedMes, selectedAño]);

  const stats = useMemo(() => {
    const pagado = filtered.filter((e) => e.estado === "pagado").reduce((s, e) => s + e.monto, 0);
    const sinPagar = filtered
      .filter((e) => e.estado === "no pagado" || e.estado === "no guardado")
      .reduce((s, e) => s + e.monto, 0);
    const credito = filtered.filter((e) => e.metodoPago === "credito").reduce((s, e) => s + e.monto, 0);
    const efectivo = filtered.filter((e) => e.metodoPago === "efectivo").reduce((s, e) => s + e.monto, 0);
    const total = filtered.reduce((s, e) => s + e.monto, 0);
    return { pagado, sinPagar, credito, efectivo, total };
  }, [filtered]);

  // Per-month breakdown for "Todos"
  const byMonth = useMemo(() => {
    if (selectedMes !== "__all__") return [];
    return MESES_LIST.map((mes) => {
      const items = expenses.filter((e) => e.mes === mes);
      if (items.length === 0) return null;
      const total = items.reduce((s, e) => s + e.monto, 0);
      const pagado = items.filter((e) => e.estado === "pagado").reduce((s, e) => s + e.monto, 0);
      const sinPagar = items.filter((e) => e.estado !== "pagado").reduce((s, e) => s + e.monto, 0);
      return { mes, total, pagado, sinPagar, count: items.length };
    }).filter(Boolean) as { mes: string; total: number; pagado: number; sinPagar: number; count: number }[];
  }, [expenses, selectedMes]);

  // Recurring totals for selected month — multiply by number of payment days
  const recurringTotal = useMemo(() => {
    const active = recurringExpenses.filter(
      (r) => selectedMes === "__all__" || !r.cancelledMonths.includes(selectedMes),
    );
    return active.reduce((s, r) => s + r.amount * r.days.length, 0);
  }, [recurringExpenses, selectedMes]);

  // Credit card balances
  const cardBalances = useMemo(
    () =>
      creditCards.map((card) => {
        const history = getCreditHistoryForCard(expenses, card);
        const balance = getCurrentCreditBalance(history, card.initialDebt);
        const monthCharges = expenses.filter(
          (e) => e.creditCardId === card.id && (selectedMes === "__all__" || e.mes === selectedMes),
        );
        return { card, balance, monthTotal: monthCharges.reduce((s, e) => s + e.monto, 0) };
      }),
    [creditCards, expenses, selectedMes],
  );

  // Scheduled upcoming (not cancelled)
  const scheduledPending = scheduledExpenses.filter((e) => e.status === "pending" && e.amountKnown);
  const scheduledTotal = scheduledPending.reduce((s, e) => s + e.amount, 0);

  // Vacations — budget is deprecated; compute from pending payments when available
  const vacationsActive = vacations.filter((v) => v.status !== "cancelled");
  const getVacationBudget = (v: (typeof vacationsActive)[0]) => {
    if (v.payments?.length) {
      const pc = v.persons?.length ?? 0;
      return v.payments.reduce((s, p) => s + p.amount * (p.perPerson ? Math.max(pc, 1) : 1), 0);
    }
    return v.budget ?? 0;
  };
  const vacationsTotal = vacationsActive.reduce((s, v) => s + getVacationBudget(v), 0);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Year + Month filter */}
      <View style={styles.topBar}>
        <CustomSelect
          value={selectedAño}
          options={añoOptions}
          onChange={(v) => setSelectedAño(Number(v))}
          style={styles.mesSelect}
        />
        <CustomSelect
          value={selectedMes}
          options={mesOptions}
          onChange={(v) => setSelectedMes(String(v))}
          style={styles.mesSelect}
        />
      </View>

      {/* Main stats */}
      <View style={styles.statsGrid}>
        <StatCard label="Total" value={stats.total} color={c.primary} c={c} big />
        <StatCard label="Pagado" value={stats.pagado} color="#16A34A" c={c} />
        <StatCard label="Sin pagar" value={stats.sinPagar} color={c.danger} c={c} />
        <StatCard label="Crédito" value={stats.credito} color={c.primary} c={c} />
        <StatCard label="Efectivo" value={stats.efectivo} color={c.text} c={c} />
        <StatCard label="Registros" value={filtered.length} isCount color={c.textMuted} c={c} />
      </View>

      {/* Recurring fijos */}
      {recurringExpenses.length > 0 && (
        <Section title="Fijos" c={c}>
          <Row label={`${recurringExpenses.filter((r) => selectedMes === "__all__" || !r.cancelledMonths.includes(selectedMes)).length} activos`} value={`$${formatMXN(recurringTotal)}`} c={c} />
          {selectedMes !== "__all__" &&
            recurringExpenses
              .filter((r) => !r.cancelledMonths.includes(selectedMes))
              .map((r) => (
                <Row
                  key={r.id}
                  label={`  ${r.title} · ${r.days.length === 1 ? `día ${r.days[0]}` : `días ${[...r.days].sort((a, b) => a - b).join(", ")}`}`}
                  value={r.days.length > 1 ? `$${formatMXN(r.amount)} ×${r.days.length} = $${formatMXN(r.amount * r.days.length)}` : `$${formatMXN(r.amount)}`}
                  c={c}
                  muted
                />
              ))}
        </Section>
      )}

      {/* Credit cards */}
      {cardBalances.length > 0 && (
        <Section title="Tarjetas de crédito" c={c}>
          {cardBalances.map(({ card, balance, monthTotal }) => (
            <View key={card.id}>
              <Row label={card.name} value={`$${formatMXN(balance)}`} c={c} />
              {monthTotal > 0 && (
                <Row label={`  Cargos ${selectedMes === "__all__" ? "total" : selectedMes}`} value={`$${formatMXN(monthTotal)}`} c={c} muted />
              )}
            </View>
          ))}
        </Section>
      )}

      {/* Upcoming / programados */}
      {scheduledPending.length > 0 && (
        <Section title="Programados pendientes" c={c}>
          <Row label={`${scheduledPending.length} agendados`} value={`$${formatMXN(scheduledTotal)}`} c={c} />
          {scheduledPending.slice(0, 5).map((e) => (
            <Row key={e.id} label={`  ${e.title} · ${e.scheduledDate}`} value={`$${formatMXN(e.amount)}`} c={c} muted />
          ))}
          {scheduledPending.length > 5 && (
            <Text style={[styles.more, { color: c.textPlaceholder }]}>+{scheduledPending.length - 5} más…</Text>
          )}
        </Section>
      )}

      {/* Vacations */}
      {vacationsActive.length > 0 && (
        <Section title="Vacaciones" c={c}>
          <Row label={`${vacationsActive.length} planes`} value={`$${formatMXN(vacationsTotal)}`} c={c} />
          {vacationsActive.map((v) => (
            <Row key={v.id} label={`  ${v.name}`} value={`$${formatMXN(getVacationBudget(v))}`} c={c} muted />
          ))}
        </Section>
      )}

      {/* Per-month breakdown */}
      {byMonth.length > 0 && (
        <Section title="Desglose por mes" c={c}>
          {byMonth.map((m) => (
            <View key={m.mes} style={styles.monthRow}>
              <Text style={[styles.monthName, { color: c.text }]}>{m.mes}</Text>
              <View style={styles.monthAmts}>
                <Text style={[styles.monthAmt, { color: "#16A34A" }]}>${formatMXN(m.pagado)}</Text>
                <Text style={[styles.monthAmt, { color: c.danger }]}>${formatMXN(m.sinPagar)}</Text>
                <Text style={[styles.monthTotal, { color: c.text }]}>${formatMXN(m.total)}</Text>
              </View>
            </View>
          ))}
          <View style={[styles.monthRow, styles.totalRow, { borderTopColor: c.border }]}>
            <Text style={[styles.monthName, { color: c.text, fontWeight: "700" }]}>Total</Text>
            <Text style={[styles.monthTotal, { color: c.primary, fontWeight: "700" }]}>
              ${formatMXN(expenses.reduce((s, e) => s + e.monto, 0))}
            </Text>
          </View>
        </Section>
      )}
    </ScrollView>
  );
}

function StatCard({
  label, value, color, c, big, isCount,
}: {
  label: string; value: number; color: string; c: ReturnType<typeof useColors>; big?: boolean; isCount?: boolean;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: c.backgroundStrong, borderColor: c.border, flex: big ? 2 : 1 }]}>
      <Text style={[styles.statValue, { color, fontSize: big ? 22 : 16 }]}>
        {isCount ? String(value) : `$${formatMXN(value)}`}
      </Text>
      <Text style={[styles.statLabel, { color: c.textMuted }]}>{label}</Text>
    </View>
  );
}

function Section({ title, children, c }: { title: string; children: React.ReactNode; c: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.section, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
      <Text style={[styles.sectionTitle, { color: c.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, c, muted }: { label: string; value: string; c: ReturnType<typeof useColors>; muted?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: muted ? c.textMuted : c.text, fontSize: muted ? TYPOGRAPHY.fontSize.xs : TYPOGRAPHY.fontSize.sm }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.rowValue, { color: muted ? c.textMuted : c.text, fontSize: muted ? TYPOGRAPHY.fontSize.xs : TYPOGRAPHY.fontSize.sm }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xl },
  topBar: { flexDirection: "row", gap: SPACING.sm, flexWrap: "wrap" },
  mesSelect: { minWidth: 160 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  statCard: { borderRadius: BORDER_RADIUS.md, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.md, gap: 4, minWidth: 100 },
  statValue: { fontWeight: "700" },
  statLabel: { fontSize: TYPOGRAPHY.fontSize.xs },
  section: { borderRadius: BORDER_RADIUS.md, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.md, gap: SPACING.xs },
  sectionTitle: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "700", marginBottom: SPACING.xs },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  rowLabel: { flex: 1 },
  rowValue: { fontWeight: "500" },
  monthRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  totalRow: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: SPACING.xs, paddingTop: SPACING.xs },
  monthName: { fontSize: TYPOGRAPHY.fontSize.sm, flex: 1 },
  monthAmts: { flexDirection: "row", gap: SPACING.md },
  monthAmt: { fontSize: TYPOGRAPHY.fontSize.xs, width: 70, textAlign: "right" },
  monthTotal: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600", width: 80, textAlign: "right" },
  more: { fontSize: TYPOGRAPHY.fontSize.xs, textAlign: "center", paddingTop: SPACING.xs },
});
