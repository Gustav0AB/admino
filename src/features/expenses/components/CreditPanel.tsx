import { useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { useExpensesStore } from "../store";
import {
  formatMXN,
  getCreditCycleInfo,
  getCreditHistory,
  getCurrentCreditBalance,
} from "../helpers";

export function CreditPanel() {
  const c = useColors();
  const {
    expenses,
    initialCreditDebt,
    creditDebtMes,
    creditCutDay,
    creditPayDay,
    setInitialCreditDebt,
    setCreditCutDay,
    setCreditPayDay,
  } = useExpensesStore();

  const [showHistory, setShowHistory] = useState(false);

  const history = useMemo(
    () => getCreditHistory(expenses, initialCreditDebt, creditDebtMes),
    [expenses, initialCreditDebt, creditDebtMes]
  );

  const cycle = useMemo(
    () => getCreditCycleInfo(expenses, initialCreditDebt, creditCutDay, creditPayDay),
    [expenses, initialCreditDebt, creditCutDay, creditPayDay]
  );

  const currentBalance = getCurrentCreditBalance(history, initialCreditDebt);

  return (
    <View style={[styles.card, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Crédito</Text>
        <View style={[styles.monthBadge, { backgroundColor: `${c.primary}20` }]}>
          <Text style={[styles.monthText, { color: c.primary }]}>{cycle.currentMonth}</Text>
        </View>
      </View>

      {/* Cycle status */}
      {creditCutDay > 0 && (
        <View style={styles.cycleSection}>
          <View style={styles.cycleRow}>
            <Text style={[styles.cycleLabel, { color: c.textMuted }]}>Corte: día {cycle.cutDay}</Text>
            <Text style={[styles.cycleLabel, { color: c.textMuted }]}>Pago: día {cycle.payDay}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cycle.isCutPassed ? "#EF444420" : "#16A34A20" }]}>
            <Text style={[styles.statusText, { color: cycle.isCutPassed ? "#EF4444" : "#16A34A" }]}>
              {cycle.isCutPassed ? "🔒 Estado de cuenta cerrado" : "🟢 Periodo de compras"}
            </Text>
          </View>
          {cycle.payDay > 0 && (
            <Text style={[styles.daysText, { color: cycle.isPayDayPassed ? c.danger : c.textMuted }]}>
              {cycle.isPayDayPassed
                ? "⚠️ Fecha de pago vencida"
                : `${cycle.daysUntilPayDay} días para el pago`}
            </Text>
          )}
        </View>
      )}

      {/* Debt breakdown */}
      <View style={styles.section}>
        <DebtRow label="Adeudo estado de cuenta" value={cycle.frozenDebt} c={c} />
        {cycle.totalPayments > 0 && (
          <DebtRow label="Pagos realizados" value={-cycle.totalPayments} c={c} color="#16A34A" />
        )}
        {cycle.remainingDebt > 0 && (
          <DebtRow label={`Saldo a pagar (día ${cycle.payDay})`} value={cycle.remainingDebt} c={c} color={c.danger} bold />
        )}
        {cycle.newCharges > 0 && (
          <DebtRow label="Nuevos cargos (próx. ciclo)" value={cycle.newCharges} c={c} color={c.textMuted} />
        )}
      </View>

      {/* Config */}
      <View style={[styles.section, styles.configSection]}>
        <ConfigInput
          label="Adeudo inicial ($)"
          value={String(initialCreditDebt || "")}
          onChangeText={(v) => setInitialCreditDebt(parseFloat(v) || 0)}
          keyboardType="numeric"
          c={c}
        />
        <ConfigInput
          label="Día de corte"
          value={String(creditCutDay || "")}
          onChangeText={(v) => setCreditCutDay(parseInt(v) || 0)}
          keyboardType="numeric"
          c={c}
        />
        <ConfigInput
          label="Día de pago"
          value={String(creditPayDay || "")}
          onChangeText={(v) => setCreditPayDay(parseInt(v) || 0)}
          keyboardType="numeric"
          c={c}
        />
      </View>

      {/* History toggle */}
      <TouchableOpacity onPress={() => setShowHistory(!showHistory)} style={styles.historyToggle}>
        <Text style={[styles.historyToggleText, { color: c.primary }]}>
          {showHistory ? "▲ Ocultar historial" : "▼ Ver historial"}
        </Text>
      </TouchableOpacity>

      {showHistory && (
        <View style={styles.historyList}>
          {history.length === 0 ? (
            <Text style={[styles.emptyText, { color: c.textMuted }]}>Sin movimientos</Text>
          ) : (
            history.map((entry) => (
              <View key={entry.id} style={[styles.historyEntry, { borderBottomColor: c.border }]}>
                <View style={[styles.typeBadge, { backgroundColor: entry.type === "cargo" ? "#EF444420" : "#16A34A20" }]}>
                  <Text style={[styles.typeBadgeText, { color: entry.type === "cargo" ? "#EF4444" : "#16A34A" }]}>
                    {entry.type === "cargo" ? "▲ cargo" : "▼ pago"}
                  </Text>
                </View>
                <View style={styles.historyMeta}>
                  <Text style={[styles.historyDesc, { color: c.text }]}>{entry.description}</Text>
                  <Text style={[styles.historyMes, { color: c.textMuted }]}>{entry.mes}</Text>
                </View>
                <View style={styles.historyAmounts}>
                  <Text style={[styles.historyAmt, { color: entry.type === "cargo" ? c.danger : "#16A34A" }]}>
                    {entry.type === "cargo" ? "+" : "-"}${formatMXN(entry.amount)}
                  </Text>
                  <Text style={[styles.historyBal, { color: c.textMuted }]}>${formatMXN(entry.balance)}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
}

function DebtRow({ label, value, c, color, bold }: {
  label: string; value: number; c: ReturnType<typeof useColors>; color?: string; bold?: boolean;
}) {
  return (
    <View style={styles.debtRow}>
      <Text style={[styles.debtLabel, { color: c.textMuted, fontWeight: bold ? "600" : "400" }]}>{label}</Text>
      <Text style={[styles.debtValue, { color: color ?? c.text, fontWeight: bold ? "700" : "500" }]}>
        ${formatMXN(Math.abs(value))}
      </Text>
    </View>
  );
}

function ConfigInput({ label, value, onChangeText, keyboardType, c }: {
  label: string; value: string; onChangeText: (v: string) => void; keyboardType?: "numeric"; c: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.configRow}>
      <Text style={[styles.configLabel, { color: c.textMuted }]}>{label}</Text>
      <TextInput
        style={[styles.configInput, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder="0"
        placeholderTextColor={c.textPlaceholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: BORDER_RADIUS.md, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.md, gap: SPACING.sm },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "700" },
  monthBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  monthText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },

  cycleSection: { gap: SPACING.xs },
  cycleRow: { flexDirection: "row", justifyContent: "space-between" },
  cycleLabel: { fontSize: TYPOGRAPHY.fontSize.xs },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.sm, alignSelf: "flex-start" },
  statusText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },
  daysText: { fontSize: TYPOGRAPHY.fontSize.xs },

  section: { gap: SPACING.xs },
  debtRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  debtLabel: { fontSize: TYPOGRAPHY.fontSize.xs, flex: 1 },
  debtValue: { fontSize: TYPOGRAPHY.fontSize.xs },

  configSection: { paddingTop: SPACING.xs },
  configRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  configLabel: { fontSize: TYPOGRAPHY.fontSize.xs, flex: 1 },
  configInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, fontSize: TYPOGRAPHY.fontSize.sm, width: 80, textAlign: "right" },

  historyToggle: { paddingVertical: SPACING.xs },
  historyToggleText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },
  historyList: { gap: SPACING.xs },
  emptyText: { fontSize: TYPOGRAPHY.fontSize.xs },
  historyEntry: { flexDirection: "row", alignItems: "center", paddingVertical: SPACING.xs, borderBottomWidth: StyleSheet.hairlineWidth, gap: SPACING.sm },
  typeBadge: { paddingHorizontal: SPACING.xs, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm },
  typeBadgeText: { fontSize: 10, fontWeight: "600" },
  historyMeta: { flex: 1 },
  historyDesc: { fontSize: TYPOGRAPHY.fontSize.xs },
  historyMes: { fontSize: 10 },
  historyAmounts: { alignItems: "flex-end" },
  historyAmt: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },
  historyBal: { fontSize: 10 },
});
