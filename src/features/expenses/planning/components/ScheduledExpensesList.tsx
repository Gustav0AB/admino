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
import { CustomModal } from "@/shared/components/feedback/CustomModal";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { usePlanningStore } from "../store";
import type { ScheduledExpense, ScheduledExpenseCategory, ScheduledExpenseStatus } from "../types";

const CATEGORY_LABELS: Record<ScheduledExpenseCategory, string> = {
  mechanic: "Mecánico",
  insurance: "Seguro",
  medical: "Médico",
  utilities: "Servicios",
  subscription: "Suscripción",
  other: "Otro",
};

const CATEGORY_ICONS: Record<ScheduledExpenseCategory, string> = {
  mechanic: "🔧",
  insurance: "🛡",
  medical: "🏥",
  utilities: "💡",
  subscription: "📅",
  other: "📌",
};

const STATUS_LABELS: Record<ScheduledExpenseStatus, string> = {
  pending: "Pendiente",
  done: "Completado",
  cancelled: "Cancelado",
};

const CATEGORIES: ScheduledExpenseCategory[] = [
  "mechanic", "insurance", "medical", "utilities", "subscription", "other",
];

type FormState = {
  title: string;
  scheduledDate: string;
  category: ScheduledExpenseCategory;
  amountKnown: boolean;
  amount: string;
  notes: string;
  status: ScheduledExpenseStatus;
  paymentMethod: "efectivo" | "credito";
};

const blankForm = (): FormState => ({
  title: "",
  scheduledDate: "",
  category: "other",
  amountKnown: false,
  amount: "",
  notes: "",
  status: "pending",
  paymentMethod: "efectivo",
});

