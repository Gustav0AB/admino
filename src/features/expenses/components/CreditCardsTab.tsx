import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CustomSelect } from "@/shared/components/inputs/CustomSelect";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { useExpensesStore } from "../store";
import {
  currentMonthName,
  currentYear,
  formatMXN,
  getCreditCycleInfoForCard,
  getCreditHistoryForCard,
  getCurrentCreditBalance,
  MESES_LIST,
} from "../helpers";
import type { CreditCard, Expense } from "../types";

const MES_OPTIONS = MESES_LIST.map((m) => ({ label: m, value: m }));

type AddCardForm = {
  name: string;
  cutDay: string;
  payDay: string;
  initialDebt: string;
};

function blankAddForm(): AddCardForm {
  return { name: "", cutDay: "", payDay: "", initialDebt: "" };
}

export function CreditCardsTab() {
  const c = useColors();
  const { expenses, creditCards, addCreditCard, updateCreditCard, removeCreditCard, addCardPayment } =
    useExpensesStore();

  const [selectedMes, setSelectedMes] = useState(currentMonthName());
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<AddCardForm>(blankAddForm());

  function handleAdd() {
    if (!addForm.name.trim()) return;
    addCreditCard({
      name: addForm.name.trim(),
      cutDay: parseInt(addForm.cutDay) || 0,
      payDay: parseInt(addForm.payDay) || 0,
      initialDebt: parseFloat(addForm.initialDebt) || 0,
      debtMes: selectedMes,
    });
    setAddForm(blankAddForm());
    setShowAddForm(false);
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.mesSelector}>
          <Text style={[styles.mesLabel, { color: c.textMuted }]}>Mes</Text>
          <CustomSelect
            value={selectedMes}
            options={MES_OPTIONS}
            onChange={(v) => setSelectedMes(String(v))}
            style={styles.mesSelect}
          />
        </View>
        <CustomButton variant="outline" size="sm" onPress={() => { setShowAddForm(true); setAddForm(blankAddForm()); }}>
          + Nueva tarjeta
        </CustomButton>
      </View>

      {/* Add form */}
      {showAddForm && (
        <View style={[styles.addCard, { backgroundColor: c.backgroundStrong, borderColor: c.primary }]}>
          <Text style={[styles.addCardTitle, { color: c.text }]}>Nueva tarjeta</Text>
          <View style={styles.addGrid}>
            <AddField label="Nombre" value={addForm.name} onChangeText={(v) => setAddForm((f) => ({ ...f, name: v }))} placeholder="Ej. BBVA Azul" c={c} />
            <AddField label="Día de corte" value={addForm.cutDay} onChangeText={(v) => setAddForm((f) => ({ ...f, cutDay: v }))} placeholder="15" keyboardType="numeric" c={c} />
            <AddField label="Día de pago" value={addForm.payDay} onChangeText={(v) => setAddForm((f) => ({ ...f, payDay: v }))} placeholder="5" keyboardType="numeric" c={c} />
            <AddField label="Adeudo inicial ($)" value={addForm.initialDebt} onChangeText={(v) => setAddForm((f) => ({ ...f, initialDebt: v }))} placeholder="0" keyboardType="numeric" c={c} />
          </View>
          <View style={styles.addActions}>
            <CustomButton variant="outline" size="sm" onPress={() => setShowAddForm(false)}>Cancelar</CustomButton>
            <CustomButton variant="primary" size="sm" onPress={handleAdd}>Agregar</CustomButton>
          </View>
        </View>
      )}

      {/* Empty state */}
      {creditCards.length === 0 && !showAddForm && (
        <View style={[styles.emptyState, { borderColor: c.border }]}>
          <Text style={[styles.emptyText, { color: c.textMuted }]}>
            Aún no tienes tarjetas configuradas.{"\n"}Agrega una para ver los cargos por mes.
          </Text>
        </View>
      )}

      {/* Cards */}
      {creditCards.map((card) => (
        <CardItem
          key={card.id}
          card={card}
          expenses={expenses}
          selectedMes={selectedMes}
          onUpdate={(patch) => updateCreditCard(card.id, patch)}
          onRemove={() => removeCreditCard(card.id)}
          onPayment={(amount) => addCardPayment(card.id, amount, currentMonthName(), currentYear())}
          c={c}
        />
      ))}
    </ScrollView>
  );
}

