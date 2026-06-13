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
import type { Loan } from "../types";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

type AddLoanForm = {
  title: string;
  person: string;
  direction: "borrowed" | "lent";
  originalAmount: string;
  startDate: string;
  dueDate: string;
  notes: string;
};

function blankForm(): AddLoanForm {
  return {
    title: "",
    person: "",
    direction: "borrowed",
    originalAmount: "",
    startDate: todayStr(),
    dueDate: "",
    notes: "",
  };
}

export function LoansTab() {
  const c = useColors();
  const { loans, addLoan } = useExpensesStore();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddLoanForm>(blankForm());

  function patch(p: Partial<AddLoanForm>) {
    setForm((f) => ({ ...f, ...p }));
  }

  function handleAdd() {
    if (!form.title.trim() || !form.person.trim()) return;
    const amount = parseFloat(form.originalAmount) || 0;
    if (amount <= 0) return;
    addLoan({
      title: form.title.trim(),
      person: form.person.trim(),
      direction: form.direction,
      originalAmount: amount,
      startDate: form.startDate,
      dueDate: form.dueDate,
      notes: form.notes.trim(),
    });
    setForm(blankForm());
    setShowForm(false);
  }

  const borrowed = loans.filter((l) => l.direction === "borrowed");
  const lent = loans.filter((l) => l.direction === "lent");

  const totalBorrowed = borrowed
    .filter((l) => l.status === "active")
    .reduce((s, l) => s + remaining(l), 0);
  const totalLent = lent
    .filter((l) => l.status === "active")
    .reduce((s, l) => s + remaining(l), 0);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: "#EF444412", borderColor: "#EF444430" }]}>
          <Text style={[styles.summaryLabel, { color: "#EF4444" }]}>Debo</Text>
          <Text style={[styles.summaryAmt, { color: "#EF4444" }]}>${formatMXN(totalBorrowed)}</Text>
          <Text style={[styles.summaryCount, { color: "#EF4444" }]}>{borrowed.filter(l => l.status === "active").length} activo{borrowed.filter(l => l.status === "active").length !== 1 ? "s" : ""}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: "#16A34A12", borderColor: "#16A34A30" }]}>
          <Text style={[styles.summaryLabel, { color: "#16A34A" }]}>Me deben</Text>
          <Text style={[styles.summaryAmt, { color: "#16A34A" }]}>${formatMXN(totalLent)}</Text>
          <Text style={[styles.summaryCount, { color: "#16A34A" }]}>{lent.filter(l => l.status === "active").length} activo{lent.filter(l => l.status === "active").length !== 1 ? "s" : ""}</Text>
        </View>
      </View>

      {/* Add button */}
      <CustomButton variant="outline" size="sm" onPress={() => { setShowForm(true); setForm(blankForm()); }}>
        + Nuevo préstamo
      </CustomButton>

      {/* Add form */}
      {showForm && (
        <View style={[styles.formCard, { backgroundColor: c.backgroundStrong, borderColor: c.primary }]}>
          <Text style={[styles.formTitle, { color: c.text }]}>Nuevo préstamo</Text>

          {/* Direction toggle */}
          <View style={styles.directionRow}>
            <TouchableOpacity
              style={[styles.dirBtn, { borderColor: form.direction === "borrowed" ? "#EF4444" : c.border, backgroundColor: form.direction === "borrowed" ? "#EF444418" : c.background }]}
              onPress={() => patch({ direction: "borrowed" })}
            >
              <Text style={[styles.dirBtnText, { color: form.direction === "borrowed" ? "#EF4444" : c.textMuted }]}>📤 Yo debo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dirBtn, { borderColor: form.direction === "lent" ? "#16A34A" : c.border, backgroundColor: form.direction === "lent" ? "#16A34A18" : c.background }]}
              onPress={() => patch({ direction: "lent" })}
            >
              <Text style={[styles.dirBtnText, { color: form.direction === "lent" ? "#16A34A" : c.textMuted }]}>📥 Me deben</Text>
            </TouchableOpacity>
          </View>

          <FormField label="Descripción" value={form.title} onChangeText={(v) => patch({ title: v })} placeholder="Ej. Préstamo para renta" c={c} />
          <FormField label={form.direction === "borrowed" ? "Prestamista (quién me prestó)" : "Deudor (quién me debe)"} value={form.person} onChangeText={(v) => patch({ person: v })} placeholder="Nombre" c={c} />
          <FormField label="Monto ($)" value={form.originalAmount} onChangeText={(v) => patch({ originalAmount: v })} keyboardType="numeric" placeholder="0.00" c={c} />
          <FormField label="Fecha inicio" value={form.startDate} onChangeText={(v) => patch({ startDate: v })} placeholder="YYYY-MM-DD" c={c} />
          <FormField label="Fecha límite (opcional)" value={form.dueDate} onChangeText={(v) => patch({ dueDate: v })} placeholder="YYYY-MM-DD" c={c} />
          <FormField label="Notas (opcional)" value={form.notes} onChangeText={(v) => patch({ notes: v })} placeholder="" c={c} />

          <View style={styles.formActions}>
            <CustomButton variant="outline" size="sm" onPress={() => setShowForm(false)}>Cancelar</CustomButton>
            <CustomButton variant="primary" size="sm" onPress={handleAdd}>Agregar</CustomButton>
          </View>
        </View>
      )}

      {/* Borrowed section */}
      {borrowed.length > 0 && (
        <Section title="📤 Yo debo" color="#EF4444" loans={borrowed} c={c} />
      )}

      {/* Lent section */}
      {lent.length > 0 && (
        <Section title="📥 Me deben" color="#16A34A" loans={lent} c={c} />
      )}

      {loans.length === 0 && !showForm && (
        <View style={[styles.emptyState, { borderColor: c.border }]}>
          <Text style={[styles.emptyText, { color: c.textMuted }]}>
            Sin préstamos registrados.{"\n"}Agrega uno para hacer seguimiento.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function remaining(loan: Loan): number {
  const paid = loan.payments.reduce((s, p) => s + p.amount, 0);
  return Math.max(0, loan.originalAmount - paid);
}

function Section({ title, color, loans, c }: {
  title: string;
  color: string;
  loans: Loan[];
  c: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      {loans.map((loan) => (
        <LoanCard key={loan.id} loan={loan} color={color} c={c} />
      ))}
    </View>
  );
}

function LoanCard({ loan, color, c }: { loan: Loan; color: string; c: ReturnType<typeof useColors> }) {
  const { updateLoan, removeLoan, addLoanPayment, removeLoanPayment } = useExpensesStore();
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const paid = loan.payments.reduce((s, p) => s + p.amount, 0);
  const rem = Math.max(0, loan.originalAmount - paid);
  const pct = Math.min(100, loan.originalAmount > 0 ? (paid / loan.originalAmount) * 100 : 0);

  function handlePay() {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return;
    addLoanPayment(loan.id, { amount, date: todayStr(), notes: payNotes.trim() });
    setPayAmount("");
    setPayNotes("");
    setShowPayForm(false);
  }

  return (
    <View style={[styles.loanCard, { backgroundColor: c.backgroundStrong, borderColor: loan.status === "paid" ? `${color}40` : c.border }]}>
      {/* Header */}
      <View style={styles.loanHeader}>
        <View style={styles.loanMeta}>
          <Text style={[styles.loanTitle, { color: c.text }]}>{loan.title}</Text>
          <Text style={[styles.loanPerson, { color: c.textMuted }]}>{loan.person}</Text>
        </View>
        <View style={styles.loanHeaderRight}>
          {loan.status === "paid" ? (
            <View style={[styles.paidBadge, { backgroundColor: `${color}18` }]}>
              <Text style={[styles.paidBadgeText, { color }]}>✓ Liquidado</Text>
            </View>
          ) : (
            <Text style={[styles.loanRem, { color }]}>${formatMXN(rem)}</Text>
          )}
          {confirmRemove ? (
            <View style={styles.confirmRow}>
              <TouchableOpacity onPress={() => removeLoan(loan.id)}>
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

      {/* Progress bar */}
      {loan.status !== "paid" && (
        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressLabel, { color: c.textMuted }]}>${formatMXN(paid)} pagado</Text>
            <Text style={[styles.progressLabel, { color: c.textMuted }]}>${formatMXN(loan.originalAmount)} total</Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: `${color}20` }]}>
            <View style={[styles.progressFill, { width: `${pct}%` as `${number}%`, backgroundColor: color }]} />
          </View>
          <Text style={[styles.progressPct, { color }]}>{pct.toFixed(0)}% pagado</Text>
        </View>
      )}

      {/* Dates */}
      {(loan.startDate || loan.dueDate) && (
        <View style={styles.datesRow}>
          {loan.startDate && <Text style={[styles.dateText, { color: c.textMuted }]}>Inicio: {loan.startDate}</Text>}
          {loan.dueDate && <Text style={[styles.dateText, { color: loan.dueDate < todayStr() && loan.status === "active" ? c.danger : c.textMuted }]}>Vence: {loan.dueDate}</Text>}
        </View>
      )}

      {/* Notes */}
      {loan.notes.length > 0 && (
        <Text style={[styles.notesText, { color: c.textMuted }]}>{loan.notes}</Text>
      )}

      {/* Pay button */}
      {loan.status === "active" && (
        <View style={[styles.paySection, { borderColor: c.border }]}>
          {showPayForm ? (
            <View style={styles.payForm}>
              <View style={styles.payRow}>
                <TextInput
                  style={[styles.payInput, { color: c.text, borderColor: c.border, backgroundColor: c.background, flex: 1 }]}
                  value={payAmount}
                  onChangeText={setPayAmount}
                  keyboardType="numeric"
                  placeholder={String(rem)}
                  placeholderTextColor={c.textPlaceholder}
                  autoFocus
                />
                <TextInput
                  style={[styles.payInput, { color: c.text, borderColor: c.border, backgroundColor: c.background, flex: 2 }]}
                  value={payNotes}
                  onChangeText={setPayNotes}
                  placeholder="Nota (opcional)"
                  placeholderTextColor={c.textPlaceholder}
                />
              </View>
              <View style={styles.payActions}>
                <CustomButton variant="outline" size="sm" onPress={() => { setShowPayForm(false); setPayAmount(""); setPayNotes(""); }}>
                  Cancelar
                </CustomButton>
                <CustomButton variant="primary" size="sm" onPress={handlePay}>
                  Registrar abono
                </CustomButton>
              </View>
            </View>
          ) : (
            <CustomButton variant="outline" size="sm" onPress={() => { setShowPayForm(true); setPayAmount(String(rem)); }}>
              + Registrar abono
            </CustomButton>
          )}
        </View>
      )}

      {/* Payment history toggle */}
      {loan.payments.length > 0 && (
        <>
          <TouchableOpacity onPress={() => setShowHistory((v) => !v)} style={styles.historyToggle}>
            <Text style={[styles.historyToggleText, { color: c.primary }]}>
              {showHistory ? "▲ Ocultar abonos" : `▼ ${loan.payments.length} abono${loan.payments.length !== 1 ? "s" : ""}`}
            </Text>
          </TouchableOpacity>

          {showHistory && (
            <View style={styles.historyList}>
              {loan.payments.map((p) => (
                <View key={p.id} style={[styles.historyEntry, { borderBottomColor: c.border }]}>
                  <View style={styles.historyMeta}>
                    <Text style={[styles.historyDate, { color: c.textMuted }]}>{p.date}</Text>
                    {p.notes.length > 0 && <Text style={[styles.historyNotes, { color: c.textMuted }]}>{p.notes}</Text>}
                  </View>
                  <Text style={[styles.historyAmt, { color }]}>${formatMXN(p.amount)}</Text>
                  <TouchableOpacity onPress={() => removeLoanPayment(loan.id, p.id)} style={styles.removePayBtn}>
                    <Text style={[styles.removePayBtnText, { color: c.textMuted }]}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </>
      )}
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

  summaryRow: { flexDirection: "row", gap: SPACING.sm },
  summaryCard: { flex: 1, borderRadius: BORDER_RADIUS.md, borderWidth: 1, padding: SPACING.md, alignItems: "center", gap: 2 },
  summaryLabel: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  summaryAmt: { fontSize: 22, fontWeight: "800" },
  summaryCount: { fontSize: TYPOGRAPHY.fontSize.xs },

  formCard: { borderRadius: BORDER_RADIUS.md, borderWidth: 1, padding: SPACING.md, gap: SPACING.sm },
  formTitle: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "700" },
  directionRow: { flexDirection: "row", gap: SPACING.sm },
  dirBtn: { flex: 1, borderWidth: 1, borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm, alignItems: "center" },
  dirBtnText: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" },
  formActions: { flexDirection: "row", justifyContent: "flex-end", gap: SPACING.sm, paddingTop: SPACING.xs },

  fieldRow: { gap: 4 },
  fieldLabel: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "500" },
  fieldInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, fontSize: TYPOGRAPHY.fontSize.sm },

  section: { gap: SPACING.sm },
  sectionTitle: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },

  loanCard: { borderRadius: BORDER_RADIUS.md, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.md, gap: SPACING.sm },
  loanHeader: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.sm },
  loanMeta: { flex: 1 },
  loanTitle: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: "700" },
  loanPerson: { fontSize: TYPOGRAPHY.fontSize.xs },
  loanHeaderRight: { alignItems: "flex-end", gap: SPACING.xs },
  loanRem: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: "800" },
  paidBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  paidBadgeText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "700" },
  confirmRow: { flexDirection: "row", gap: SPACING.xs },
  confirmBtn: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "700", paddingHorizontal: SPACING.xs },
  removeBtn: { fontSize: 16 },

  progressSection: { gap: 4 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontSize: 10 },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  progressPct: { fontSize: 10, fontWeight: "700", textAlign: "right" },

  datesRow: { flexDirection: "row", gap: SPACING.md },
  dateText: { fontSize: TYPOGRAPHY.fontSize.xs },
  notesText: { fontSize: TYPOGRAPHY.fontSize.xs, fontStyle: "italic" },

  paySection: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: SPACING.sm },
  payForm: { gap: SPACING.sm },
  payRow: { flexDirection: "row", gap: SPACING.sm },
  payInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, fontSize: TYPOGRAPHY.fontSize.sm },
  payActions: { flexDirection: "row", justifyContent: "flex-end", gap: SPACING.sm },

  historyToggle: { paddingVertical: SPACING.xs },
  historyToggleText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },
  historyList: { gap: SPACING.xs },
  historyEntry: { flexDirection: "row", alignItems: "center", paddingVertical: SPACING.xs, borderBottomWidth: StyleSheet.hairlineWidth, gap: SPACING.sm },
  historyMeta: { flex: 1 },
  historyDate: { fontSize: TYPOGRAPHY.fontSize.xs },
  historyNotes: { fontSize: 10 },
  historyAmt: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "700" },
  removePayBtn: { padding: SPACING.xs },
  removePayBtnText: { fontSize: 12 },

  emptyState: { borderWidth: 1, borderStyle: "dashed", borderRadius: BORDER_RADIUS.md, padding: SPACING.xl, alignItems: "center" },
  emptyText: { fontSize: TYPOGRAPHY.fontSize.sm, textAlign: "center", lineHeight: 20 },
});