export function ScheduledExpensesList() {
  const c = useColors();
  const { scheduledExpenses, addScheduledExpense, updateScheduledExpense, removeScheduledExpense } =
    usePlanningStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(blankForm());

  const sorted = [...scheduledExpenses].sort(
    (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
  );

  const totalKnown = scheduledExpenses
    .filter((e) => e.amountKnown && e.status !== "cancelled")
    .reduce((sum, e) => sum + e.amount, 0);

  const unknownCount = scheduledExpenses.filter(
    (e) => !e.amountKnown && e.status !== "cancelled"
  ).length;

  const openAdd = () => {
    setEditingId(null);
    setForm(blankForm());
    setModalOpen(true);
  };

  const openEdit = (expense: ScheduledExpense) => {
    setEditingId(expense.id);
    setForm({
      title: expense.title,
      scheduledDate: expense.scheduledDate,
      category: expense.category,
      amountKnown: expense.amountKnown,
      amount: expense.amount > 0 ? String(expense.amount) : "",
      notes: expense.notes,
      status: expense.status,
      paymentMethod: expense.paymentMethod ?? "efectivo",
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.scheduledDate.trim()) return;
    const payload = {
      title: form.title.trim(),
      scheduledDate: form.scheduledDate.trim(),
      category: form.category,
      amountKnown: form.amountKnown,
      amount: form.amountKnown ? parseFloat(form.amount) || 0 : 0,
      notes: form.notes.trim(),
      status: form.status,
      paymentMethod: form.paymentMethod,
    };
    if (editingId) {
      updateScheduledExpense(editingId, payload);
    } else {
      addScheduledExpense(payload);
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (editingId) {
      removeScheduledExpense(editingId);
      setModalOpen(false);
    }
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const renderStatusDot = (status: ScheduledExpenseStatus) => {
    const color = status === "done" ? "#22c55e" : status === "cancelled" ? c.textMuted : "#f59e0b";
    return <View style={[styles.statusDot, { backgroundColor: color }]} />;
  };

  return (
    <View style={styles.root}>
      {/* Summary bar */}
      <View style={[styles.summaryBar, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: c.text }]}>
            ${totalKnown.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </Text>
          <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Total conocido</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: c.text }]}>{unknownCount}</Text>
          <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Monto por definir</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: c.text }]}>{scheduledExpenses.length}</Text>
          <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Total programados</Text>
        </View>
      </View>

      {/* Add button */}
      <View style={styles.addRow}>
        <CustomButton variant="primary" size="sm" onPress={openAdd}>
          + Agregar gasto
        </CustomButton>
      </View>

      {/* List */}
      {sorted.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyIcon]}>📋</Text>
          <Text style={[styles.emptyText, { color: c.textMuted }]}>
            No hay gastos programados aún
          </Text>
          <Text style={[styles.emptyHint, { color: c.textPlaceholder }]}>
            Agrega citas al mecánico, pagos de seguro y más
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.list}>
            {sorted.map((expense) => (
              <TouchableOpacity
                key={expense.id}
                style={[
                  styles.card,
                  { backgroundColor: c.backgroundStrong, borderColor: c.border },
                  expense.status === "done" && styles.cardDone,
                  expense.status === "cancelled" && { opacity: 0.5 },
                ]}
                onPress={() => openEdit(expense)}
                activeOpacity={0.75}
              >
                <View style={styles.cardLeft}>
                  <Text style={styles.cardIcon}>{CATEGORY_ICONS[expense.category]}</Text>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardTitleRow}>
                    <Text
                      style={[
                        styles.cardTitle,
                        { color: c.text },
                        expense.status === "done" && styles.textStrike,
                      ]}
                      numberOfLines={1}
                    >
                      {expense.title}
                    </Text>
                    {renderStatusDot(expense.status)}
                  </View>
                  <Text style={[styles.cardSub, { color: c.textMuted }]}>
                    {CATEGORY_LABELS[expense.category]} · {expense.scheduledDate}
                  </Text>
                  {expense.notes ? (
                    <Text style={[styles.cardNotes, { color: c.textPlaceholder }]} numberOfLines={1}>
                      {expense.notes}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.cardRight}>
                  {expense.amountKnown ? (
                    <Text style={[styles.cardAmount, { color: c.text }]}>
                      ${expense.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </Text>
                  ) : (
                    <Text style={[styles.cardAmountUnknown, { color: c.textPlaceholder }]}>
                      Por definir
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Add / Edit modal */}
      <CustomModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingId ? "Editar gasto" : "Agregar gasto programado"}
        size="md"
        footer={
          <>
            <View style={{ flex: 1 }}>
              {editingId && (
                <CustomButton variant="outline" size="sm" onPress={handleDelete}>
                  Eliminar
                </CustomButton>
              )}
            </View>
            <View style={styles.modalFooterRight}>
              <CustomButton variant="outline" size="sm" onPress={() => setModalOpen(false)}>
                Cancelar
              </CustomButton>
              <CustomButton variant="primary" size="sm" onPress={handleSave}>
                {editingId ? "Guardar" : "Agregar"}
              </CustomButton>
            </View>
          </>
        }
      >
        <FormField label="Título *">
          <StyledInput
            value={form.title}
            onChangeText={(v) => setField("title", v)}
            placeholder="Ej: Cita al mecánico"
          />
        </FormField>

        <FormField label="Fecha programada *">
          <StyledInput
            value={form.scheduledDate}
            onChangeText={(v) => setField("scheduledDate", v)}
            placeholder="YYYY-MM-DD"
          />
        </FormField>

        <FormField label="Categoría">
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <CategoryChip
                key={cat}
                label={CATEGORY_LABELS[cat]}
                icon={CATEGORY_ICONS[cat]}
                active={form.category === cat}
                onPress={() => setField("category", cat)}
              />
            ))}
          </View>
        </FormField>

        <FormField label="¿Sabes cuánto costará?">
          <View style={styles.toggleRow}>
            <ToggleChip
              label="Monto conocido"
              active={form.amountKnown}
              onPress={() => setField("amountKnown", true)}
            />
            <ToggleChip
              label="Por definir"
              active={!form.amountKnown}
              onPress={() => setField("amountKnown", false)}
            />
          </View>
        </FormField>

        {form.amountKnown && (
          <FormField label="Monto ($)">
            <StyledInput
              value={form.amount}
              onChangeText={(v) => setField("amount", v)}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </FormField>
        )}

        <FormField label="Método de pago">
          <View style={styles.toggleRow}>
            <ToggleChip
              label="Efectivo"
              active={form.paymentMethod === "efectivo"}
              onPress={() => setField("paymentMethod", "efectivo")}
            />
            <ToggleChip
              label="Tarjeta de crédito"
              active={form.paymentMethod === "credito"}
              onPress={() => setField("paymentMethod", "credito")}
            />
          </View>
        </FormField>

        <FormField label="Estado">
          <View style={styles.toggleRow}>
            {(["pending", "done", "cancelled"] as ScheduledExpenseStatus[]).map((s) => (
              <ToggleChip
                key={s}
                label={STATUS_LABELS[s]}
                active={form.status === s}
                onPress={() => setField("status", s)}
              />
            ))}
          </View>
        </FormField>

        <FormField label="Notas">
          <StyledInput
            value={form.notes}
            onChangeText={(v) => setField("notes", v)}
            placeholder="Notas opcionales"
            multiline
          />
        </FormField>
      </CustomModal>
    </View>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: c.textMuted, fontWeight: "500" }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function StyledInput(props: React.ComponentProps<typeof TextInput>) {
  const c = useColors();
  return (
    <TextInput
      style={[
        styles.input,
        { color: c.text, borderColor: c.border, backgroundColor: c.backgroundStrong },
        props.multiline && { minHeight: 72, textAlignVertical: "top" },
      ]}
      placeholderTextColor={c.textPlaceholder}
      {...props}
    />
  );
}

