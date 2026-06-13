import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { useExpensesStore } from "../store";
import { formatMXN } from "../helpers";
import type { SavingsGoal } from "../types";

const GOAL_COLORS = ["#6366F1", "#EC4899", "#F59E0B", "#16A34A", "#3B82F6", "#14B8A6", "#EF4444", "#8B5CF6"];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

type GoalForm = {
  title: string;
  targetAmount: string;
  deadline: string;
  notes: string;
  color: string;
};

function blankForm(): GoalForm {
  return { title: "", targetAmount: "", deadline: "", notes: "", color: GOAL_COLORS[0]! };
}

export function SavingsTab() {
  const c = useColors();
  const { savingsGoals, addSavingsGoal } = useExpensesStore();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<GoalForm>(blankForm());

  function patch(p: Partial<GoalForm>) {
    setForm((f) => ({ ...f, ...p }));
  }

  function handleAdd() {
    if (!form.title.trim()) return;
    const target = parseFloat(form.targetAmount) || 0;
    if (target <= 0) return;
    addSavingsGoal({
      title: form.title.trim(),
      targetAmount: target,
      deadline: form.deadline,
      notes: form.notes.trim(),
      color: form.color,
    });
    setForm(blankForm());
    setShowForm(false);
  }

  const active = savingsGoals.filter((g) => g.status === "active");
  const completed = savingsGoals.filter((g) => g.status === "completed");

  const totalSaved = savingsGoals.reduce(
    (s, g) => s + g.deposits.reduce((ds, d) => ds + d.amount, 0),
    0
  );
  const totalTarget = savingsGoals
    .filter((g) => g.status !== "cancelled")
    .reduce((s, g) => s + g.targetAmount, 0);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Summary */}
      <View style={[styles.summaryCard, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
        <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Total ahorrado</Text>
        <Text style={[styles.summaryAmt, { color: c.text }]}>${formatMXN(totalSaved)}</Text>
        {totalTarget > 0 && (
          <>
            <View style={[styles.summaryTrack, { backgroundColor: `${c.primary}20` }]}>
              <View
                style={[
                  styles.summaryFill,
                  {
                    width: `${Math.min(100, (totalSaved / totalTarget) * 100)}%` as `${number}%`,
                    backgroundColor: c.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.summaryMeta, { color: c.textMuted }]}>
              ${formatMXN(totalSaved)} de ${formatMXN(totalTarget)} en {savingsGoals.filter(g => g.status !== "cancelled").length} meta{savingsGoals.filter(g => g.status !== "cancelled").length !== 1 ? "s" : ""}
            </Text>
          </>
        )}
      </View>

      {/* Add button */}
      <CustomButton variant="outline" size="sm" onPress={() => { setShowForm(true); setForm(blankForm()); }}>
        + Nueva meta
      </CustomButton>

      {/* Add form */}
      {showForm && (
        <View style={[styles.formCard, { backgroundColor: c.backgroundStrong, borderColor: c.primary }]}>
          <Text style={[styles.formTitle, { color: c.text }]}>Nueva meta de ahorro</Text>

          <FormField label="Nombre de la meta" value={form.title} onChangeText={(v) => patch({ title: v })} placeholder="Ej. Viaje a Europa, Fondo de emergencia" c={c} />
          <FormField label="Monto objetivo ($)" value={form.targetAmount} onChangeText={(v) => patch({ targetAmount: v })} keyboardType="numeric" placeholder="0.00" c={c} />
          <FormField label="Fecha límite (opcional)" value={form.deadline} onChangeText={(v) => patch({ deadline: v })} placeholder="YYYY-MM-DD" c={c} />
          <FormField label="Notas (opcional)" value={form.notes} onChangeText={(v) => patch({ notes: v })} placeholder="" c={c} />

          {/* Color picker */}
          <View style={styles.colorSection}>
            <Text style={[styles.colorLabel, { color: c.textMuted }]}>Color</Text>
            <View style={styles.colorRow}>
              {GOAL_COLORS.map((clr) => (
                <TouchableOpacity
                  key={clr}
                  onPress={() => patch({ color: clr })}
                  style={[
                    styles.colorDot,
                    { backgroundColor: clr },
                    form.color === clr && styles.colorDotSelected,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.formActions}>
            <CustomButton variant="outline" size="sm" onPress={() => setShowForm(false)}>Cancelar</CustomButton>
            <CustomButton variant="primary" size="sm" onPress={handleAdd}>Agregar meta</CustomButton>
          </View>
        </View>
      )}

      {/* Active goals */}
      {active.length > 0 && (
        <View style={styles.section}>
          {active.map((g) => <GoalCard key={g.id} goal={g} c={c} />)}
        </View>
      )}

      {/* Completed goals */}
      {completed.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Completadas</Text>
          {completed.map((g) => <GoalCard key={g.id} goal={g} c={c} />)}
        </View>
      )}

      {savingsGoals.length === 0 && !showForm && (
        <View style={[styles.emptyState, { borderColor: c.border }]}>
          <Text style={[styles.emptyText, { color: c.textMuted }]}>
            Sin metas de ahorro.{"\n"}Crea una para hacer seguimiento de tu progreso.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function GoalCard({ goal, c }: { goal: SavingsGoal; c: ReturnType<typeof useColors> }) {
  const { removeSavingsGoal, addSavingsDeposit, removeSavingsDeposit } = useExpensesStore();

  const [showDepositForm, setShowDepositForm] = useState(false);
  const [depAmount, setDepAmount] = useState("");
  const [depNotes, setDepNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const saved = goal.deposits.reduce((s, d) => s + d.amount, 0);
  const remaining = Math.max(0, goal.targetAmount - saved);
  const pct = Math.min(100, goal.targetAmount > 0 ? (saved / goal.targetAmount) * 100 : 0);
  const isOverdue = goal.deadline && goal.deadline < todayStr() && goal.status === "active";

  function handleDeposit() {
    const amount = parseFloat(depAmount);
    if (!amount || amount <= 0) return;
    addSavingsDeposit(goal.id, { amount, date: todayStr(), notes: depNotes.trim() });
    setDepAmount("");
    setDepNotes("");
    setShowDepositForm(false);
  }

  // Days left until deadline
  let daysLeft: number | null = null;
  if (goal.deadline && goal.status === "active") {
    const diff = new Date(goal.deadline).getTime() - new Date(todayStr()).getTime();
    daysLeft = Math.ceil(diff / (24 * 60 * 60 * 1000));
  }

  return (
    <View
      style={[
        styles.goalCard,
        { backgroundColor: c.backgroundStrong, borderColor: c.border },
        goal.status === "completed" && { borderColor: `${goal.color}40` },
      ]}
    >
      {/* Color stripe */}
      <View style={[styles.colorStripe, { backgroundColor: goal.color }]} />

      <View style={styles.goalBody}>
        {/* Header */}
        <View style={styles.goalHeader}>
          <View style={styles.goalMeta}>
            <Text style={[styles.goalTitle, { color: c.text }]}>{goal.title}</Text>
            {goal.notes.length > 0 && (
              <Text style={[styles.goalNotes, { color: c.textMuted }]}>{goal.notes}</Text>
            )}
          </View>
          <View style={styles.goalHeaderRight}>
            {goal.status === "completed" ? (
              <View style={[styles.completedBadge, { backgroundColor: `${goal.color}18` }]}>
                <Text style={[styles.completedText, { color: goal.color }]}>✓ Completada</Text>
              </View>
            ) : (
              <Text style={[styles.goalRemaining, { color: goal.color }]}>${formatMXN(remaining)}</Text>
            )}
            {confirmRemove ? (
              <View style={styles.confirmRow}>
                <TouchableOpacity onPress={() => removeSavingsGoal(goal.id)}>
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
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressLabel, { color: c.textMuted }]}>${formatMXN(saved)} ahorrado</Text>
            <Text style={[styles.progressLabel, { color: c.textMuted }]}>${formatMXN(goal.targetAmount)} meta</Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: `${goal.color}20` }]}>
            <View
              style={[styles.progressFill, { width: `${pct}%` as `${number}%`, backgroundColor: goal.color }]}
            />
          </View>
          <View style={styles.progressBottom}>
            <Text style={[styles.progressPct, { color: goal.color }]}>{pct.toFixed(0)}%</Text>
            {daysLeft !== null && (
              <Text style={[styles.deadlineText, { color: isOverdue ? c.danger : c.textMuted }]}>
                {isOverdue
                  ? `⚠️ Venció hace ${Math.abs(daysLeft)} días`
                  : daysLeft === 0
                    ? "Vence hoy"
                    : `${daysLeft} días restantes`}
              </Text>
            )}
          </View>
        </View>

        {/* Deposit button */}
        {goal.status === "active" && (
          <View style={[styles.depositSection, { borderColor: c.border }]}>
            {showDepositForm ? (
              <View style={styles.depositForm}>
                <View style={styles.depositRow}>
                  <TextInput
                    style={[styles.depositInput, { color: c.text, borderColor: c.border, backgroundColor: c.background, flex: 1 }]}
                    value={depAmount}
                    onChangeText={setDepAmount}
                    keyboardType="numeric"
                    placeholder="Monto"
                    placeholderTextColor={c.textPlaceholder}
                    autoFocus
                  />
                  <TextInput
                    style={[styles.depositInput, { color: c.text, borderColor: c.border, backgroundColor: c.background, flex: 2 }]}
                    value={depNotes}
                    onChangeText={setDepNotes}
                    placeholder="Nota (opcional)"
                    placeholderTextColor={c.textPlaceholder}
                  />
                </View>
                <View style={styles.depositActions}>
                  <CustomButton variant="outline" size="sm" onPress={() => { setShowDepositForm(false); setDepAmount(""); setDepNotes(""); }}>
                    Cancelar
                  </CustomButton>
                  <CustomButton variant="primary" size="sm" onPress={handleDeposit}>
                    Abonar
                  </CustomButton>
                </View>
              </View>
            ) : (
              <CustomButton variant="outline" size="sm" onPress={() => setShowDepositForm(true)}>
                + Registrar abono
              </CustomButton>
            )}
          </View>
        )}

        {/* History */}
        {goal.deposits.length > 0 && (
          <>
            <TouchableOpacity onPress={() => setShowHistory((v) => !v)} style={styles.historyToggle}>
              <Text style={[styles.historyToggleText, { color: c.primary }]}>
                {showHistory ? "▲ Ocultar abonos" : `▼ ${goal.deposits.length} abono${goal.deposits.length !== 1 ? "s" : ""}`}
              </Text>
            </TouchableOpacity>
            {showHistory && (
              <View style={styles.historyList}>
                {[...goal.deposits].reverse().map((d) => (
                  <View key={d.id} style={[styles.historyEntry, { borderBottomColor: c.border }]}>
                    <View style={styles.historyMeta}>
                      <Text style={[styles.historyDate, { color: c.textMuted }]}>{d.date}</Text>
                      {d.notes.length > 0 && <Text style={[styles.historyNotes, { color: c.textMuted }]}>{d.notes}</Text>}
                    </View>
                    <Text style={[styles.historyAmt, { color: goal.color }]}>${formatMXN(d.amount)}</Text>
                    <TouchableOpacity onPress={() => removeSavingsDeposit(goal.id, d.id)} style={styles.removeDepBtn}>
                      <Text style={[styles.removeDepBtnText, { color: c.textMuted }]}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

function FormField({ label, value, onChangeText, placeholder, keyboardType, c }: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: "numeric"; c: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.fieldRow}>
      <Text style={[styles.fieldLabel, { color: c.textMuted }]}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
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

  summaryCard: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.md,
    alignItems: "center",
    gap: SPACING.xs,
  },
  summaryLabel: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  summaryAmt: { fontSize: 28, fontWeight: "800" },
  summaryTrack: { width: "100%", height: 6, borderRadius: 3, overflow: "hidden" },
  summaryFill: { height: 6, borderRadius: 3 },
  summaryMeta: { fontSize: TYPOGRAPHY.fontSize.xs },

  formCard: { borderRadius: BORDER_RADIUS.md, borderWidth: 1, padding: SPACING.md, gap: SPACING.sm },
  formTitle: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "700" },
  formActions: { flexDirection: "row", justifyContent: "flex-end", gap: SPACING.sm, paddingTop: SPACING.xs },
  fieldRow: { gap: 4 },
  fieldLabel: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "500" },
  fieldInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, fontSize: TYPOGRAPHY.fontSize.sm },
  colorSection: { gap: SPACING.xs },
  colorLabel: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "500" },
  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotSelected: { borderWidth: 3, borderColor: "#fff", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 0 } },

  section: { gap: SPACING.sm },
  sectionTitle: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },

  goalCard: { borderRadius: BORDER_RADIUS.md, borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", overflow: "hidden" },
  colorStripe: { width: 5 },
  goalBody: { flex: 1, padding: SPACING.md, gap: SPACING.sm },
  goalHeader: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.sm },
  goalMeta: { flex: 1 },
  goalTitle: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: "700" },
  goalNotes: { fontSize: TYPOGRAPHY.fontSize.xs, fontStyle: "italic", marginTop: 2 },
  goalHeaderRight: { alignItems: "flex-end", gap: SPACING.xs },
  goalRemaining: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: "800" },
  completedBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  completedText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "700" },
  confirmRow: { flexDirection: "row", gap: SPACING.xs },
  confirmBtn: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "700", paddingHorizontal: SPACING.xs },
  removeBtn: { fontSize: 16 },

  progressSection: { gap: 4 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontSize: 10 },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4 },
  progressBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressPct: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "700" },
  deadlineText: { fontSize: 10 },

  depositSection: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: SPACING.sm },
  depositForm: { gap: SPACING.sm },
  depositRow: { flexDirection: "row", gap: SPACING.sm },
  depositInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, fontSize: TYPOGRAPHY.fontSize.sm },
  depositActions: { flexDirection: "row", justifyContent: "flex-end", gap: SPACING.sm },

  historyToggle: { paddingVertical: SPACING.xs },
  historyToggleText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },
  historyList: { gap: SPACING.xs },
  historyEntry: { flexDirection: "row", alignItems: "center", paddingVertical: SPACING.xs, borderBottomWidth: StyleSheet.hairlineWidth, gap: SPACING.sm },
  historyMeta: { flex: 1 },
  historyDate: { fontSize: TYPOGRAPHY.fontSize.xs },
  historyNotes: { fontSize: 10 },
  historyAmt: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "700" },
  removeDepBtn: { padding: SPACING.xs },
  removeDepBtnText: { fontSize: 12 },

  emptyState: { borderWidth: 1, borderStyle: "dashed", borderRadius: BORDER_RADIUS.md, padding: SPACING.xl, alignItems: "center" },
  emptyText: { fontSize: TYPOGRAPHY.fontSize.sm, textAlign: "center", lineHeight: 20 },
});
