import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CustomSelect } from "@/shared/components/inputs/CustomSelect";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { useExpensesStore } from "../store";
import { usePlanningStore } from "@/features/expenses/planning/store";
import {
  CATEGORIES,
  currentMonthName,
  currentYear,
  formatMXN,
  getAccountBalance,
  getAvailableMeses,
  getAvailableAños,
  getCreditHistoryForCard,
  getCurrentCreditBalance,
  MESES_LIST,
} from "../helpers";

export function ResumenTab() {
  const c = useColors();
  const { expenses, creditCards, recurringExpenses, incomes, accounts } = useExpensesStore();
  const { scheduledExpenses, vacations, installmentPayments } = usePlanningStore();

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
    const gastos = filtered.filter((e) => e.metodoPago !== "credito");
    const pagado = gastos.filter((e) => e.estado === "pagado").reduce((s, e) => s + e.monto, 0);
    const sinPagar = gastos
      .filter((e) => e.estado === "no pagado" || e.estado === "no guardado")
      .reduce((s, e) => s + e.monto, 0);
    const credito = filtered.filter((e) => e.metodoPago === "credito").reduce((s, e) => s + e.monto, 0);
    const efectivo = gastos.filter((e) => e.metodoPago === "efectivo").reduce((s, e) => s + e.monto, 0);
    const total = gastos.reduce((s, e) => s + e.monto, 0);
    return { pagado, sinPagar, credito, efectivo, total };
  }, [filtered]);

  // Account balances
  const accountBalances = useMemo(
    () => accounts.map((a) => ({ account: a, balance: getAccountBalance(a, expenses, incomes) })),
    [accounts, expenses, incomes],
  );
  const totalAccountBalance = accountBalances.reduce((s, b) => s + b.balance, 0);

  // Income stats
  const incomeStats = useMemo(() => {
    const filteredIncomes = incomes.filter((i) => {
      if (selectedMes !== "__all__" && i.mes !== selectedMes) return false;
      if (selectedAño > 0 && (i.año ?? currentYear()) !== selectedAño) return false;
      return true;
    });
    const recibido = filteredIncomes.filter((i) => i.estado === "recibido").reduce((s, i) => s + i.monto, 0);
    const pendiente = filteredIncomes.filter((i) => i.estado === "pendiente").reduce((s, i) => s + i.monto, 0);
    return { recibido, pendiente, total: recibido + pendiente, count: filteredIncomes.length };
  }, [incomes, selectedMes, selectedAño]);

  // Category breakdown
  const byCategory = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const items = filtered.filter((e) => e.category === cat.value && e.metodoPago !== "credito");
      if (items.length === 0) return null;
      return { ...cat, total: items.reduce((s, e) => s + e.monto, 0), count: items.length };
    }).filter(Boolean) as { value: string; label: string; color: string; total: number; count: number }[];
  }, [filtered]);

  const uncategorized = useMemo(
    () => filtered.filter((e) => !e.category && e.metodoPago !== "credito").reduce((s, e) => s + e.monto, 0),
    [filtered],
  );

  // Per-month breakdown for "Todos"
  const byMonth = useMemo(() => {
    if (selectedMes !== "__all__") return [];
    return MESES_LIST.map((mes) => {
      const items = expenses.filter((e) => e.mes === mes && e.metodoPago !== "credito");
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

  // Próximos 30 días
  const upcomingItems = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const limit = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    function nextOcc(day: number): Date | null {
      const d = new Date(today.getFullYear(), today.getMonth(), day);
      if (d >= today) return d;
      return new Date(today.getFullYear(), today.getMonth() + 1, day);
    }

    const items: { id: string; title: string; amount: number | null; dueDate: Date; type: string; urgency: string }[] = [];

    for (const r of recurringExpenses) {
      for (const day of r.days) {
        const occ = nextOcc(day);
        if (!occ || occ > limit) continue;
        const occMes = MESES_LIST[occ.getMonth()] ?? "";
        if (r.cancelledMonths.includes(occMes)) continue;
        const diff = Math.round((occ.getTime() - today.getTime()) / 86400000);
        items.push({ id: `rec-${r.id}-${day}`, title: r.title, amount: r.amount, dueDate: occ, type: "🔄", urgency: diff <= 2 ? "#EF4444" : diff <= 7 ? "#F59E0B" : "#16A34A" });
      }
    }

    for (const s of scheduledExpenses) {
      if (s.status !== "pending") continue;
      const d = new Date(s.scheduledDate + "T00:00:00");
      if (d < today || d > limit) continue;
      const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
      items.push({ id: `sched-${s.id}`, title: s.title, amount: s.amountKnown ? s.amount : null, dueDate: d, type: "📅", urgency: diff <= 2 ? "#EF4444" : diff <= 7 ? "#F59E0B" : "#16A34A" });
    }

    for (const card of creditCards) {
      if (!card.payDay) continue;
      const occ = nextOcc(card.payDay);
      if (!occ || occ > limit) continue;
      const diff = Math.round((occ.getTime() - today.getTime()) / 86400000);
      items.push({ id: `cc-${card.id}`, title: `Pago ${card.name}`, amount: null, dueDate: occ, type: "💳", urgency: diff <= 2 ? "#EF4444" : diff <= 7 ? "#F59E0B" : "#16A34A" });
    }

    for (const ip of installmentPayments) {
      if (ip.status !== "active") continue;
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const diff = Math.round((endOfMonth.getTime() - today.getTime()) / 86400000);
      items.push({ id: `msi-${ip.id}`, title: ip.title, amount: ip.monthlyAmount, dueDate: endOfMonth, type: "📦", urgency: diff <= 2 ? "#EF4444" : diff <= 7 ? "#F59E0B" : "#16A34A" });
    }

    return items.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [recurringExpenses, scheduledExpenses, creditCards, installmentPayments]);

  const upcomingTotal = upcomingItems.reduce((s, i) => s + (i.amount ?? 0), 0);

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

      {/* Próximos 30 días */}
      {upcomingItems.length > 0 && (
        <Section title={`Próximos 30 días · $${formatMXN(upcomingTotal)}`} c={c}>
          {upcomingItems.map((item) => (
            <View key={item.id} style={[styles.upcomingRow, { borderLeftColor: item.urgency }]}>
              <Text style={styles.upcomingIcon}>{item.type}</Text>
              <Text style={[styles.rowLabel, { color: c.text, flex: 1 }]} numberOfLines={1}>{item.title}</Text>
              <Text style={[styles.rowValue, { color: item.urgency, fontWeight: "600" }]}>
                {item.dueDate.getDate()} {MESES_LIST[item.dueDate.getMonth()]}
              </Text>
              <Text style={[styles.rowValue, { color: c.text, marginLeft: SPACING.sm }]}>
                {item.amount != null ? `$${formatMXN(item.amount)}` : "—"}
              </Text>
            </View>
          ))}
        </Section>
      )}

      {/* Accounts */}
      {accountBalances.length > 0 && (
        <Section title="Cuentas" c={c}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: c.text, fontWeight: "700" }]}>Saldo total</Text>
            <Text style={[styles.rowValue, { color: totalAccountBalance >= 0 ? "#16A34A" : c.danger, fontWeight: "700" }]}>
              ${formatMXN(totalAccountBalance)}
            </Text>
          </View>
          {accountBalances.map(({ account, balance }) => (
            <View key={account.id} style={styles.catRow}>
              <View style={[styles.catDot, { backgroundColor: account.color }]} />
              <Text style={[styles.rowLabel, { color: c.text, flex: 1 }]}>{account.name}</Text>
              <Text style={[styles.rowValue, { color: balance >= 0 ? "#16A34A" : c.danger }]}>
                ${formatMXN(balance)}
              </Text>
            </View>
          ))}
        </Section>
      )}

      {/* Balance */}
      {incomeStats.total > 0 && (
        <View style={styles.statsGrid}>
          <StatCard label="Ingresos" value={incomeStats.recibido} color="#16A34A" c={c} big />
          <StatCard label="Gastos" value={stats.total} color={c.danger} c={c} big />
          <StatCard
            label="Balance"
            value={incomeStats.recibido - stats.total}
            color={incomeStats.recibido - stats.total >= 0 ? "#16A34A" : c.danger}
            c={c}
            big
          />
        </View>
      )}

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

      {/* Category breakdown */}
      {byCategory.length > 0 && (
        <Section title="Por categoría" c={c}>
          {byCategory.map((cat) => (
            <View key={cat.value} style={styles.catRow}>
              <View style={[styles.catDot, { backgroundColor: cat.color }]} />
              <Text style={[styles.rowLabel, { color: c.text, flex: 1 }]}>{cat.label}</Text>
              <Text style={[styles.rowValue, { color: c.textMuted, fontSize: TYPOGRAPHY.fontSize.xs, marginRight: SPACING.sm }]}>
                {cat.count} registro{cat.count !== 1 ? "s" : ""}
              </Text>
              <Text style={[styles.rowValue, { color: cat.color, fontWeight: "600" }]}>${formatMXN(cat.total)}</Text>
            </View>
          ))}
          {uncategorized > 0 && (
            <View style={styles.catRow}>
              <View style={[styles.catDot, { backgroundColor: c.border }]} />
              <Text style={[styles.rowLabel, { color: c.textMuted, flex: 1 }]}>Sin categoría</Text>
              <Text style={[styles.rowValue, { color: c.textMuted }]}>${formatMXN(uncategorized)}</Text>
            </View>
          )}
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
              ${formatMXN(expenses.filter((e) => e.metodoPago !== "credito").reduce((s, e) => s + e.monto, 0))}
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
  catRow: { flexDirection: "row", alignItems: "center", paddingVertical: 3, gap: SPACING.xs },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  upcomingRow: { flexDirection: "row", alignItems: "center", gap: SPACING.xs, paddingVertical: 3, paddingLeft: SPACING.xs, borderLeftWidth: 3 },
  upcomingIcon: { fontSize: 14, width: 20, textAlign: "center" },
});
