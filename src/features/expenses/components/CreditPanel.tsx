import { useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { useExpensesStore } from "../store";
import { usePlanningStore } from "../planning/store";
import {
  currentMonthName,
  currentYear,
  formatMXN,
  getCreditCycleInfoForCard,
  getCreditHistoryForCard,
  getCurrentCreditBalance,
  getMSIPendingForCard,
} from "../helpers";
import type { CreditCard, Expense } from "../types";

export function CreditPanel() {
  const c = useColors();
  const { expenses, creditCards, addCreditCard, updateCreditCard, removeCreditCard, addCardPayment } = useExpensesStore();
  const { installmentPayments } = usePlanningStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCutDay, setNewCutDay] = useState("");
  const [newPayDay, setNewPayDay] = useState("");
  const [newDebt, setNewDebt] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) return;
    addCreditCard({
      name: newName.trim(),
      cutDay: parseInt(newCutDay) || 0,
      payDay: parseInt(newPayDay) || 0,
      initialDebt: parseFloat(newDebt) || 0,
      debtMes: currentMonthName(),
    });
    setNewName("");
    setNewCutDay("");
    setNewPayDay("");
    setNewDebt("");
    setShowAddForm(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Crédito</Text>
        <TouchableOpacity
          onPress={() => setShowAddForm((v) => !v)}
          style={[styles.addBtn, { borderColor: c.border }]}
        >
          <Text style={[styles.addBtnText, { color: c.primary }]}>+ Tarjeta</Text>
        </TouchableOpacity>
      </View>

      {creditCards.length === 0 && !showAddForm && (
        <Text style={[styles.emptyText, { color: c.textMuted }]}>
          No tienes tarjetas configuradas
        </Text>
      )}

      {creditCards.map((card) => (
        <CardSection
          key={card.id}
          card={card}
          expenses={expenses}
          onUpdate={(patch) => updateCreditCard(card.id, patch)}
          onRemove={() => removeCreditCard(card.id)}
          onPayment={(amount) => addCardPayment(card.id, amount, currentMonthName(), currentYear())}
          c={c}
          installmentPayments={installmentPayments}
        />
      ))}

      {showAddForm && (
        <View style={[styles.addForm, { borderColor: c.border }]}>
          <Text style={[styles.addFormTitle, { color: c.text }]}>Nueva tarjeta</Text>
          <ConfigInput label="Nombre" value={newName} onChangeText={setNewName} c={c} />
          <ConfigInput label="Día de corte" value={newCutDay} onChangeText={setNewCutDay} keyboardType="numeric" c={c} />
          <ConfigInput label="Día de pago" value={newPayDay} onChangeText={setNewPayDay} keyboardType="numeric" c={c} />
          <ConfigInput label="Adeudo inicial ($)" value={newDebt} onChangeText={setNewDebt} keyboardType="numeric" c={c} />
          <View style={styles.addFormActions}>
            <TouchableOpacity
              onPress={() => setShowAddForm(false)}
              style={[styles.btn, { borderColor: c.border }]}
            >
              <Text style={[styles.btnText, { color: c.text }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAdd}
              style={[styles.btn, { backgroundColor: c.primary, borderColor: c.primary }]}
            >
              <Text style={[styles.btnText, { color: c.primaryForeground }]}>Agregar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

function CardSection({
  card,
  expenses,
  onUpdate,
  onRemove,
  onPayment,
  c,
  installmentPayments,
}: {
  card: CreditCard;
  expenses: Expense[];
  onUpdate: (patch: Partial<CreditCard>) => void;
  onRemove: () => void;
  onPayment: (amount: number) => void;
  c: ReturnType<typeof useColors>;
  installmentPayments: import("../planning/types").InstallmentPayment[];
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");

  const cycle = useMemo(() => getCreditCycleInfoForCard(expenses, card), [expenses, card]);
  const history = useMemo(() => getCreditHistoryForCard(expenses, card), [expenses, card]);
  const currentBalance = getCurrentCreditBalance(history, card.initialDebt);
  const msi = useMemo(() => getMSIPendingForCard(installmentPayments, card.id), [installmentPayments, card.id]);

  return (
    <View style={[styles.cardSection, { borderColor: c.border }]}>
      <View style={styles.cardHeader}>
        <TextInput
          style={[styles.cardNameInput, { color: c.text, borderColor: c.border }]}
          value={card.name}
          onChangeText={(v) => onUpdate({ name: v })}
          placeholder="Nombre de tarjeta"
          placeholderTextColor={c.textPlaceholder}
        />
        <View style={[styles.monthBadge, { backgroundColor: `${c.primary}20` }]}>
          <Text style={[styles.monthText, { color: c.primary }]}>{cycle.currentMonth}</Text>
        </View>
        {confirmRemove ? (
          <View style={styles.confirmRow}>
            <Text style={[styles.confirmText, { color: c.danger }]}>¿Eliminar?</Text>
            <TouchableOpacity onPress={onRemove}>
              <Text style={[styles.confirmBtn, { color: c.danger }]}>Sí</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setConfirmRemove(false)}>
              <Text style={[styles.confirmBtn, { color: c.textMuted }]}>No</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setConfirmRemove(true)}>
            <Text style={[styles.removeBtn, { color: c.textMuted }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {card.cutDay > 0 && (
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

      <View style={styles.section}>
        <DebtRow label="Adeudo estado de cuenta" value={cycle.frozenDebt} c={c} />
        {cycle.totalPayments > 0 && (
          <DebtRow label="Pagos realizados" value={-cycle.totalPayments} c={c} color="#16A34A" />
        )}
        {cycle.remainingDebt > 0 && (
          <DebtRow label={`Saldo a pagar (día ${cycle.payDay})`} value={cycle.remainingDebt} c={c} color={c.danger} bold />
        )}
        {cycle.newCharges > 0 && (
          <DebtRow
            label={cycle.isCutPassed ? "Nuevos cargos (próx. ciclo)" : "Cargos del ciclo actual"}
            value={cycle.newCharges}
            c={c}
            color={c.textMuted}
          />
        )}
        <DebtRow label="Balance actual" value={currentBalance} c={c} />
        {(card.creditLimit ?? 0) > 0 && (
          <CreditLimitBar limit={card.creditLimit!} used={currentBalance} c={c} />
        )}
      </View>

      {msi.count > 0 && (
        <View style={[styles.msiSection, { borderColor: c.border, backgroundColor: `${c.primary}08` }]}>
          <Text style={[styles.msiTitle, { color: c.textMuted }]}>MSI activos</Text>
          <View style={styles.msiRow}>
            <View style={[styles.msiBadge, { backgroundColor: `${c.primary}18` }]}>
              <Text style={[styles.msiBadgeText, { color: c.primary }]}>{msi.count} plan{msi.count !== 1 ? "es" : ""}</Text>
            </View>
            <Text style={[styles.msiAmount, { color: c.text }]}>${formatMXN(msi.monthlyTotal)}/mes</Text>
            <Text style={[styles.msiPending, { color: c.textMuted }]}>${formatMXN(msi.totalPending)} pendiente</Text>
          </View>
        </View>
      )}

      {cycle.frozenDebt > 0 && (
        <View style={[styles.paySection, { borderColor: c.border }]}>
          {showPayForm ? (
            <View style={styles.payForm}>
              <Text style={[styles.payLabel, { color: c.textMuted }]}>Monto a pagar</Text>
              <TextInput
                style={[styles.payInput, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
                value={payAmount}
                onChangeText={setPayAmount}
                keyboardType="numeric"
                placeholder={String(cycle.remainingDebt || cycle.frozenDebt)}
                placeholderTextColor={c.textPlaceholder}
                autoFocus
              />
              <View style={styles.payActions}>
                <TouchableOpacity
                  onPress={() => { setShowPayForm(false); setPayAmount(""); }}
                  style={[styles.btn, { borderColor: c.border }]}
                >
                  <Text style={[styles.btnText, { color: c.text }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const amount = parseFloat(payAmount);
                    if (!amount || amount <= 0) return;
                    onPayment(amount);
                    setShowPayForm(false);
                    setPayAmount("");
                  }}
                  style={[styles.btn, { backgroundColor: c.primary, borderColor: c.primary }]}
                >
                  <Text style={[styles.btnText, { color: c.primaryForeground }]}>Confirmar pago</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => { setShowPayForm(true); setPayAmount(String(cycle.remainingDebt || cycle.frozenDebt)); }}
              style={[styles.btn, { borderColor: c.border, alignSelf: "flex-start" }]}
            >
              <Text style={[styles.btnText, { color: c.primary }]}>💳 Registrar pago con efectivo</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={[styles.section, styles.configSection]}>
        <ConfigInput
          label="Adeudo inicial ($)"
          value={String(card.initialDebt || "")}
          onChangeText={(v) => onUpdate({ initialDebt: parseFloat(v) || 0 })}
          keyboardType="numeric"
          c={c}
        />
        <ConfigInput
          label="Límite de crédito ($)"
          value={String(card.creditLimit || "")}
          onChangeText={(v) => onUpdate({ creditLimit: parseFloat(v) || 0 })}
          keyboardType="numeric"
          c={c}
        />
        <ConfigInput
          label="Día de corte"
          value={String(card.cutDay || "")}
          onChangeText={(v) => onUpdate({ cutDay: parseInt(v) || 0 })}
          keyboardType="numeric"
          c={c}
        />
        <ConfigInput
          label="Día de pago"
          value={String(card.payDay || "")}
          onChangeText={(v) => onUpdate({ payDay: parseInt(v) || 0 })}
          keyboardType="numeric"
          c={c}
        />
      </View>

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

function CreditLimitBar({ limit, used, c }: { limit: number; used: number; c: ReturnType<typeof useColors> }) {
  const pct = Math.min(100, Math.max(0, (used / limit) * 100));
  const available = Math.max(0, limit - used);
  const barColor = pct >= 80 ? "#EF4444" : pct >= 50 ? "#F59E0B" : "#16A34A";
  return (
    <View style={styles.limitSection}>
      <View style={styles.limitRow}>
        <Text style={[styles.limitLabel, { color: c.textMuted }]}>Disponible</Text>
        <Text style={[styles.limitLabel, { color: c.textMuted }]}>${formatMXN(available)} / ${formatMXN(limit)}</Text>
      </View>
      <View style={[styles.limitTrack, { backgroundColor: `${barColor}22` }]}>
        <View style={[styles.limitFill, { width: `${pct}%` as `${number}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={[styles.limitPct, { color: barColor }]}>{pct.toFixed(0)}% utilizado</Text>
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
  container: { borderRadius: BORDER_RADIUS.md, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.md, gap: SPACING.sm },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "700" },
  addBtn: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.sm, borderWidth: 1 },
  addBtnText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },
  emptyText: { fontSize: TYPOGRAPHY.fontSize.xs, fontStyle: "italic" },

  cardSection: { borderWidth: StyleSheet.hairlineWidth, borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm, gap: SPACING.sm },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  cardNameInput: { flex: 1, fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600", borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 2 },
  monthBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  monthText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },
  removeBtn: { fontSize: TYPOGRAPHY.fontSize.md, paddingHorizontal: SPACING.xs },
  confirmRow: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
  confirmText: { fontSize: TYPOGRAPHY.fontSize.xs },
  confirmBtn: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "700", paddingHorizontal: SPACING.xs },

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
  historyEntry: { flexDirection: "row", alignItems: "center", paddingVertical: SPACING.xs, borderBottomWidth: StyleSheet.hairlineWidth, gap: SPACING.sm },
  typeBadge: { paddingHorizontal: SPACING.xs, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm },
  typeBadgeText: { fontSize: 10, fontWeight: "600" },
  historyMeta: { flex: 1 },
  historyDesc: { fontSize: TYPOGRAPHY.fontSize.xs },
  historyMes: { fontSize: 10 },
  historyAmounts: { alignItems: "flex-end" },
  historyAmt: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },
  historyBal: { fontSize: 10 },

  limitSection: { gap: 4, paddingTop: SPACING.xs },
  limitRow: { flexDirection: "row" as const, justifyContent: "space-between" as const },
  limitLabel: { fontSize: 10 },
  limitTrack: { height: 6, borderRadius: 3, overflow: "hidden" as const },
  limitFill: { height: 6, borderRadius: 3 },
  limitPct: { fontSize: 10, fontWeight: "600" as const, textAlign: "right" as const },

  msiSection: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: SPACING.sm, gap: SPACING.xs, borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm },
  msiTitle: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "700" as const, textTransform: "uppercase" as const, letterSpacing: 0.4 },
  msiRow: { flexDirection: "row" as const, alignItems: "center" as const, flexWrap: "wrap" as const, gap: SPACING.sm },
  msiBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  msiBadgeText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "700" as const },
  msiAmount: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" as const },
  msiPending: { fontSize: TYPOGRAPHY.fontSize.xs },

  paySection: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: SPACING.sm },
  payForm: { gap: SPACING.sm },
  payLabel: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },
  payInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, fontSize: TYPOGRAPHY.fontSize.sm },
  payActions: { flexDirection: "row" as const, justifyContent: "flex-end" as const, gap: SPACING.sm },

  addForm: { borderWidth: StyleSheet.hairlineWidth, borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm, gap: SPACING.sm },
  addFormTitle: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" },
  addFormActions: { flexDirection: "row", gap: SPACING.sm, justifyContent: "flex-end" },
  btn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.sm, borderWidth: 1 },
  btnText: { fontSize: TYPOGRAPHY.fontSize.sm },
});
