import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CalendarPicker } from "@/shared/components/inputs/CalendarPicker";
import { CustomSelect } from "@/shared/components/inputs/CustomSelect";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { usePlanningStore } from "@/features/expenses/planning/store";
import { useExpensesStore } from "../store";
import { currentMonthName, formatMXN, MESES_LIST } from "../helpers";
import type { RecurringCategory, RecurringExpense } from "../types";
import type { ScheduledExpenseCategory } from "../planning/types";

const SUB_TABS = ["Básicos", "Servicios", "Agendados"] as const;
type SubTab = (typeof SUB_TABS)[number];

const MES_OPTIONS = [
  { label: "Todos los meses", value: "__all__" },
  ...MESES_LIST.map((m) => ({ label: m, value: m })),
];

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  label: String(i + 1),
  value: i + 1,
}));

const SCHEDULED_CATEGORY_OPTIONS: { label: string; value: ScheduledExpenseCategory }[] = [
  { label: "Mecánico", value: "mechanic" },
  { label: "Seguro", value: "insurance" },
  { label: "Médico", value: "medical" },
  { label: "Servicios", value: "utilities" },
  { label: "Suscripción", value: "subscription" },
  { label: "Otro", value: "other" },
];

type RecurringForm = {
  title: string;
  amount: string;
  days: number[];
  metodoPago: "efectivo" | "credito";
  creditCardId: string;
};

type ScheduledForm = {
  title: string;
  amount: string;
  amountKnown: boolean;
  scheduledDate: Date | null;
  category: ScheduledExpenseCategory;
  notes: string;
};

const blankRecurring = (): RecurringForm => ({
  title: "",
  amount: "",
  days: [],
  metodoPago: "efectivo",
  creditCardId: "",
});

