import { useState, useEffect } from "react";
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
import type { InstallmentPayment } from "@/features/expenses/planning/types";
import { currentMonthName, currentYear, formatMXN, MESES_LIST } from "../helpers";
import type { RecurringCategory, RecurringExpense, RecurringSchedulingType } from "../types";
import type { ScheduledExpenseCategory } from "../planning/types";

const SUB_TABS = ["Básicos", "Servicios", "Agendados", "Pagos a meses", "Simulación"] as const;
type SubTab = (typeof SUB_TABS)[number];

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

type IntervalUnit = "days" | "months";

type RecurringForm = {
  title: string;
  amount: string;
  schedulingType: RecurringSchedulingType;
  // monthly fields
  days: number[];
  // interval fields
  intervalUnit: IntervalUnit;
  intervalValue: string;   // number as string
  startDate: Date | null;
  expirationDate: Date | null;
  // installment limit (both types)
  hasInstallmentLimit: boolean;
  totalInstallments: string;
  paidInstallments: string;
  // payment
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
  schedulingType: "monthly",
  days: [],
  intervalUnit: "days",
  intervalValue: "",
  startDate: null,
  expirationDate: null,
  hasInstallmentLimit: false,
  totalInstallments: "",
  paidInstallments: "0",
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
  const [selectedAño, setSelectedAño] = useState(currentYear());
  const { activatedMonths, activateMonth, deactivateMonth } = useExpensesStore();

  const currentMes = currentMonthName();
  const thisYear = currentYear();

  // Generate year options: current year ± 1
  const añoOptions = [thisYear - 1, thisYear, thisYear + 1].map((y) => ({
    label: String(y),
    value: y,
  }));

  // Auto-activate next month after day 25
  useEffect(() => {
    if (new Date().getDate() >= 25) {
      const nextMonth = MESES_LIST[(new Date().getMonth() + 1) % 12]!;
      const nextYear = new Date().getMonth() === 11 ? thisYear + 1 : thisYear;
      const key = `${nextMonth}-${nextYear}`;
      if (!activatedMonths.includes(key)) {
        activateMonth(nextMonth, nextYear);
      }
    }
  }, []);

  const showMonthFilter = subTab === "Básicos" || subTab === "Servicios";
  const activationKey = `${selectedMes}-${selectedAño}`;
  const isCurrentMesAndYear = selectedMes === currentMes && selectedAño === thisYear;
  const isActivated = isCurrentMesAndYear || activatedMonths.includes(activationKey);

  return (
    <View style={styles.root}>
      {/* Sub-tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.subTabBar, { borderBottomColor: c.border }]}
        contentContainerStyle={{ flexDirection: "row" }}
      >
        {SUB_TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.subTab, subTab === t && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}
            onPress={() => setSubTab(t)}
          >
            <Text style={[styles.subTabLabel, { color: subTab === t ? c.primary : c.textMuted }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Month dropdown for Básicos / Servicios */}
      {showMonthFilter && (
        <View style={[styles.monthFilterRow, { borderBottomColor: c.border }]}>
          <CustomSelect
            placeholder="Año"
            options={añoOptions}
            value={selectedAño}
            onChange={(val) => setSelectedAño(Number(val))}
            style={styles.yearSelect}
          />
          <CustomSelect
            placeholder="Seleccionar mes"
            options={MESES_LIST.map((m) => ({ label: m, value: m }))}
            value={selectedMes}
            onChange={(val) => setSelectedMes(val as string)}
            style={styles.monthSelect}
          />
          {!isCurrentMesAndYear && (
            <TouchableOpacity
              onPress={() => isActivated ? deactivateMonth(selectedMes, selectedAño) : activateMonth(selectedMes, selectedAño)}
              style={styles.gastosAplicadosBtn}
            >
              <Text style={{ color: isActivated ? "#16A34A" : c.textMuted, fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" }}>
                {isActivated ? "✓ gastos aplicados" : "+ aplicar a gastos"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {subTab === "Básicos" && <RecurringList category="basico" selectedMes={selectedMes} c={c} />}
      {subTab === "Servicios" && <RecurringList category="servicio" selectedMes={selectedMes} c={c} />}
      {subTab === "Agendados" && <AgendadosList c={c} />}
      {subTab === "Pagos a meses" && <PagosMesesTab c={c} />}
      {subTab === "Simulación" && <SimulacionTab c={c} />}
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
  const [cardError, setCardError] = useState("");

  const items = recurringExpenses.filter((r) => r.category === category);

  const cardOptions = creditCards.map((c) => ({ label: c.name, value: c.id }));

  // Days not yet selected, for the add-day dropdown
  const availableDayOptions = [
    { label: "Agregar día...", value: 0 },
    ...DAY_OPTIONS.filter((o) => !form.days.includes(o.value)),
  ];

  function patch(p: Partial<RecurringForm>) {
    setForm((f) => ({ ...f, ...p }));
    if (p.creditCardId) setCardError("");
  }

  function handleSelectCredito() {
    const firstCard = creditCards[0]?.id ?? "";
    patch({ metodoPago: "credito", creditCardId: form.creditCardId || firstCard });
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
    setCardError("");
    setShowForm(true);
  }

  function startEdit(r: RecurringExpense) {
    setEditId(r.id);
    const isInterval = r.schedulingType === "interval";
    setForm({
      title: r.title,
      amount: String(r.amount),
      schedulingType: r.schedulingType ?? "monthly",
      days: r.days,
      intervalUnit: r.intervalMonths ? "months" : "days",
      intervalValue: String(r.intervalDays ?? r.intervalMonths ?? ""),
      startDate: r.startDate ? new Date(r.startDate + "T12:00:00") : null,
      expirationDate: r.expirationDate ? new Date(r.expirationDate + "T12:00:00") : null,
      hasInstallmentLimit: (r.totalInstallments ?? 0) > 0,
      totalInstallments: String(r.totalInstallments ?? ""),
      paidInstallments: String(r.paidInstallments ?? 0),
      metodoPago: r.metodoPago,
      creditCardId: r.creditCardId ?? "",
    });
    setCardError("");
    setShowForm(true);
  }

  function save() {
    const amount = parseFloat(form.amount.replace(/[^0-9.]/g, "")) || 0;
    if (!form.title.trim() || amount <= 0) return;
    if (form.schedulingType === "monthly" && form.days.length === 0) return;
    if (form.schedulingType === "interval" && (!form.intervalValue || !form.startDate)) return;
    if (form.metodoPago === "credito" && !form.creditCardId) {
      setCardError("Debes seleccionar una tarjeta para pagos con crédito");
      return;
    }

    const totalInst = form.hasInstallmentLimit ? (parseInt(form.totalInstallments, 10) || undefined) : undefined;
    const paidInst = form.hasInstallmentLimit ? (parseInt(form.paidInstallments, 10) || 0) : undefined;
    const intervalNum = parseInt(form.intervalValue, 10) || 0;

    const patch_data: Omit<RecurringExpense, "id" | "cancelledMonths"> = {
      title: form.title.trim(),
      amount,
      days: form.schedulingType === "monthly" ? form.days : [],
      category,
      metodoPago: form.metodoPago,
      schedulingType: form.schedulingType,
      ...(form.metodoPago === "credito" && form.creditCardId ? { creditCardId: form.creditCardId } : {}),
      ...(form.schedulingType === "interval" && form.startDate
        ? {
            startDate: formatDate(form.startDate),
            ...(form.intervalUnit === "days" ? { intervalDays: intervalNum } : { intervalMonths: intervalNum }),
            ...(form.expirationDate ? { expirationDate: formatDate(form.expirationDate) } : {}),
          }
        : {}),
      ...(totalInst !== undefined ? { totalInstallments: totalInst, paidInstallments: paidInst ?? 0 } : {}),
    };

    if (editId) {
      updateRecurringExpense(editId, patch_data);
    } else {
      addRecurringExpense(patch_data);

      // Only push immediate expenses for monthly type (interval ones are generated via activateMonth)
      if (form.schedulingType === "monthly") {
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
    }

    setShowForm(false);
    setEditId(null);
  }

  function isCancelled(r: RecurringExpense) {
    return selectedMes !== "__all__" && r.cancelledMonths.includes(selectedMes);
  }

  return (
    <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
      {/* Add button — always at top so it's visible regardless of list length */}
      {!showForm && (
        <TouchableOpacity style={[styles.addBtn, { borderColor: c.primary }]} onPress={startAdd}>
          <Text style={[styles.addBtnText, { color: c.primary }]}>+ Agregar</Text>
        </TouchableOpacity>
      )}

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

          {/* Scheduling type */}
          <View style={styles.chipRow}>
            {(["monthly", "interval"] as RecurringSchedulingType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, { borderColor: c.border, flex: 1, alignItems: "center",
                  backgroundColor: form.schedulingType === t ? c.primary : c.background }]}
                onPress={() => patch({ schedulingType: t })}
              >
                <Text style={{ color: form.schedulingType === t ? c.primaryForeground : c.text, fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" }}>
                  {t === "monthly" ? "Días del mes" : "Por intervalo"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Monthly: days multi-selector */}
          {form.schedulingType === "monthly" && (
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
          )}

          {/* Interval: unit + value + startDate + expirationDate */}
          {form.schedulingType === "interval" && (
            <View style={{ gap: SPACING.sm }}>
              <View style={styles.chipRow}>
                {(["days", "months"] as IntervalUnit[]).map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.chip, { borderColor: c.border, flex: 1, alignItems: "center",
                      backgroundColor: form.intervalUnit === u ? c.primary : c.background }]}
                    onPress={() => patch({ intervalUnit: u })}
                  >
                    <Text style={{ color: form.intervalUnit === u ? c.primaryForeground : c.text, fontSize: TYPOGRAPHY.fontSize.xs }}>
                      {u === "days" ? "Cada N días" : "Cada N meses"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
                placeholder={form.intervalUnit === "days" ? "Cada cuántos días (ej: 20)" : "Cada cuántos meses (ej: 6)"}
                placeholderTextColor={c.textPlaceholder}
                keyboardType="numeric"
                value={form.intervalValue}
                onChangeText={(v) => patch({ intervalValue: v })}
              />
              <CalendarPicker
                label="Fecha de inicio *"
                value={form.startDate}
                onChange={(d) => patch({ startDate: d })}
                placeholder="Seleccionar fecha"
              />
              <CalendarPicker
                label="Fecha de expiración (opcional)"
                value={form.expirationDate}
                onChange={(d) => patch({ expirationDate: d })}
                placeholder="Sin expiración"
              />
            </View>
          )}

          {/* Optional installment limit */}
          <View style={{ gap: SPACING.xs }}>
            <TouchableOpacity
              style={styles.chipRow}
              onPress={() => patch({ hasInstallmentLimit: !form.hasInstallmentLimit })}
            >
              <View style={[styles.checkBox, { borderColor: form.hasInstallmentLimit ? c.primary : c.border,
                backgroundColor: form.hasInstallmentLimit ? c.primary : "transparent" }]}>
                {form.hasInstallmentLimit && <Text style={{ color: c.background, fontSize: 10 }}>✓</Text>}
              </View>
              <Text style={[styles.formLabel, { color: c.textMuted }]}>Cuotas limitadas</Text>
            </TouchableOpacity>
            {form.hasInstallmentLimit && (
              <View style={{ flexDirection: "row", gap: SPACING.sm }}>
                <TextInput
                  style={[styles.input, { flex: 1, color: c.text, borderColor: c.border, backgroundColor: c.background }]}
                  placeholder="Total cuotas"
                  placeholderTextColor={c.textPlaceholder}
                  keyboardType="numeric"
                  value={form.totalInstallments}
                  onChangeText={(v) => patch({ totalInstallments: v })}
                />
                <TextInput
                  style={[styles.input, { flex: 1, color: c.text, borderColor: c.border, backgroundColor: c.background }]}
                  placeholder="Ya pagadas"
                  placeholderTextColor={c.textPlaceholder}
                  keyboardType="numeric"
                  value={form.paidInstallments}
                  onChangeText={(v) => patch({ paidInstallments: v })}
                />
              </View>
            )}
          </View>

          {/* Payment method */}
          <View style={styles.chipRow}>
            <TouchableOpacity
              style={[styles.chip, { borderColor: c.border, backgroundColor: form.metodoPago === "efectivo" ? c.primary : c.background }]}
              onPress={() => patch({ metodoPago: "efectivo", creditCardId: "" })}
            >
              <Text style={{ color: form.metodoPago === "efectivo" ? c.primaryForeground : c.text, fontSize: TYPOGRAPHY.fontSize.xs }}>
                Efectivo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, { borderColor: c.border, backgroundColor: form.metodoPago === "credito" ? c.primary : c.background }, creditCards.length === 0 && { opacity: 0.4 }]}
              onPress={handleSelectCredito}
              disabled={creditCards.length === 0}
            >
              <Text style={{ color: form.metodoPago === "credito" ? c.primaryForeground : c.text, fontSize: TYPOGRAPHY.fontSize.xs }}>
                Crédito
              </Text>
            </TouchableOpacity>
          </View>

          {/* Card selector — required when credito */}
          {form.metodoPago === "credito" && (
            <View style={{ gap: 4 }}>
              <CustomSelect
                value={form.creditCardId}
                options={cardOptions}
                onChange={(v) => patch({ creditCardId: String(v) })}
                placeholder="Seleccionar tarjeta *"
              />
              {cardError ? (
                <Text style={{ color: c.danger, fontSize: TYPOGRAPHY.fontSize.xs }}>{cardError}</Text>
              ) : null}
            </View>
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
        const isInterval = r.schedulingType === "interval";
        const paidInst = r.paidInstallments ?? 0;
        const totalInst = r.totalInstallments;
        const isCompleted = totalInst !== undefined && paidInst >= totalInst;

        let scheduleLabel: string;
        if (isInterval) {
          if (r.intervalDays) scheduleLabel = `Cada ${r.intervalDays} días desde ${r.startDate}`;
          else if (r.intervalMonths) scheduleLabel = `Cada ${r.intervalMonths} ${r.intervalMonths === 1 ? "mes" : "meses"} desde ${r.startDate}`;
          else scheduleLabel = "Por intervalo";
          if (r.expirationDate) scheduleLabel += ` · vence ${r.expirationDate}`;
        } else {
          scheduleLabel = r.days.length === 1
            ? `Día ${r.days[0]}`
            : `Días ${[...r.days].sort((a, b) => a - b).join(", ")}`;
        }

        const instPct = totalInst ? paidInst / totalInst : 0;

        return (
          <View
            key={r.id}
            style={[styles.itemCard, { backgroundColor: c.backgroundStrong, borderColor: c.border,
              opacity: cancelled || isCompleted ? 0.55 : 1 }]}
          >
            <View style={styles.itemMain}>
              <View style={styles.itemInfo}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.xs, flexWrap: "wrap" }}>
                  <Text style={[styles.itemTitle, { color: c.text, textDecorationLine: cancelled || isCompleted ? "line-through" : "none" }]}>
                    {r.title}
                  </Text>
                  {isInterval && (
                    <View style={{ backgroundColor: `${c.primary}22`, paddingHorizontal: SPACING.xs, paddingVertical: 1, borderRadius: BORDER_RADIUS.sm }}>
                      <Text style={{ fontSize: 10, color: c.primary, fontWeight: "600" }}>intervalo</Text>
                    </View>
                  )}
                  {isCompleted && (
                    <View style={{ backgroundColor: "#16A34A22", paddingHorizontal: SPACING.xs, paddingVertical: 1, borderRadius: BORDER_RADIUS.sm }}>
                      <Text style={{ fontSize: 10, color: "#16A34A", fontWeight: "600" }}>completado</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.itemSub, { color: c.textMuted }]}>
                  {scheduleLabel}
                  {" · "}{r.metodoPago}
                  {cardName ? ` · ${cardName}` : ""}
                </Text>
                {totalInst !== undefined && (
                  <Text style={[styles.itemSub, { color: c.textMuted }]}>
                    {paidInst}/{totalInst} cuotas
                  </Text>
                )}
              </View>
              <Text style={[styles.itemAmount, { color: isCompleted ? c.textMuted : c.primary }]}>${formatMXN(r.amount)}</Text>
            </View>
            {totalInst !== undefined && (
              <View style={[styles.progressBar, { backgroundColor: c.border }]}>
                <View style={[styles.progressFill, { width: `${Math.round(instPct * 100)}%` as any, backgroundColor: isCompleted ? "#16A34A" : c.primary }]} />
              </View>
            )}
            <View style={styles.itemActions}>
              {selectedMes !== "__all__" && !isCompleted && (
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

// ─── Pagos a meses ────────────────────────────────────────────────────────────

type InstallmentForm = {
  title: string;
  monthlyAmount: string;
  totalMonths: string;
  paidMonths: string;
  notes: string;
  creditCardId: string;
};

const blankInstallmentForm = (): InstallmentForm => ({
  title: "",
  monthlyAmount: "",
  totalMonths: "",
  paidMonths: "0",
  notes: "",
  creditCardId: "",
});

function PagosMesesTab({ c }: { c: ReturnType<typeof useColors> }) {
  const { installmentPayments, addInstallment, updateInstallment, removeInstallment } =
    usePlanningStore();
  const { addExpenseFromModal, creditCards } = useExpensesStore();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<InstallmentForm>(blankInstallmentForm());

  function patch(p: Partial<InstallmentForm>) {
    setForm((f) => ({ ...f, ...p }));
  }

  function startAdd() {
    setEditId(null);
    setForm(blankInstallmentForm());
    setShowForm(true);
  }

  function startEdit(ip: InstallmentPayment) {
    setEditId(ip.id);
    setForm({
      title: ip.title,
      monthlyAmount: String(ip.monthlyAmount),
      totalMonths: String(ip.totalMonths),
      paidMonths: String(ip.paidMonths),
      notes: ip.notes,
      creditCardId: ip.creditCardId ?? "",
    });
    setShowForm(true);
  }

  function save() {
    const monthly = parseFloat(form.monthlyAmount) || 0;
    const total = parseInt(form.totalMonths, 10) || 0;
    const paid = Math.min(parseInt(form.paidMonths, 10) || 0, total);
    if (!form.title.trim() || monthly <= 0 || total <= 0) return;

    const payload: Omit<InstallmentPayment, "id"> = {
      title: form.title.trim(),
      monthlyAmount: monthly,
      totalMonths: total,
      paidMonths: paid,
      notes: form.notes.trim(),
      status: paid >= total ? "completed" : "active",
      ...(form.creditCardId ? { creditCardId: form.creditCardId } : {}),
    };

    if (editId) {
      updateInstallment(editId, payload);
    } else {
      addInstallment(payload);
    }
    setShowForm(false);
    setEditId(null);
  }

  function payMonth(ip: InstallmentPayment) {
    const newPaid = ip.paidMonths + 1;
    const isComplete = newPaid >= ip.totalMonths;
    updateInstallment(ip.id, {
      paidMonths: newPaid,
      status: isComplete ? "completed" : "active",
    });
    addExpenseFromModal({
      mes: currentMonthName(),
      gastos: ip.title,
      monto: ip.monthlyAmount,
      metodoPago: ip.creditCardId ? "credito" : "efectivo",
      frecuencia: "mes",
      fecha: new Date().getDate(),
      fechaMaxima: "",
      estado: "pagado",
      ...(ip.creditCardId ? { creditCardId: ip.creditCardId } : {}),
    });
  }

  const active = installmentPayments.filter((ip) => ip.status === "active");
  const completed = installmentPayments.filter((ip) => ip.status === "completed");

  return (
    <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
      {showForm && (
        <View style={[styles.formCard, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
          <TextInput
            style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
            placeholder="Nombre (ej: iPhone 15, Laptop...)"
            placeholderTextColor={c.textPlaceholder}
            value={form.title}
            onChangeText={(v) => patch({ title: v })}
          />
          <View style={{ flexDirection: "row", gap: SPACING.sm }}>
            <TextInput
              style={[styles.input, { flex: 1, color: c.text, borderColor: c.border, backgroundColor: c.background }]}
              placeholder="Mensualidad $"
              placeholderTextColor={c.textPlaceholder}
              keyboardType="numeric"
              value={form.monthlyAmount}
              onChangeText={(v) => patch({ monthlyAmount: v })}
            />
            <TextInput
              style={[styles.input, { flex: 1, color: c.text, borderColor: c.border, backgroundColor: c.background }]}
              placeholder="Total meses"
              placeholderTextColor={c.textPlaceholder}
              keyboardType="numeric"
              value={form.totalMonths}
              onChangeText={(v) => patch({ totalMonths: v })}
            />
            <TextInput
              style={[styles.input, { flex: 1, color: c.text, borderColor: c.border, backgroundColor: c.background }]}
              placeholder="Ya pagados"
              placeholderTextColor={c.textPlaceholder}
              keyboardType="numeric"
              value={form.paidMonths}
              onChangeText={(v) => patch({ paidMonths: v })}
            />
          </View>
          {form.monthlyAmount && form.totalMonths ? (
            <Text style={{ color: c.textMuted, fontSize: TYPOGRAPHY.fontSize.xs }}>
              Total: ${formatMXN((parseFloat(form.monthlyAmount) || 0) * (parseInt(form.totalMonths, 10) || 0))}
            </Text>
          ) : null}
          <TextInput
            style={[styles.input, styles.notesInput, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
            placeholder="Notas (opcional)"
            placeholderTextColor={c.textPlaceholder}
            value={form.notes}
            onChangeText={(v) => patch({ notes: v })}
            multiline
          />
          {creditCards.length > 0 && (
            <CustomSelect
              value={form.creditCardId}
              options={[{ label: "Sin tarjeta (efectivo)", value: "" }, ...creditCards.map((card) => ({ label: card.name, value: card.id }))]}
              onChange={(v) => patch({ creditCardId: String(v) })}
              placeholder="Sin tarjeta (efectivo)"
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

      {active.length === 0 && completed.length === 0 && !showForm && (
        <Text style={[styles.empty, { color: c.textMuted }]}>Sin pagos a meses registrados.</Text>
      )}

      {active.map((ip) => {
        const remaining = ip.totalMonths - ip.paidMonths;
        const pct = ip.totalMonths > 0 ? ip.paidMonths / ip.totalMonths : 0;
        const finishDate = new Date();
        finishDate.setMonth(finishDate.getMonth() + remaining);
        const finishStr = finishDate.toLocaleDateString("es-MX", { month: "short", year: "numeric" });
        return (
          <View key={ip.id} style={[styles.itemCard, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
            <View style={styles.itemMain}>
              <View style={styles.itemInfo}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.xs, flexWrap: "wrap" }}>
                  <Text style={[styles.itemTitle, { color: c.text }]}>{ip.title}</Text>
                  {ip.creditCardId && (() => {
                    const card = creditCards.find((cc) => cc.id === ip.creditCardId);
                    return card ? (
                      <View style={{ backgroundColor: `${c.primary}22`, paddingHorizontal: SPACING.xs, paddingVertical: 1, borderRadius: BORDER_RADIUS.sm }}>
                        <Text style={{ fontSize: 10, color: c.primary, fontWeight: "600" }}>💳 {card.name}</Text>
                      </View>
                    ) : null;
                  })()}
                </View>
                <Text style={[styles.itemSub, { color: c.textMuted }]}>
                  {ip.paidMonths}/{ip.totalMonths} meses · Termina {finishStr}
                </Text>
              </View>
              <Text style={[styles.itemAmount, { color: c.primary }]}>${formatMXN(ip.monthlyAmount)}/mes</Text>
            </View>
            {/* Progress bar */}
            <View style={[styles.progressBar, { backgroundColor: c.border }]}>
              <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: c.primary }]} />
            </View>
            {ip.notes ? <Text style={[styles.cancelledNote, { color: c.textMuted }]}>{ip.notes}</Text> : null}
            <View style={styles.itemActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: "#16A34A" }]}
                onPress={() => payMonth(ip)}
              >
                <Text style={[styles.actionBtnText, { color: "#16A34A" }]}>Pagar mes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { borderColor: c.border }]} onPress={() => startEdit(ip)}>
                <Text style={[styles.actionBtnText, { color: c.text }]}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: c.danger }]}
                onPress={() => removeInstallment(ip.id)}
              >
                <Text style={[styles.actionBtnText, { color: c.danger }]}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {completed.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: c.textMuted }]}>Terminados</Text>
          {completed.map((ip) => (
            <View
              key={ip.id}
              style={[styles.itemCard, { backgroundColor: c.backgroundStrong, borderColor: c.border, opacity: 0.5 }]}
            >
              <View style={styles.itemMain}>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemTitle, { color: c.text, textDecorationLine: "line-through" }]}>{ip.title}</Text>
                  <Text style={[styles.itemSub, { color: c.textMuted }]}>{ip.totalMonths} meses completados</Text>
                </View>
                <Text style={[styles.itemAmount, { color: c.textMuted }]}>${formatMXN(ip.monthlyAmount)}/mes</Text>
              </View>
              <View style={styles.itemActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: c.danger }]}
                  onPress={() => removeInstallment(ip.id)}
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
          <Text style={[styles.addBtnText, { color: c.primary }]}>+ Agregar pago a meses</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// ─── Simulación ───────────────────────────────────────────────────────────────

type SimType = "meses" | "unico";

type SimForm = {
  description: string;
  totalAmount: string;
  months: string;
};

function SimulacionTab({ c }: { c: ReturnType<typeof useColors> }) {
  const { recurringExpenses } = useExpensesStore();
  const { installmentPayments } = usePlanningStore();

  const [simType, setSimType] = useState<SimType>("meses");
  const [form, setForm] = useState<SimForm>({ description: "", totalAmount: "", months: "" });

  function patch(p: Partial<SimForm>) {
    setForm((f) => ({ ...f, ...p }));
  }

  function reset() {
    setForm({ description: "", totalAmount: "", months: "" });
  }

  const totalAmount = parseFloat(form.totalAmount) || 0;
  const months = parseInt(form.months, 10) || 0;
  const monthly = simType === "meses" && months > 0 ? totalAmount / months : totalAmount;

  const currentActiveInstallments = installmentPayments
    .filter((ip) => ip.status === "active")
    .reduce((sum, ip) => sum + ip.monthlyAmount, 0);
  const currentRecurring = recurringExpenses.reduce((sum, r) => sum + r.amount, 0);
  const currentMonthlyTotal = currentRecurring + currentActiveInstallments;

  const finishDate = new Date();
  if (months > 0) finishDate.setMonth(finishDate.getMonth() + months);

  const hasValues = totalAmount > 0 && (simType === "unico" || months > 0);

  return (
    <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
      {/* Type selector */}
      <View style={[styles.formCard, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
        <Text style={[styles.sectionLabel, { color: c.text, textTransform: "none", fontSize: TYPOGRAPHY.fontSize.sm }]}>
          ¿Qué quieres simular?
        </Text>
        <View style={styles.chipRow}>
          {(["meses", "unico"] as SimType[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, { borderColor: c.border, backgroundColor: simType === t ? c.primary : c.background, flex: 1, alignItems: "center" }]}
              onPress={() => setSimType(t)}
            >
              <Text style={{ color: simType === t ? c.primaryForeground : c.text, fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" }}>
                {t === "meses" ? "A meses" : "Pago único"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
          placeholder="¿Qué quieres comprar?"
          placeholderTextColor={c.textPlaceholder}
          value={form.description}
          onChangeText={(v) => patch({ description: v })}
        />

        <TextInput
          style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
          placeholder={simType === "meses" ? "Precio total $" : "Monto $"}
          placeholderTextColor={c.textPlaceholder}
          keyboardType="decimal-pad"
          value={form.totalAmount}
          onChangeText={(v) => patch({ totalAmount: v })}
        />

        {simType === "meses" && (
          <TextInput
            style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
            placeholder="Número de meses"
            placeholderTextColor={c.textPlaceholder}
            keyboardType="numeric"
            value={form.months}
            onChangeText={(v) => patch({ months: v })}
          />
        )}

        <TouchableOpacity onPress={reset}>
          <Text style={{ color: c.textMuted, fontSize: TYPOGRAPHY.fontSize.xs, textAlign: "right" }}>Limpiar</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {hasValues && (
        <View style={[styles.formCard, { backgroundColor: c.backgroundStrong, borderColor: c.border, gap: SPACING.sm }]}>
          <Text style={[styles.sectionLabel, { color: c.text, textTransform: "none", fontSize: TYPOGRAPHY.fontSize.sm }]}>
            {form.description || "Compra simulada"}
          </Text>

          {simType === "meses" ? (
            <>
              <SimRow label="Mensualidad" value={`$${formatMXN(monthly)}/mes`} c={c} highlight />
              <SimRow label="Costo total" value={`$${formatMXN(totalAmount)}`} c={c} />
              <SimRow label="Duración" value={`${months} ${months === 1 ? "mes" : "meses"}`} c={c} />
              <SimRow
                label="Termina aprox."
                value={finishDate.toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
                c={c}
              />
            </>
          ) : (
            <SimRow label="Pago único" value={`$${formatMXN(totalAmount)}`} c={c} highlight />
          )}

          <View style={[styles.progressBar, { backgroundColor: c.border, marginTop: SPACING.xs }]} />

          <Text style={[styles.sectionLabel, { color: c.textMuted, textTransform: "uppercase", fontSize: TYPOGRAPHY.fontSize.xs }]}>
            Impacto mensual
          </Text>
          <SimRow label="Gastos fijos actuales" value={`$${formatMXN(currentMonthlyTotal)}/mes`} c={c} />
          {simType === "meses" && (
            <SimRow
              label="Con esta compra"
              value={`$${formatMXN(currentMonthlyTotal + monthly)}/mes`}
              c={c}
              highlight
            />
          )}
          {simType === "unico" && (
            <SimRow
              label="Mes de la compra"
              value={`$${formatMXN(currentMonthlyTotal + totalAmount)}`}
              c={c}
              highlight
            />
          )}
        </View>
      )}
    </ScrollView>
  );
}

function SimRow({ label, value, c, highlight }: { label: string; value: string; c: ReturnType<typeof useColors>; highlight?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: c.textMuted }}>{label}</Text>
      <Text style={{ fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: highlight ? "700" : "400", color: highlight ? c.text : c.textMuted }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  subTabBar: { borderBottomWidth: StyleSheet.hairlineWidth },
  subTab: {
    alignItems: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  subTabLabel: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" },
  monthFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  yearSelect: { width: 90, marginBottom: SPACING.sm },
  monthSelect: { flex: 1, marginBottom: SPACING.sm },
  gastosAplicadosBtn: { paddingBottom: SPACING.sm },
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
  progressBar: { height: 4, borderRadius: 2, overflow: "hidden", marginVertical: 2 },
  progressFill: { height: 4, borderRadius: 2 },
  checkBox: { width: 16, height: 16, borderRadius: 3, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