function CategoryChip({
  label, icon, active, onPress,
}: { label: string; icon: string; active: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { borderColor: active ? c.primary : c.border, backgroundColor: active ? c.primary : c.backgroundStrong },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={{ fontSize: 12 }}>{icon}</Text>
      <Text style={[styles.chipText, { color: active ? c.background : c.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ToggleChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { borderColor: active ? c.primary : c.border, backgroundColor: active ? c.primary : c.backgroundStrong },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, { color: active ? c.background : c.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: SPACING.md, gap: SPACING.md },

  summaryBar: {
    flexDirection: "row",
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: SPACING.sm,
    gap: 2,
  },
  summaryValue: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: "700" },
  summaryLabel: { fontSize: TYPOGRAPHY.fontSize.xs, textAlign: "center" },
  summaryDivider: { width: 1 },

  addRow: { alignItems: "flex-start" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: "600" },
  emptyHint: { fontSize: TYPOGRAPHY.fontSize.sm, textAlign: "center", maxWidth: 260 },

  list: { gap: SPACING.sm, paddingBottom: SPACING.lg },

  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  cardDone: { opacity: 0.7 },
  cardLeft: { width: 36, alignItems: "center" },
  cardIcon: { fontSize: 22 },
  cardBody: { flex: 1, gap: 2 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardTitle: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600", flex: 1 },
  textStrike: { textDecorationLine: "line-through" },
  cardSub: { fontSize: TYPOGRAPHY.fontSize.xs },
  cardNotes: { fontSize: TYPOGRAPHY.fontSize.xs },
  cardRight: { alignItems: "flex-end" },
  cardAmount: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "700" },
  cardAmountUnknown: { fontSize: TYPOGRAPHY.fontSize.xs, fontStyle: "italic" },

  statusDot: { width: 8, height: 8, borderRadius: 4 },

  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs },
  toggleRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  chipText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "500" },

  modalFooterRight: { flexDirection: "row", gap: SPACING.sm },
});
