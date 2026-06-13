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
import { usePlanningStore } from "../planning/store";
import {
  currentMonthName,
  currentYear,
  formatMXN,
  getBillingCycleStatus,
  getBillingPeriodCharges,
  getBillingPeriodLabel,
  getCreditCycleInfoForCard,
  getCreditHistoryForCard,
  getCurrentCreditBalance,
  getAvailableAños,
  getMSIPendingForCard,
  MESES_LIST,
  nextMonthName,
} from "../helpers";
import type { BillingCycleStatus } from "../helpers";
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
  const { installmentPayments } = usePlanningStore();

  const [selectedMes, setSelectedMes] = useState(currentMonthName());
  const [selectedAño, setSelectedAño] = useState(currentYear());
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<AddCardForm>(blankAddForm());

  const añoOptions = useMemo(
    () => [
      ...getAvailableAños(expenses).map((y) => ({ label: String(y), value: y })),
      { label: String(currentYear() + 1), value: currentYear() + 1 },
    ].filter((o, i, arr) => arr.findIndex((x) => x.value === o.value) === i).sort((a, b) => a.value - b.value),
    [expenses],
  );

  function handleAdd() {
    if (!addForm.name.trim()) return;
    addCreditCard({
      name: addForm.name.trim(),
      cutDay: parseInt(addForm.cutDay) || 0,
      payDay: parseInt(addForm.payDay) || 0,
      initialDebt: parseFloat(addForm.initialDebt) || 0,
      debtMes: selectedMes,
      debtAño: selectedAño,
    });
    setAddForm(blankAddForm());
    setShowAddForm(false);
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.mesSelector}>
          <Text style={[styles.mesLabel, { color: c.textMuted }]}>Año</Text>
          <CustomSelect
            value={selectedAño}
            options={añoOptions}
            onChange={(v) => setSelectedAño(Number(v))}
            style={{ minWidth: 90 }}
          />
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
          selectedAño={selectedAño}
          onUpdate={(patch) => updateCreditCard(card.id, patch)}
          onRemove={() => removeCreditCard(card.id)}
          onPayment={(amount) => addCardPayment(card.id, amount, currentMonthName(), currentYear())}
          c={c}
          installmentPayments={installmentPayments}
        />
      ))}
    </ScrollView>
  );
}

type CardItemProps = {
  card: CreditCard;
  expenses: Expense[];
  selectedMes: string;
  selectedAño: number;
  onUpdate: (patch: Partial<CreditCard>) => void;
  onRemove: () => void;
  onPayment: (amount: number) => void;
  c: ReturnType<typeof useColors>;
  installmentPayments: import("../planning/types").InstallmentPayment[];
};

const CYCLE_STATUS_CONFIG: Record<BillingCycleStatus, { label: string; color: string; bg: string }> = {
  cerrado:      { label: "🔒 Cerrado",      color: "#EF4444", bg: "#EF444418" },
  en_curso:     { label: "🟢 En curso",     color: "#16A34A", bg: "#16A34A18" },
  no_en_curso:  { label: "📅 No en curso",  color: "#94A3B8", bg: "#94A3B818" },
};

