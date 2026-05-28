import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { useExpensesStore } from "../store";
import { formatMXN, getFilteredExpenses } from "../helpers";
import { usePlanningStore } from "@/features/expenses/planning/store";

export function SummaryPanel() {
  const c = useColors();
  const { expenses, filterMes, filterFrecuencia, filterFecha } = useExpensesStore();
  const { scheduledExpenses, vacations } = usePlanningStore();

  const filtered = useMemo(
    () => getFilteredExpenses(expenses, filterMes, filterFrecuencia, filterFecha),
    [expenses, filterMes, filterFrecuencia, filterFecha],
  );

  const selected = filtered.filter((e) => e.selected);

  const { pagado, sinPagar, credito, totalFiltrado } = useMemo(() => {
    const pag = filtered
      .filter((e) => e.estado === "pagado")
      .reduce((s, e) => s + e.monto, 0);
    const sin = filtered
      .filter((e) => e.estado === "no pagado" || e.estado === "no guardado")
      .reduce((s, e) => s + e.monto, 0);
    const cred = filtered
      .filter((e) => e.metodoPago === "credito")
      .reduce((s, e) => s + e.monto, 0);
    const tot = filtered.reduce((s, e) => s + e.monto, 0);
    return { pagado: pag, sinPagar: sin, credito: cred, totalFiltrado: tot };
  }, [filtered]);

  const upcomingTotal = useMemo(
    () =>
      scheduledExpenses
        .filter((e) => e.amountKnown && e.status !== "cancelled")
        .reduce((s, e) => s + e.amount, 0),
    [scheduledExpenses],
  );

  const vacationsTotal = useMemo(
    () =>
      vacations
        .filter((v) => v.status !== "cancelled" && (v.budget ?? 0) > 0)
        .reduce((s, v) => s + (v.budget ?? 0), 0),
    [vacations],
  );

  return (
    <View style={[styles.card, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
      <Text style={[styles.title, { color: c.text }]}>Resumen</Text>
      <Row label="Pagados" value={`$${formatMXN(pagado)}`} c={c} />
      <Row label="Sin pagar" value={`$${formatMXN(sinPagar)}`} c={c} />
      <Row label="Crédito" value={`$${formatMXN(credito)}`} c={c} color={c.primary} />
      <View style={[styles.divider, { backgroundColor: c.border }]} />
      <Row label="Total filtrado" value={`$${formatMXN(totalFiltrado)}`} c={c} bold />
      <View style={[styles.divider, { backgroundColor: c.border }]} />
      <Row label="Programados" value={`$${formatMXN(upcomingTotal)}`} c={c} muted />
      <Row label="Vacaciones" value={`$${formatMXN(vacationsTotal)}`} c={c} muted />
      <Text style={[styles.hint, { color: c.textMuted }]}>
        {filtered.length} registros · {selected.length} seleccionados
      </Text>
    </View>
  );
}

function Row({
  label,
  value,
  c,
  bold,
  color,
  muted,
}: {
  label: string;
  value: string;
  c: ReturnType<typeof useColors>;
  bold?: boolean;
  color?: string;
  muted?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text
        style={[
          styles.label,
          {
            color: c.textMuted,
            fontWeight: bold ? "600" : "400",
            fontSize: muted ? TYPOGRAPHY.fontSize.xs : TYPOGRAPHY.fontSize.sm,
          },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.value,
          {
            color: color ?? (muted ? c.textMuted : c.text),
            fontWeight: bold ? "700" : "500",
            fontSize: muted ? TYPOGRAPHY.fontSize.xs : TYPOGRAPHY.fontSize.sm,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  label: { fontSize: TYPOGRAPHY.fontSize.sm },
  value: { fontSize: TYPOGRAPHY.fontSize.sm },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: SPACING.xs },
  hint: { fontSize: TYPOGRAPHY.fontSize.xs, marginTop: SPACING.xs },
});