const blankScheduled = (): ScheduledForm => ({
  title: "",
  amount: "",
  amountKnown: true,
  scheduledDate: null,
  category: "other",
  notes: "",
});

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function FijosTab() {
  const c = useColors();
  const [subTab, setSubTab] = useState<SubTab>("Básicos");
  const [selectedMes, setSelectedMes] = useState(currentMonthName());

  return (
    <View style={styles.root}>
      {/* Sub-tab bar */}
      <View style={[styles.subTabBar, { borderBottomColor: c.border }]}>
        {SUB_TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.subTab, subTab === t && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}
            onPress={() => setSubTab(t)}
          >
            <Text style={[styles.subTabLabel, { color: subTab === t ? c.primary : c.textMuted }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Month filter for Básicos / Servicios */}
      {subTab !== "Agendados" && (
        <View style={[styles.monthBar, { borderBottomColor: c.border }]}>
          <CustomSelect
            value={selectedMes}
            options={MES_OPTIONS}
            onChange={(v) => setSelectedMes(String(v))}
            style={styles.mesSelect}
          />
        </View>
      )}

      {subTab === "Básicos" && <RecurringList category="basico" selectedMes={selectedMes} c={c} />}
      {subTab === "Servicios" && <RecurringList category="servicio" selectedMes={selectedMes} c={c} />}
      {subTab === "Agendados" && <AgendadosList c={c} />}
    </View>
  );
}

function RecurringList({
  category,
  selectedMes,
  c,
}: {
  category: RecurringCategory;
  selectedMes: string;
  c: ReturnType<typeof useColors>;
}) {
  const {
    recurringExpenses,
    creditCards,
    addRecurringExpense,
    updateRecurringExpense,
    removeRecurringExpense,
    toggleCancelMonth,
    addExpenseFromModal,
  } = useExpensesStore();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<RecurringForm>(blankRecurring());

  const items = recurringExpenses.filter((r) => r.category === category);

  const cardOptions = [
    { label: "Sin tarjeta", value: "" },
    ...creditCards.map((c) => ({ label: c.name, value: c.id })),
  ];

  // Days not yet selected, for the add-day dropdown
  const availableDayOptions = [
    { label: "Agregar día...", value: 0 },
    ...DAY_OPTIONS.filter((o) => !form.days.includes(o.value)),
  ];

  function patch(p: Partial<RecurringForm>) {
    setForm((f) => ({ ...f, ...p }));
  }

  function addDay(day: number) {
    if (day > 0 && !form.days.includes(day)) {
      patch({ days: [...form.days, day] });
    }
  }

  function removeDay(day: number) {
    patch({ days: form.days.filter((d) => d !== day) });
  }

  function startAdd() {
    setEditId(null);
    setForm(blankRecurring());
    setShowForm(true);
  }

  function startEdit(r: RecurringExpense) {
    setEditId(r.id);
    setForm({
      title: r.title,
      amount: String(r.amount),
      days: r.days,
      metodoPago: r.metodoPago,
      creditCardId: r.creditCardId ?? "",
    });
    setShowForm(true);
  }

  function save() {
    const amount = parseFloat(form.amount.replace(/[^0-9.]/g, "")) || 0;
    if (!form.title.trim() || amount <= 0 || form.days.length === 0) return;

    const patch_data = {
      title: form.title.trim(),
      amount,
      days: form.days,
      category,
      metodoPago: form.metodoPago,
      ...(form.metodoPago === "credito" && form.creditCardId ? { creditCardId: form.creditCardId } : {}),
    };

    if (editId) {
      updateRecurringExpense(editId, patch_data);
    } else {
      addRecurringExpense(patch_data);

      // Push one expense entry per day into the gastos table
      const targetMes = selectedMes !== "__all__" ? selectedMes : currentMonthName();
      for (const day of form.days) {
        addExpenseFromModal({
          mes: targetMes,
          gastos: form.title.trim(),
          monto: amount,
          metodoPago: form.metodoPago,
          frecuencia: "mes",
          fecha: day,
          fechaMaxima: "",
          estado: "no pagado",
          ...(form.metodoPago === "credito" && form.creditCardId ? { creditCardId: form.creditCardId } : {}),
        });
      }
    }

    setShowForm(false);
    setEditId(null);
  }

  function isCancelled(r: RecurringExpense) {
    return selectedMes !== "__all__" && r.cancelledMonths.includes(selectedMes);
  }

  return (
    <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
      {/* Add / edit form */}
      {showForm && (
        <View style={[styles.formCard, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
          <TextInput
            style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
            placeholder="Nombre"
            placeholderTextColor={c.textPlaceholder}
            value={form.title}
            onChangeText={(v) => patch({ title: v })}
          />
          <TextInput
            style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
            placeholder="Monto"
            placeholderTextColor={c.textPlaceholder}
            keyboardType="numeric"
            value={form.amount}
            onChangeText={(v) => patch({ amount: v })}
          />

          {/* Days multi-selector */}
          <View style={styles.daysSection}>
            <Text style={[styles.formLabel, { color: c.textMuted }]}>Días del mes</Text>
            {form.days.length > 0 && (
              <View style={styles.daysChips}>
                {[...form.days].sort((a, b) => a - b).map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.dayChip, { backgroundColor: c.primary }]}
                    onPress={() => removeDay(d)}
                  >
                    <Text style={[styles.dayChipText, { color: c.primaryForeground }]}>{d} ×</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {form.days.length < 31 && (
              <CustomSelect
                value={0}
                options={availableDayOptions}
                onChange={(v) => addDay(Number(v))}
                style={styles.dayAddSelect}
              />
            )}
          </View>

          {/* Payment method */}
          <View style={styles.chipRow}>
            {(["efectivo", "credito"] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.chip, { borderColor: c.border, backgroundColor: form.metodoPago === m ? c.primary : c.background }]}
                onPress={() => patch({ metodoPago: m, creditCardId: "" })}
              >
                <Text style={{ color: form.metodoPago === m ? c.primaryForeground : c.text, fontSize: TYPOGRAPHY.fontSize.xs }}>
                  {m === "efectivo" ? "Efectivo" : "Crédito"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Card selector — only when credito and cards exist */}
          {form.metodoPago === "credito" && creditCards.length > 0 && (
            <CustomSelect
              value={form.creditCardId}
              options={cardOptions}
              onChange={(v) => patch({ creditCardId: String(v) })}
            />
          )}

          <View style={styles.formActions}>
            <TouchableOpacity style={[styles.btn, { backgroundColor: c.primary }]} onPress={save}>
              <Text style={[styles.btnText, { color: c.primaryForeground }]}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: c.backgroundStrong, borderColor: c.border, borderWidth: 1 }]}
              onPress={() => setShowForm(false)}
            >
              <Text style={[styles.btnText, { color: c.text }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {items.length === 0 && !showForm && (
        <Text style={[styles.empty, { color: c.textMuted }]}>
          Sin {category === "basico" ? "básicos" : "servicios"} registrados.
        </Text>
      )}

      {items.map((r) => {
        const cancelled = isCancelled(r);
        const cardName = r.creditCardId ? creditCards.find((c) => c.id === r.creditCardId)?.name : undefined;
        return (
          <View
            key={r.id}
            style={[styles.itemCard, { backgroundColor: c.backgroundStrong, borderColor: c.border, opacity: cancelled ? 0.55 : 1 }]}
          >
            <View style={styles.itemMain}>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, { color: c.text, textDecorationLine: cancelled ? "line-through" : "none" }]}>
                  {r.title}
                </Text>
                <Text style={[styles.itemSub, { color: c.textMuted }]}>
                  {r.days.length === 1 ? `Día ${r.days[0]}` : `Días ${[...r.days].sort((a, b) => a - b).join(", ")}`}
                  {" · "}{r.metodoPago}
                  {cardName ? ` · ${cardName}` : ""}
                </Text>
              </View>
              <Text style={[styles.itemAmount, { color: c.primary }]}>${formatMXN(r.amount)}</Text>
            </View>
            <View style={styles.itemActions}>
              {selectedMes !== "__all__" && (
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: cancelled ? "#16A34A" : c.danger }]}
                  onPress={() => toggleCancelMonth(r.id, selectedMes)}
                >
                  <Text style={[styles.actionBtnText, { color: cancelled ? "#16A34A" : c.danger }]}>
                    {cancelled ? "Activar" : "Cancelar mes"}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.actionBtn, { borderColor: c.border }]} onPress={() => startEdit(r)}>
                <Text style={[styles.actionBtnText, { color: c.text }]}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: c.danger }]}
                onPress={() => removeRecurringExpense(r.id)}
              >
                <Text style={[styles.actionBtnText, { color: c.danger }]}>Eliminar</Text>
              </TouchableOpacity>
            </View>
            {r.cancelledMonths.length > 0 && (
              <Text style={[styles.cancelledNote, { color: c.textMuted }]}>
                Cancelado en: {r.cancelledMonths.join(", ")}
              </Text>
            )}
          </View>
        );
      })}

      {!showForm && (
        <TouchableOpacity style={[styles.addBtn, { borderColor: c.primary }]} onPress={startAdd}>
          <Text style={[styles.addBtnText, { color: c.primary }]}>+ Agregar</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function AgendadosList({ c }: { c: ReturnType<typeof useColors> }) {
  const { scheduledExpenses, addScheduledExpense, updateScheduledExpense, removeScheduledExpense } = usePlanningStore();
  const { addExpenseFromModal } = useExpensesStore();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduledForm>(blankScheduled());

  function patch(p: Partial<ScheduledForm>) {
    setForm((f) => ({ ...f, ...p }));
  }

  function startAdd() {
    setEditId(null);
    setForm(blankScheduled());
    setShowForm(true);
  }

  function startEdit(e: (typeof scheduledExpenses)[number]) {
    setEditId(e.id);
    setForm({
      title: e.title,
      amount: String(e.amount),
      amountKnown: e.amountKnown,
      scheduledDate: e.scheduledDate ? new Date(e.scheduledDate + "T12:00:00") : null,
      category: e.category,
      notes: e.notes,
    });
    setShowForm(true);
  }

  function save() {
    if (!form.title.trim() || !form.scheduledDate) return;
    const amount = parseFloat(form.amount.replace(/[^0-9.]/g, "")) || 0;
    const payload = {
      title: form.title.trim(),
      scheduledDate: formatDate(form.scheduledDate),
      category: form.category,
      amountKnown: form.amountKnown,
      amount,
      notes: form.notes,
      status: "pending" as const,
    };

    if (editId) {
      updateScheduledExpense(editId, payload);
    } else {
      addScheduledExpense(payload);

      // Push to gastos table
      if (form.amountKnown && amount > 0) {
        addExpenseFromModal({
          mes: MESES_LIST[form.scheduledDate.getMonth()] ?? currentMonthName(),
          gastos: form.title.trim(),
          monto: amount,
          metodoPago: "efectivo",
          frecuencia: "unico",
          fecha: form.scheduledDate.getDate(),
          fechaMaxima: "",
          estado: "no pagado",
        });
      }
    }

    setShowForm(false);
    setEditId(null);
  }

  const pending = scheduledExpenses.filter((e) => e.status === "pending");
  const done = scheduledExpenses.filter((e) => e.status !== "pending");

  return (
    <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
      {showForm && (
        <View style={[styles.formCard, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
          <TextInput
            style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
            placeholder="Descripción"
            placeholderTextColor={c.textPlaceholder}
            value={form.title}
            onChangeText={(v) => patch({ title: v })}
          />
          <CalendarPicker
            label="Fecha programada"
            value={form.scheduledDate}
            onChange={(d) => patch({ scheduledDate: d })}
            placeholder="Seleccionar fecha"
          />
          <CustomSelect
            value={form.category}
            options={SCHEDULED_CATEGORY_OPTIONS}
            onChange={(v) => patch({ category: v as ScheduledExpenseCategory })}
          />
          <View style={styles.chipRow}>
            <TouchableOpacity
              style={[styles.chip, { borderColor: c.border, backgroundColor: form.amountKnown ? c.primary : c.background }]}
              onPress={() => patch({ amountKnown: true })}
            >
              <Text style={{ color: form.amountKnown ? c.primaryForeground : c.text, fontSize: TYPOGRAPHY.fontSize.xs }}>
                Monto conocido
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, { borderColor: c.border, backgroundColor: !form.amountKnown ? c.primary : c.background }]}
              onPress={() => patch({ amountKnown: false })}
            >
              <Text style={{ color: !form.amountKnown ? c.primaryForeground : c.text, fontSize: TYPOGRAPHY.fontSize.xs }}>
                Por definir
              </Text>
            </TouchableOpacity>
          </View>
          {form.amountKnown && (
            <TextInput
              style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
              placeholder="Monto estimado"
              placeholderTextColor={c.textPlaceholder}
              keyboardType="numeric"
              value={form.amount}
              onChangeText={(v) => patch({ amount: v })}
            />
          )}
          <TextInput
            style={[styles.input, styles.notesInput, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
            placeholder="Notas (opcional)"
            placeholderTextColor={c.textPlaceholder}
            value={form.notes}
            onChangeText={(v) => patch({ notes: v })}
            multiline
          />
          <View style={styles.formActions}>
            <TouchableOpacity style={[styles.btn, { backgroundColor: c.primary }]} onPress={save}>
              <Text style={[styles.btnText, { color: c.primaryForeground }]}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: c.backgroundStrong, borderColor: c.border, borderWidth: 1 }]}
              onPress={() => setShowForm(false)}
            >
              <Text style={[styles.btnText, { color: c.text }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {pending.length === 0 && done.length === 0 && !showForm && (
        <Text style={[styles.empty, { color: c.textMuted }]}>Sin gastos agendados.</Text>
      )}

      {pending.map((e) => (
        <View key={e.id} style={[styles.itemCard, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
          <View style={styles.itemMain}>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemTitle, { color: c.text }]}>{e.title}</Text>
              <Text style={[styles.itemSub, { color: c.textMuted }]}>{e.scheduledDate} · {e.category}</Text>
            </View>
            {e.amountKnown ? (
              <Text style={[styles.itemAmount, { color: c.primary }]}>${formatMXN(e.amount)}</Text>
            ) : (
              <Text style={[styles.itemAmount, { color: c.textMuted }]}>Por definir</Text>
            )}
          </View>
          {e.notes ? <Text style={[styles.cancelledNote, { color: c.textMuted }]}>{e.notes}</Text> : null}
          <View style={styles.itemActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: "#16A34A" }]}
              onPress={() => updateScheduledExpense(e.id, { status: "done" })}
            >
              <Text style={[styles.actionBtnText, { color: "#16A34A" }]}>Marcar hecho</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { borderColor: c.border }]} onPress={() => startEdit(e)}>
              <Text style={[styles.actionBtnText, { color: c.text }]}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: c.danger }]}
              onPress={() => removeScheduledExpense(e.id)}
            >
              <Text style={[styles.actionBtnText, { color: c.danger }]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {done.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: c.textMuted }]}>Completados / Cancelados</Text>
          {done.map((e) => (
            <View
              key={e.id}
              style={[styles.itemCard, { backgroundColor: c.backgroundStrong, borderColor: c.border, opacity: 0.5 }]}
            >
              <View style={styles.itemMain}>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemTitle, { color: c.text, textDecorationLine: "line-through" }]}>{e.title}</Text>
                  <Text style={[styles.itemSub, { color: c.textMuted }]}>{e.scheduledDate} · {e.status}</Text>
                </View>
                {e.amountKnown ? (
                  <Text style={[styles.itemAmount, { color: c.textMuted }]}>${formatMXN(e.amount)}</Text>
                ) : null}
              </View>
              <View style={styles.itemActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: c.border }]}
                  onPress={() => updateScheduledExpense(e.id, { status: "pending" })}
                >
                  <Text style={[styles.actionBtnText, { color: c.text }]}>Reactivar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: c.danger }]}
                  onPress={() => removeScheduledExpense(e.id)}
                >
                  <Text style={[styles.actionBtnText, { color: c.danger }]}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      )}

      {!showForm && (
        <TouchableOpacity style={[styles.addBtn, { borderColor: c.primary }]} onPress={startAdd}>
          <Text style={[styles.addBtnText, { color: c.primary }]}>+ Agendar gasto</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  subTabBar: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  subTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  subTabLabel: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" },
  monthBar: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  mesSelect: { maxWidth: 220 },
  list: { flex: 1 },
  listContent: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xl },
  empty: { textAlign: "center", marginTop: SPACING.xl, fontSize: TYPOGRAPHY.fontSize.sm },
  sectionLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: "600",
    marginTop: SPACING.sm,
    textTransform: "uppercase",
  },
  formCard: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.sm,
    minHeight: 40,
  },
  notesInput: { minHeight: 64 },
  daysSection: { gap: SPACING.xs },
  formLabel: { fontSize: TYPOGRAPHY.fontSize.sm },
  daysChips: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs },
  dayChip: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: BORDER_RADIUS.sm },
  dayChipText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },
  dayAddSelect: { maxWidth: 160 },
  chipRow: { flexDirection: "row", gap: SPACING.sm },
  chip: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.sm, borderWidth: 1 },
  formActions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.xs },
  btn: { flex: 1, alignItems: "center", paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.sm },
  btnText: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" },
  itemCard: { borderRadius: BORDER_RADIUS.md, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.md, gap: SPACING.xs },
  itemMain: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  itemInfo: { flex: 1, gap: 2 },
  itemTitle: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" },
  itemSub: { fontSize: TYPOGRAPHY.fontSize.xs },
  itemAmount: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "700" },
  itemActions: { flexDirection: "row", gap: SPACING.xs, flexWrap: "wrap" },
  actionBtn: { borderWidth: 1, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 3 },
  actionBtnText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "500" },
  cancelledNote: { fontSize: TYPOGRAPHY.fontSize.xs, fontStyle: "italic" },
  addBtn: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: "center",
    borderStyle: "dashed",
  },
  addBtnText: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" },
});