type CardItemProps = {
  card: CreditCard;
  expenses: Expense[];
  selectedMes: string;
  onUpdate: (patch: Partial<CreditCard>) => void;
  onRemove: () => void;
  onPayment: (amount: number) => void;
  c: ReturnType<typeof useColors>;
};

function CardItem({ card, expenses, selectedMes, onUpdate, onRemove, onPayment, c }: CardItemProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");

  const cycle = useMemo(() => getCreditCycleInfoForCard(expenses, card), [expenses, card]);
  const history = useMemo(() => getCreditHistoryForCard(expenses, card), [expenses, card]);
  const currentBalance = getCurrentCreditBalance(history, card.initialDebt);

  // Charges to this card for the selected month
  const monthCharges = useMemo(
    () => expenses.filter((e) => e.creditCardId === card.id && e.mes === selectedMes),
    [expenses, card.id, selectedMes]
  );
  const monthTotal = monthCharges.reduce((s, e) => s + e.monto, 0);

  return (
    <View style={[styles.card, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <TextInput
          style={[styles.cardName, { color: c.text, borderBottomColor: c.border }]}
          value={card.name}
          onChangeText={(v) => onUpdate({ name: v })}
          placeholderTextColor={c.textPlaceholder}
          placeholder="Nombre de tarjeta"
        />
        <View style={[styles.badge, { backgroundColor: `${c.primary}18` }]}>
          <Text style={[styles.badgeText, { color: c.primary }]}>{cycle.currentMonth}</Text>
        </View>
        {confirmRemove ? (
          <View style={styles.confirmRow}>
            <Text style={[styles.confirmLabel, { color: c.danger }]}>¿Eliminar?</Text>
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

      {/* Cycle status */}
      {card.cutDay > 0 && (
        <View style={styles.cycleRow}>
          <Text style={[styles.cycleText, { color: c.textMuted }]}>Corte: día {cycle.cutDay}</Text>
          <Text style={[styles.cycleText, { color: c.textMuted }]}>Pago: día {cycle.payDay}</Text>
          <View style={[styles.statusPill, { backgroundColor: cycle.isCutPassed ? "#EF444418" : "#16A34A18" }]}>
            <Text style={[styles.statusPillText, { color: cycle.isCutPassed ? "#EF4444" : "#16A34A" }]}>
              {cycle.isCutPassed ? "🔒 Cerrado" : "🟢 Abierto"}
            </Text>
          </View>
          {!cycle.isPayDayPassed && cycle.payDay > 0 && (
            <Text style={[styles.cycleText, { color: c.textMuted }]}>{cycle.daysUntilPayDay} días para pago</Text>
          )}
          {cycle.isPayDayPassed && (
            <Text style={[styles.cycleText, { color: c.danger }]}>⚠️ Pago vencido</Text>
          )}
        </View>
      )}

      {/* Debt summary */}
      <View style={[styles.debtSection, { borderColor: c.border }]}>
        <DebtRow label="Adeudo estado de cuenta" value={cycle.frozenDebt} c={c} />
        {cycle.totalPayments > 0 && <DebtRow label="Pagos realizados" value={-cycle.totalPayments} c={c} color="#16A34A" />}
        {cycle.remainingDebt > 0 && <DebtRow label={`Saldo a pagar (día ${cycle.payDay})`} value={cycle.remainingDebt} c={c} color={c.danger} bold />}
        {cycle.newCharges > 0 && (
          <DebtRow
            label={cycle.isCutPassed ? "Nuevos cargos (próx. ciclo)" : "Cargos del ciclo actual"}
            value={cycle.newCharges}
            c={c}
            color={c.textMuted}
          />
        )}
        <DebtRow label="Balance actual" value={currentBalance} c={c} />
      </View>

      {/* Pay button */}
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
                <CustomButton variant="outline" size="sm" onPress={() => { setShowPayForm(false); setPayAmount(""); }}>
                  Cancelar
                </CustomButton>
                <CustomButton
                  variant="primary"
                  size="sm"
                  onPress={() => {
                    const amount = parseFloat(payAmount);
                    if (!amount || amount <= 0) return;
                    onPayment(amount);
                    setShowPayForm(false);
                    setPayAmount("");
                  }}
                >
                  Confirmar pago
                </CustomButton>
              </View>
            </View>
          ) : (
            <CustomButton
              variant="outline"
              size="sm"
              onPress={() => { setShowPayForm(true); setPayAmount(String(cycle.remainingDebt || cycle.frozenDebt)); }}
            >
              💳 Registrar pago con efectivo
            </CustomButton>
          )}
        </View>
      )}

      {/* Month charges */}
      <View style={[styles.monthSection, { borderColor: c.border }]}>
        <Text style={[styles.monthTitle, { color: c.textMuted }]}>
          Cargos en {selectedMes} ({monthCharges.length})
        </Text>
        {monthCharges.length === 0 ? (
          <Text style={[styles.emptyText, { color: c.textPlaceholder }]}>Sin cargos este mes</Text>
        ) : (
          <>
            {monthCharges.map((e) => (
              <View key={e.id} style={styles.chargeRow}>
                <Text style={[styles.chargeDesc, { color: c.text }]} numberOfLines={1}>{e.gastos}</Text>
                <Text style={[styles.chargeAmt, { color: c.text }]}>${formatMXN(e.monto)}</Text>
              </View>
            ))}
            <View style={[styles.chargeRow, styles.chargeTotalRow]}>
              <Text style={[styles.chargeDesc, { color: c.textMuted, fontWeight: "600" }]}>Total</Text>
              <Text style={[styles.chargeAmt, { color: c.primary, fontWeight: "700" }]}>${formatMXN(monthTotal)}</Text>
            </View>
          </>
        )}
      </View>

      {/* Config fields */}
      <View style={[styles.configSection, { borderColor: c.border }]}>
        <Text style={[styles.monthTitle, { color: c.textMuted }]}>Configuración</Text>
        <View style={styles.configGrid}>
          <ConfigInput label="Adeudo inicial ($)" value={String(card.initialDebt || "")} onChangeText={(v) => onUpdate({ initialDebt: parseFloat(v) || 0 })} keyboardType="numeric" c={c} />
          <ConfigInput label="Día de corte" value={String(card.cutDay || "")} onChangeText={(v) => onUpdate({ cutDay: parseInt(v) || 0 })} keyboardType="numeric" c={c} />
          <ConfigInput label="Día de pago" value={String(card.payDay || "")} onChangeText={(v) => onUpdate({ payDay: parseInt(v) || 0 })} keyboardType="numeric" c={c} />
        </View>
      </View>

      {/* History */}
      <TouchableOpacity onPress={() => setShowHistory((v) => !v)} style={styles.historyToggle}>
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
                <View style={[styles.typePill, { backgroundColor: entry.type === "cargo" ? "#EF444418" : "#16A34A18" }]}>
                  <Text style={[styles.typePillText, { color: entry.type === "cargo" ? "#EF4444" : "#16A34A" }]}>
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

function DebtRow({ label, value, c, color, bold }: { label: string; value: number; c: ReturnType<typeof useColors>; color?: string; bold?: boolean }) {
  return (
    <View style={styles.debtRow}>
      <Text style={[styles.debtLabel, { color: c.textMuted, fontWeight: bold ? "600" : "400" }]}>{label}</Text>
      <Text style={[styles.debtValue, { color: color ?? c.text, fontWeight: bold ? "700" : "500" }]}>${formatMXN(Math.abs(value))}</Text>
    </View>
  );
}

function ConfigInput({ label, value, onChangeText, keyboardType, c }: { label: string; value: string; onChangeText: (v: string) => void; keyboardType?: "numeric"; c: ReturnType<typeof useColors> }) {
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

function AddField({ label, value, onChangeText, placeholder, keyboardType, c }: { label: string; value: string; onChangeText: (v: string) => void; placeholder?: string; keyboardType?: "numeric"; c: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.addField}>
      <Text style={[styles.addFieldLabel, { color: c.textMuted }]}>{label}</Text>
      <TextInput
        style={[styles.addFieldInput, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textPlaceholder}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xl },

  topBar: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: SPACING.sm },
  mesSelector: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  mesLabel: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" },
  mesSelect: { minWidth: 140 },

  emptyState: { borderWidth: 1, borderStyle: "dashed", borderRadius: BORDER_RADIUS.md, padding: SPACING.xl, alignItems: "center" },
  emptyText: { fontSize: TYPOGRAPHY.fontSize.sm, textAlign: "center", lineHeight: 20 },

  addCard: { borderRadius: BORDER_RADIUS.md, borderWidth: 1, padding: SPACING.md, gap: SPACING.md },
  addCardTitle: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "700" },
  addGrid: { gap: SPACING.sm },
  addActions: { flexDirection: "row", justifyContent: "flex-end", gap: SPACING.sm },
  addField: { gap: 4 },
  addFieldLabel: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "500" },
  addFieldInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, fontSize: TYPOGRAPHY.fontSize.sm },

  card: { borderRadius: BORDER_RADIUS.md, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.md, gap: SPACING.md },

  cardHeader: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  cardName: { flex: 1, fontSize: TYPOGRAPHY.fontSize.md, fontWeight: "700", borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 2 },
  badge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  badgeText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },
  removeBtn: { fontSize: 16, paddingHorizontal: SPACING.xs },
  confirmRow: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
  confirmLabel: { fontSize: TYPOGRAPHY.fontSize.xs },
  confirmBtn: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "700", paddingHorizontal: SPACING.xs },

  cycleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: SPACING.sm },
  cycleText: { fontSize: TYPOGRAPHY.fontSize.xs },
  statusPill: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm },
  statusPillText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },

  debtSection: { gap: SPACING.xs, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: SPACING.sm },
  debtRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  debtLabel: { fontSize: TYPOGRAPHY.fontSize.xs, flex: 1 },
  debtValue: { fontSize: TYPOGRAPHY.fontSize.xs },

  monthSection: { gap: SPACING.xs, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: SPACING.sm },
  monthTitle: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  chargeRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  chargeTotalRow: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: SPACING.xs, marginTop: 2 },
  chargeDesc: { fontSize: TYPOGRAPHY.fontSize.xs, flex: 1 },
  chargeAmt: { fontSize: TYPOGRAPHY.fontSize.xs },

  paySection: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: SPACING.sm },
  payForm: { gap: SPACING.sm },
  payLabel: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },
  payInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, fontSize: TYPOGRAPHY.fontSize.sm },
  payActions: { flexDirection: "row", justifyContent: "flex-end", gap: SPACING.sm },

  configSection: { gap: SPACING.sm, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: SPACING.sm },
  configGrid: { gap: SPACING.xs },
  configRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  configLabel: { fontSize: TYPOGRAPHY.fontSize.xs, flex: 1 },
  configInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, fontSize: TYPOGRAPHY.fontSize.sm, width: 90, textAlign: "right" },

  historyToggle: { paddingVertical: SPACING.xs },
  historyToggleText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },
  historyList: { gap: SPACING.xs },
  historyEntry: { flexDirection: "row", alignItems: "center", paddingVertical: SPACING.xs, borderBottomWidth: StyleSheet.hairlineWidth, gap: SPACING.sm },
  typePill: { paddingHorizontal: SPACING.xs, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm },
  typePillText: { fontSize: 10, fontWeight: "600" },
  historyMeta: { flex: 1 },
  historyDesc: { fontSize: TYPOGRAPHY.fontSize.xs },
  historyMes: { fontSize: 10 },
  historyAmounts: { alignItems: "flex-end" },
  historyAmt: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },
  historyBal: { fontSize: 10 },
});
