import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { useExpensesStore } from "../store";
import { formatMXN } from "../helpers";

export function SummaryPanel() {
  const c = useColors();
  const { expenses } = useExpensesStore();

  const selected = expenses.filter((e) => e.selected);

  const { efectivo, credito, total } = useMemo(() => {
    const efe = selected
      .filter((e) => e.metodoPago === "efectivo")
      .reduce((s, e) => s + e.monto, 0);
    const cred = selected
      .filter((e) => e.metodoPago === "credito")
      .reduce((s, e) => s + e.monto, 0);
    return { efectivo: efe, credito: cred, total: efe + cred };
  }, [selected]);

  return (
    <View style={[styles.card, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
      <Text style={[styles.title, { color: c.text }]}>Resumen seleccionados</Text>
      <Row label="Efectivo" value={`$${formatMXN(efectivo)}`} c={c} />
      <Row label="Crédito" value={`$${formatMXN(credito)}`} c={c} color={c.primary} />
      <View style={[styles.divider, { backgroundColor: c.border }]} />
      <Row label="Total" value={`$${formatMXN(total)}`} c={c} bold />
      <Text style={[styles.hint, { color: c.textMuted }]}>{selected.length} registros seleccionados</Text>
    </View>
  );
}

function Row({
  label, value, c, bold, color,
}: {
  label: string;
  value: string;
  c: ReturnType<typeof useColors>;
  bold?: boolean;
  color?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: c.textMuted, fontWeight: bold ? "600" : "400" }]}>{label}</Text>
      <Text style={[styles.value, { color: color ?? c.text, fontWeight: bold ? "700" : "500" }]}>{value}</Text>
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