function CardItem({ card, expenses, selectedMes, selectedAño, onUpdate, onRemove, onPayment, c, installmentPayments }: CardItemProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [showReconcile, setShowReconcile] = useState(false);
  const [reconcileAmount, setReconcileAmount] = useState("");
  const [showCloseCycle, setShowCloseCycle] = useState(false);

  // Always reflects the real-time current cycle (for debt/payments)
  const cycle = useMemo(() => getCreditCycleInfoForCard(expenses, card), [expenses, card]);
  const history = useMemo(() => getCreditHistoryForCard(expenses, card), [expenses, card]);
  const currentBalance = getCurrentCreditBalance(history, card.initialDebt);
  const msi = useMemo(() => getMSIPendingForCard(installmentPayments, card.id), [installmentPayments, card.id]);

  // Cycle status and charges based on the SELECTED month
  const cycleStatus = useMemo(
    () => getBillingCycleStatus(selectedMes, card.cutDay),
    [selectedMes, card.cutDay],
  );
  const billingCharges = useMemo(
    () => getBillingPeriodCharges(expenses, card.id, selectedMes, card.cutDay, selectedAño),
    [expenses, card.id, selectedMes, card.cutDay, selectedAño],
  );
  const billingTotal = billingCharges.reduce((s, e) => s + e.monto, 0);
  const periodLabel = getBillingPeriodLabel(selectedMes, card.cutDay);

  // Debt/pay section is only relevant for the active statement (today's current cycle)
  const isActiveStatement = selectedMes === cycle.currentMonth;
  const statusDisplay = CYCLE_STATUS_CONFIG[cycleStatus];

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
      <View style={styles.cycleRow}>
        {card.cutDay > 0 && (
          <Text style={[styles.cycleText, { color: c.textMuted }]}>Corte: día {card.cutDay}</Text>
        )}
        {card.payDay > 0 && (
          <Text style={[styles.cycleText, { color: c.textMuted }]}>Pago: día {card.payDay}</Text>
        )}
        <View style={[styles.statusPill, { backgroundColor: statusDisplay.bg }]}>
          <Text style={[styles.statusPillText, { color: statusDisplay.color }]}>
            {statusDisplay.label}
          </Text>
        </View>
        {isActiveStatement && !cycle.isPayDayPassed && cycle.payDay > 0 && cycleStatus === "cerrado" && (
          <Text style={[styles.cycleText, { color: c.textMuted }]}>{cycle.daysUntilPayDay} días para pago</Text>
        )}
        {isActiveStatement && cycle.isPayDayPassed && cycleStatus === "cerrado" && (
          <Text style={[styles.cycleText, { color: c.danger }]}>⚠️ Pago vencido</Text>
        )}
      </View>

      {/* Debt summary — only for the active (today's) statement */}
      {isActiveStatement && (
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
          {(card.creditLimit ?? 0) > 0 && (
            <CreditLimitBar limit={card.creditLimit!} used={currentBalance} c={c} />
          )}
        </View>
      )}

      {/* Reconcile */}
      {showReconcile ? (
        <View style={[styles.reconcileForm, { borderTopColor: c.border }]}>
          <Text style={[styles.monthTitle, { color: c.textMuted }]}>Ajustar deuda real</Text>
          <TextInput
            style={[styles.payInput, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
            value={reconcileAmount}
            onChangeText={setReconcileAmount}
            keyboardType="numeric"
            placeholder={`Deuda real (balance actual: $${formatMXN(currentBalance)})`}
            placeholderTextColor={c.textPlaceholder}
            autoFocus
          />
          <View style={styles.payActions}>
            <CustomButton variant="outline" size="sm" onPress={() => { setShowReconcile(false); setReconcileAmount(""); }}>
              Cancelar
            </CustomButton>
            <CustomButton
              variant="primary"
              size="sm"
              onPress={() => {
                const real = parseFloat(reconcileAmount);
                if (isNaN(real)) return;
                onUpdate({ initialDebt: card.initialDebt + (real - currentBalance) });
                setShowReconcile(false);
                setReconcileAmount("");
              }}
            >
              Ajustar
            </CustomButton>
          </View>
        </View>
      ) : (
        <TouchableOpacity onPress={() => { setShowReconcile(true); setReconcileAmount(String(currentBalance)); }}>
          <Text style={[styles.reconcileLink, { color: c.primary }]}>⚖ Ajustar deuda real</Text>
        </TouchableOpacity>
      )}

      {/* MSI summary */}
      {msi.count > 0 && (
        <View style={[styles.msiSection, { borderColor: c.border, backgroundColor: `${c.primary}08` }]}>
          <Text style={[styles.monthTitle, { color: c.textMuted }]}>MSI activos</Text>
          <View style={styles.msiRow}>
            <View style={[styles.msiBadge, { backgroundColor: `${c.primary}18` }]}>
              <Text style={[styles.msiBadgeText, { color: c.primary }]}>{msi.count} plan{msi.count !== 1 ? "es" : ""}</Text>
            </View>
            <Text style={[styles.msiAmount, { color: c.text }]}>${formatMXN(msi.monthlyTotal)}/mes</Text>
            <Text style={[styles.msiPending, { color: c.textMuted }]}>${formatMXN(msi.totalPending)} pendiente</Text>
          </View>
        </View>
      )}

      {/* Pay section — only for active statement */}
      {isActiveStatement && cycle.frozenDebt > 0 && (
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
            <View style={styles.payButtons}>
              <CustomButton
                variant="primary"
                size="sm"
                onPress={() => onPayment(cycle.remainingDebt || cycle.frozenDebt)}
              >
                💳 Pagar total ${formatMXN(cycle.remainingDebt || cycle.frozenDebt)}
              </CustomButton>
              <CustomButton
                variant="outline"
                size="sm"
                onPress={() => { setShowPayForm(true); setPayAmount(""); }}
              >
                Pagar parcial
              </CustomButton>
            </View>
          )}
        </View>
      )}

      {/* Cerrar ciclo — only for active statement */}
      {isActiveStatement && (cycle.remainingDebt > 0 || cycle.newCharges > 0) && (
        <View style={[styles.closeCycleSection, { borderColor: c.border }]}>
          {showCloseCycle ? (
            <View style={styles.closeCycleForm}>
              <Text style={[styles.monthTitle, { color: c.textMuted }]}>Cerrar ciclo</Text>
              <View style={[styles.carryOverBreakdown, { backgroundColor: `${c.danger}08`, borderColor: c.border }]}>
                {cycle.remainingDebt > 0 && <DebtRow label="Deuda restante" value={cycle.remainingDebt} c={c} />}
                {cycle.newCharges > 0 && <DebtRow label="+ Cargos del mes" value={cycle.newCharges} c={c} />}
                <View style={[styles.carryOverTotal, { borderTopColor: c.border }]}>
                  <DebtRow
                    label={`= Deuda en ${nextMonthName()}`}
                    value={cycle.remainingDebt + cycle.newCharges}
                    c={c}
                    bold
                    color={c.danger}
                  />
                </View>
              </View>
              <View style={styles.payActions}>
                <CustomButton variant="outline" size="sm" onPress={() => setShowCloseCycle(false)}>
                  Cancelar
                </CustomButton>
                <CustomButton
                  variant="primary"
                  size="sm"
                  onPress={() => {
                    const carryForward = cycle.remainingDebt + cycle.newCharges;
                    const nextMes = nextMonthName();
                    const nextAño = nextMes === "Enero" ? currentYear() + 1 : currentYear();
                    onUpdate({ initialDebt: carryForward, debtMes: nextMes, debtAño: nextAño });
                    setShowCloseCycle(false);
                  }}
                >
                  Confirmar
                </CustomButton>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setShowCloseCycle(true)}>
              <Text style={[styles.reconcileLink, { color: c.textMuted }]}>
                📅 Cerrar ciclo y arrastrar deuda al siguiente mes
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Billing period charges */}
      <View style={[styles.monthSection, { borderColor: c.border }]}>
        {cycleStatus === "no_en_curso" ? (
          <Text style={[styles.emptyText, { color: c.textPlaceholder }]}>
            Mes fuera del ciclo activo · sin cargos registrados
          </Text>
        ) : (
          <>
            <Text style={[styles.monthTitle, { color: c.textMuted }]}>
              Cargos del ciclo · {periodLabel} ({billingCharges.length})
            </Text>
            {billingCharges.length === 0 ? (
              <Text style={[styles.emptyText, { color: c.textPlaceholder }]}>Sin cargos en este periodo</Text>
            ) : (
              <>
                {billingCharges.map((e) => (
                  <View key={e.id} style={styles.chargeRow}>
                    <Text style={[styles.chargeDesc, { color: c.text }]} numberOfLines={1}>{e.gastos}</Text>
                    <Text style={[styles.chargeAmt, { color: c.text }]}>${formatMXN(e.monto)}</Text>
                  </View>
                ))}
                <View style={[styles.chargeRow, styles.chargeTotalRow]}>
                  <Text style={[styles.chargeDesc, { color: c.textMuted, fontWeight: "600" }]}>Total</Text>
                  <Text style={[styles.chargeAmt, { color: c.primary, fontWeight: "700" }]}>${formatMXN(billingTotal)}</Text>
                </View>
              </>
            )}
          </>
        )}
      </View>

      {/* Config fields — initialDebt is set once at creation; use "Ajustar deuda real" to correct it */}
      <View style={[styles.configSection, { borderColor: c.border }]}>
        <Text style={[styles.monthTitle, { color: c.textMuted }]}>Configuración</Text>
        <View style={styles.configGrid}>
          <ConfigInput label="Límite de crédito ($)" value={String(card.creditLimit || "")} onChangeText={(v) => onUpdate({ creditLimit: parseFloat(v) || 0 })} keyboardType="numeric" c={c} />
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

  limitSection: { gap: 4, paddingTop: SPACING.xs },
  limitRow: { flexDirection: "row", justifyContent: "space-between" },
  limitLabel: { fontSize: 10 },
  limitTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  limitFill: { height: 6, borderRadius: 3 },
  limitPct: { fontSize: 10, fontWeight: "600", textAlign: "right" },

  msiSection: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: SPACING.sm, gap: SPACING.xs, borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm },
  msiRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: SPACING.sm },
  msiBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  msiBadgeText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "700" },
  msiAmount: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },
  msiPending: { fontSize: TYPOGRAPHY.fontSize.xs },

  paySection: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: SPACING.sm },
  payForm: { gap: SPACING.sm },
  payLabel: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },
  payInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, fontSize: TYPOGRAPHY.fontSize.sm },
  payActions: { flexDirection: "row", justifyContent: "flex-end", gap: SPACING.sm },
  payButtons: { flexDirection: "row", gap: SPACING.sm, flexWrap: "wrap" },
  closeCycleSection: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: SPACING.sm },
  closeCycleForm: { gap: SPACING.sm },
  carryOverBreakdown: { borderWidth: StyleSheet.hairlineWidth, borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm, gap: SPACING.xs },
  carryOverTotal: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: SPACING.xs, marginTop: 2 },

  configSection: { gap: SPACING.sm, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: SPACING.sm },
  configGrid: { gap: SPACING.xs },
  configRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  configLabel: { fontSize: TYPOGRAPHY.fontSize.xs, flex: 1 },
  configInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, fontSize: TYPOGRAPHY.fontSize.sm, width: 90, textAlign: "right" },

  reconcileForm: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: SPACING.sm, gap: SPACING.sm },
  reconcileLink: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600", paddingVertical: SPACING.xs },

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
