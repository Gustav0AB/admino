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
import { CalendarPicker } from "@/shared/components/inputs/CalendarPicker";
import { CustomModal } from "@/shared/components/feedback/CustomModal";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { randomUUID } from "expo-crypto";
import { usePlanningStore } from "../store";
import { useExpensesStore } from "@/features/expenses/store";
import { MESES_LIST, currentMonthName } from "@/features/expenses/helpers";
import type { VacationDay, VacationPayment, VacationPlan, VacationStatus, VacationTask } from "../types";

const STATUS_LABELS: Record<VacationStatus, string> = {
  planning: "Planeando",
  confirmed: "Confirmado",
  completed: "Completado",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<VacationStatus, string> = {
  planning: "#3b82f6",
  confirmed: "#22c55e",
  completed: "#6b7280",
  cancelled: "#ef4444",
};

const STATUSES: VacationStatus[] = ["planning", "confirmed", "completed", "cancelled"];

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type PlanFormState = {
  name: string;
  destination: string;
  startDate: Date | null;
  endDate: Date | null;
  notes: string;
  status: VacationStatus;
  persons: string[];
  tasks: VacationTask[];
  payments: VacationPayment[];
  newPerson: string;
  newTask: string;
  newPaymentDescription: string;
  newPaymentAmount: string;
  newPaymentPerPerson: boolean;
  newPaymentTrackInGastos: boolean;
};

type DayFormState = {
  date: string;
  activity: string;
  estimatedCost: string;
};

const blankPlanForm = (): PlanFormState => ({
  name: "",
  destination: "",
  startDate: null,
  endDate: null,
  notes: "",
  status: "planning",
  persons: [],
  tasks: [],
  payments: [],
  newPerson: "",
  newTask: "",
  newPaymentDescription: "",
  newPaymentAmount: "",
  newPaymentPerPerson: false,
  newPaymentTrackInGastos: true,
});

const blankDayForm = (): DayFormState => ({ date: "", activity: "", estimatedCost: "" });

function calcPaymentTotal(payments: VacationPayment[], personCount: number): number {
  return payments
    .filter((p) => !p.done)
    .reduce((sum, p) => sum + p.amount * (p.perPerson ? Math.max(personCount, 1) : 1), 0);
}

export function VacationPlanner() {
  const c = useColors();
  const { vacations, addVacation, updateVacation, removeVacation, addVacationDay, removeVacationDay } =
    usePlanningStore();
  const { addExpenseFromModal } = useExpensesStore();

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<PlanFormState>(blankPlanForm());

  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [dayTargetVacationId, setDayTargetVacationId] = useState<string | null>(null);
  const [dayForm, setDayForm] = useState<DayFormState>(blankDayForm());

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalBudget = vacations
    .filter((v) => v.status !== "cancelled")
    .reduce((sum, v) => {
      const pc = (v.persons ?? []).length;
      return sum + (v.payments ?? []).reduce((s, p) => s + p.amount * (p.perPerson ? Math.max(pc, 1) : 1), 0);
    }, 0);

  const totalPaymentsPending = vacations
    .filter((v) => v.status !== "cancelled")
    .reduce((sum, v) => sum + calcPaymentTotal(v.payments ?? [], v.persons?.length ?? 0), 0);

  // ── Plan modal ───────────────────────────────────────────────────────────────
  const openAddPlan = () => {
    setEditingPlanId(null);
    setPlanForm(blankPlanForm());
    setPlanModalOpen(true);
  };

  const openEditPlan = (plan: VacationPlan) => {
    setEditingPlanId(plan.id);
    setPlanForm({
      name: plan.name,
      destination: plan.destination,
      startDate: plan.startDate ? new Date(plan.startDate + "T12:00:00") : null,
      endDate: plan.endDate ? new Date(plan.endDate + "T12:00:00") : null,
      notes: plan.notes,
      status: plan.status,
      persons: plan.persons ?? [],
      tasks: plan.tasks ?? [],
      payments: plan.payments ?? [],
      newPerson: "",
      newTask: "",
      newPaymentDescription: "",
      newPaymentAmount: "",
      newPaymentPerPerson: false,
      newPaymentTrackInGastos: true,
    });
    setPlanModalOpen(true);
  };

  const handleSavePlan = () => {
    if (!planForm.name.trim()) return;
    const startDateStr = planForm.startDate ? formatDateStr(planForm.startDate) : "";
    const payload: Omit<VacationPlan, "id" | "days"> = {
      name: planForm.name.trim(),
      destination: planForm.destination.trim(),
      startDate: startDateStr,
      endDate: planForm.endDate ? formatDateStr(planForm.endDate) : "",
      notes: planForm.notes.trim(),
      status: planForm.status,
      persons: planForm.persons,
      tasks: planForm.tasks,
      payments: planForm.payments,
    };

    const prevStatus = editingPlanId ? vacations.find((v) => v.id === editingPlanId)?.status : undefined;
    const justConfirmed = planForm.status === "confirmed" && prevStatus !== "confirmed";

    if (editingPlanId) {
      updateVacation(editingPlanId, payload);
    } else {
      addVacation(payload);
    }

    // When newly confirmed, push all already-done trackInGastos payments to gastos
    if (justConfirmed) {
      const startMes = planForm.startDate
        ? MESES_LIST[planForm.startDate.getMonth()] ?? currentMonthName()
        : currentMonthName();
      const startDay = planForm.startDate ? planForm.startDate.getDate() : 1;
      const personCount = planForm.persons.length;
      for (const p of planForm.payments) {
        if (p.done && p.trackInGastos !== false) {
          addExpenseFromModal({
            mes: startMes,
            gastos: p.description,
            monto: p.amount * (p.perPerson ? Math.max(personCount, 1) : 1),
            metodoPago: "efectivo",
            frecuencia: "unico",
            fecha: startDay,
            fechaMaxima: "",
            estado: "pagado",
          });
        }
      }
    }

    setPlanModalOpen(false);
  };

  const handleDeletePlan = () => {
    if (editingPlanId) {
      removeVacation(editingPlanId);
      setPlanModalOpen(false);
    }
  };

  const setPlanField = <K extends keyof PlanFormState>(key: K, value: PlanFormState[K]) =>
    setPlanForm((f) => ({ ...f, [key]: value }));

  // ── Persons helpers ──────────────────────────────────────────────────────────
  const handleAddPerson = () => {
    const p = planForm.newPerson.trim();
    if (!p || planForm.persons.includes(p)) return;
    setPlanForm((f) => ({ ...f, persons: [...f.persons, p], newPerson: "" }));
  };

  const handleRemovePerson = (person: string) =>
    setPlanForm((f) => ({ ...f, persons: f.persons.filter((p) => p !== person) }));

  // ── Tasks helpers ────────────────────────────────────────────────────────────
  const handleAddTask = () => {
    const task = planForm.newTask.trim();
    if (!task) return;
    setPlanForm((f) => ({
      ...f,
      tasks: [...f.tasks, { id: randomUUID(), task, done: false }],
      newTask: "",
    }));
  };

  const handleToggleTask = (id: string) =>
    setPlanForm((f) => ({
      ...f,
      tasks: f.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));

  const handleRemoveTask = (id: string) =>
    setPlanForm((f) => ({ ...f, tasks: f.tasks.filter((t) => t.id !== id) }));

  // ── Payments helpers ─────────────────────────────────────────────────────────
  const handleAddPayment = () => {
    const desc = planForm.newPaymentDescription.trim();
    if (!desc) return;
    const amount = parseFloat(planForm.newPaymentAmount) || 0;
    setPlanForm((f) => ({
      ...f,
      payments: [
        ...f.payments,
        {
          id: randomUUID(),
          description: desc,
          amount,
          perPerson: f.newPaymentPerPerson,
          done: false,
          trackInGastos: f.newPaymentTrackInGastos,
        },
      ],
      newPaymentDescription: "",
      newPaymentAmount: "",
      newPaymentPerPerson: false,
      newPaymentTrackInGastos: true,
    }));
  };

  const handleTogglePayment = (id: string) =>
    setPlanForm((f) => ({
      ...f,
      payments: f.payments.map((p) => (p.id === id ? { ...p, done: !p.done } : p)),
    }));

  const handleRemovePayment = (id: string) =>
    setPlanForm((f) => ({ ...f, payments: f.payments.filter((p) => p.id !== id) }));

  // ── Day modal ────────────────────────────────────────────────────────────────
  const openAddDay = (vacationId: string) => {
    setDayTargetVacationId(vacationId);
    setDayForm(blankDayForm());
    setDayModalOpen(true);
  };

  const handleSaveDay = () => {
    if (!dayTargetVacationId || !dayForm.activity.trim()) return;
    addVacationDay(dayTargetVacationId, {
      date: dayForm.date.trim(),
      activity: dayForm.activity.trim(),
      estimatedCost: parseFloat(dayForm.estimatedCost) || 0,
    });
    setDayModalOpen(false);
  };

  const setDayField = <K extends keyof DayFormState>(key: K, value: DayFormState[K]) =>
    setDayForm((f) => ({ ...f, [key]: value }));

  const calcDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
    const diff = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
    return diff > 0 ? diff : null;
  };

  // ── Form payment total (for modal preview) ───────────────────────────────────
  const formPaymentTotal = calcPaymentTotal(planForm.payments, planForm.persons.length);
  const formPaymentDoneTotal = planForm.payments
    .filter((p) => p.done)
    .reduce((sum, p) => sum + p.amount * (p.perPerson ? Math.max(planForm.persons.length, 1) : 1), 0);

  return (
    <View style={styles.root}>
      {/* Summary */}
      <View style={[styles.summaryBar, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: c.text }]}>{vacations.length}</Text>
          <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Viajes</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: c.text }]}>
            ${totalBudget.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
          </Text>
          <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Presupuesto</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: c.text }]}>
            ${totalPaymentsPending.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
          </Text>
          <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Por pagar</Text>
        </View>
      </View>

      {/* Add */}
      <View style={styles.addViajeRow}>
        <CustomButton variant="primary" size="sm" onPress={openAddPlan}>
          + Agregar viaje
        </CustomButton>
      </View>

      {/* List */}
      {vacations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>✈️</Text>
          <Text style={[styles.emptyText, { color: c.textMuted }]}>No hay viajes planeados</Text>
          <Text style={[styles.emptyHint, { color: c.textPlaceholder }]}>
            Agrega tus próximas vacaciones y lleva el control de tareas y pagos
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.list}>
            {vacations.map((plan) => {
              const isExpanded = expandedId === plan.id;
              const days = calcDays(plan.startDate, plan.endDate);
              const personCount = (plan.persons ?? []).length;
              const pendingPaymentTotal = calcPaymentTotal(plan.payments ?? [], personCount);
              const donePaymentTotal = (plan.payments ?? [])
                .filter((p) => p.done)
                .reduce((sum, p) => sum + p.amount * (p.perPerson ? Math.max(personCount, 1) : 1), 0);
              const tasksDone = (plan.tasks ?? []).filter((t) => t.done).length;
              const tasksTotal = (plan.tasks ?? []).length;

              return (
                <View
                  key={plan.id}
                  style={[styles.card, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}
                >
                  {/* Card header */}
                  <TouchableOpacity
                    style={styles.cardHeader}
                    onPress={() => setExpandedId(isExpanded ? null : plan.id)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.cardTitleRow}>
                        <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>
                          {plan.name}
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: STATUS_COLORS[plan.status] + "22", borderColor: STATUS_COLORS[plan.status] + "55" },
                          ]}
                        >
                          <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[plan.status] }]}>
                            {STATUS_LABELS[plan.status]}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.cardSub, { color: c.textMuted }]}>
                        {plan.destination ? `📍 ${plan.destination}` : "Sin destino"}
                        {plan.startDate && plan.endDate
                          ? ` · ${plan.startDate} → ${plan.endDate}${days ? ` (${days} días)` : ""}`
                          : ""}
                        {personCount > 0 ? ` · 👥 ${personCount}` : ""}
                      </Text>
                    </View>
                    <View style={styles.cardHeaderRight}>
                      {pendingPaymentTotal > 0 && (
                        <Text style={[styles.budgetText, { color: c.text }]}>
                          ${pendingPaymentTotal.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                        </Text>
                      )}
                      {tasksTotal > 0 && (
                        <Text style={[styles.progressText, { color: c.textMuted }]}>
                          ✅ {tasksDone}/{tasksTotal}
                        </Text>
                      )}
                      <Text style={[styles.chevron, { color: c.textMuted }]}>
                        {isExpanded ? "▲" : "▼"}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Expanded body */}
                  {isExpanded && (
                    <View style={[styles.cardBody, { borderTopColor: c.border }]}>
                      {plan.notes ? (
                        <Text style={[styles.notesText, { color: c.textMuted }]}>{plan.notes}</Text>
                      ) : null}

                      {/* Persons */}
                      {personCount > 0 && (
                        <View>
                          <Text style={[styles.sectionLabel, { color: c.text, marginBottom: 4 }]}>
                            👥 Personas ({personCount})
                          </Text>
                          <View style={styles.tagRow}>
                            {plan.persons.map((p) => (
                              <View key={p} style={[styles.tag, { backgroundColor: c.background, borderColor: c.border }]}>
                                <Text style={[styles.tagText, { color: c.text }]}>{p}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Tasks checklist */}
                      {tasksTotal > 0 && (
                        <View>
                          <View style={styles.sectionHeaderRow}>
                            <Text style={[styles.sectionLabel, { color: c.text }]}>📋 Por hacer</Text>
                            <Text style={[styles.sectionMeta, { color: c.textMuted }]}>
                              {tasksDone}/{tasksTotal}
                            </Text>
                          </View>
                          {plan.tasks.map((t) => (
                            <TouchableOpacity
                              key={t.id}
                              style={[styles.checkRow, { borderBottomColor: c.border }]}
                              onPress={() => {
                                const updated = plan.tasks.map((x) =>
                                  x.id === t.id ? { ...x, done: !x.done } : x
                                );
                                updateVacation(plan.id, { tasks: updated });
                              }}
                              activeOpacity={0.75}
                            >
                              <View style={[styles.checkBox, { borderColor: t.done ? c.primary : c.border, backgroundColor: t.done ? c.primary : "transparent" }]}>
                                {t.done && <Text style={{ color: c.background, fontSize: 10 }}>✓</Text>}
                              </View>
                              <Text style={[styles.checkText, { color: t.done ? c.textMuted : c.text, textDecorationLine: t.done ? "line-through" : "none" }]}>
                                {t.task}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                      {/* Payments checklist */}
                      {(plan.payments ?? []).length > 0 && (
                        <View>
                          <View style={styles.sectionHeaderRow}>
                            <Text style={[styles.sectionLabel, { color: c.text }]}>💳 Por pagar</Text>
                            <Text style={[styles.sectionMeta, { color: c.textMuted }]}>
                              Pagado: ${donePaymentTotal.toLocaleString("es-MX")}
                            </Text>
                          </View>
                          {plan.payments.map((p) => {
                            const itemTotal = p.amount * (p.perPerson ? Math.max(personCount, 1) : 1);
                            return (
                              <TouchableOpacity
                                key={p.id}
                                style={[styles.paymentRow, { borderBottomColor: c.border }, p.done && styles.rowDone]}
                                onPress={() => {
                                  const isMarkingDone = !p.done;
                                  const updated = plan.payments.map((x) =>
                                    x.id === p.id ? { ...x, done: !x.done } : x
                                  );
                                  updateVacation(plan.id, { payments: updated });
                                  if (isMarkingDone && plan.status === "confirmed" && p.trackInGastos !== false) {
                                    const startMes = plan.startDate
                                      ? MESES_LIST[new Date(plan.startDate + "T12:00:00").getMonth()] ?? currentMonthName()
                                      : currentMonthName();
                                    const startDay = plan.startDate ? new Date(plan.startDate + "T12:00:00").getDate() : 1;
                                    addExpenseFromModal({
                                      mes: startMes,
                                      gastos: p.description,
                                      monto: itemTotal,
                                      metodoPago: "efectivo",
                                      frecuencia: "unico",
                                      fecha: startDay,
                                      fechaMaxima: "",
                                      estado: "pagado",
                                    });
                                  }
                                }}
                                activeOpacity={0.75}
                              >
                                <View style={[styles.checkBox, { borderColor: p.done ? "#16A34A" : c.border, backgroundColor: p.done ? "#16A34A" : "transparent" }]}>
                                  {p.done && <Text style={{ color: "#fff", fontSize: 10 }}>✓</Text>}
                                </View>
                                <View style={{ flex: 1 }}>
                                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                    <Text style={[styles.checkText, { color: p.done ? c.textMuted : c.text, textDecorationLine: p.done ? "line-through" : "none" }]}>
                                      {p.description}
                                    </Text>
                                    {p.trackInGastos === false && (
                                      <Text style={{ fontSize: 10, color: c.textMuted }}>📋</Text>
                                    )}
                                  </View>
                                  {p.perPerson && personCount > 0 && (
                                    <Text style={[styles.paymentSub, { color: c.textMuted }]}>
                                      ${p.amount.toLocaleString("es-MX")} × {personCount} personas
                                    </Text>
                                  )}
                                </View>
                                <Text style={[styles.paymentAmount, { color: p.done ? c.textMuted : c.text }]}>
                                  ${itemTotal.toLocaleString("es-MX")}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                          <View style={[styles.paymentTotal, { borderTopColor: c.border }]}>
                            <Text style={[styles.paymentTotalLabel, { color: c.textMuted }]}>Por pagar</Text>
                            <Text style={[styles.paymentTotalAmount, { color: c.text }]}>
                              ${pendingPaymentTotal.toLocaleString("es-MX")}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Days */}
                      <View style={styles.sectionHeaderRow}>
                        <Text style={[styles.sectionLabel, { color: c.text }]}>
                          🗓 Actividades del viaje
                        </Text>
                        <CustomButton variant="outline" size="sm" onPress={() => openAddDay(plan.id)}>
                          + Día
                        </CustomButton>
                      </View>

                      {plan.days.length === 0 ? (
                        <Text style={[styles.noDays, { color: c.textPlaceholder }]}>
                          Sin actividades. Toca "+ Día" para agregar.
                        </Text>
                      ) : (
                        <View style={styles.daysList}>
                          {plan.days.map((day) => (
                            <View key={day.id} style={[styles.dayRow, { borderBottomColor: c.border }]}>
                              <View style={{ flex: 1, gap: 2 }}>
                                <Text style={[styles.dayActivity, { color: c.text }]}>{day.activity}</Text>
                                {day.date ? (
                                  <Text style={[styles.daySub, { color: c.textMuted }]}>{day.date}</Text>
                                ) : null}
                              </View>
                              <View style={styles.dayRight}>
                                {day.estimatedCost > 0 && (
                                  <Text style={[styles.dayCost, { color: c.text }]}>
                                    ${day.estimatedCost.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                                  </Text>
                                )}
                                <TouchableOpacity
                                  onPress={() => removeVacationDay(plan.id, day.id)}
                                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                  <Text style={{ color: c.textPlaceholder, fontSize: 14 }}>✕</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Edit button */}
                      <View style={{ alignItems: "flex-end", marginTop: SPACING.sm }}>
                        <CustomButton variant="secondary" size="sm" onPress={() => openEditPlan(plan)}>
                          Editar viaje
                        </CustomButton>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* ── Plan Modal ──────────────────────────────────────────────────────────── */}
      <CustomModal
        open={planModalOpen}
        onOpenChange={setPlanModalOpen}
        title={editingPlanId ? "Editar viaje" : "Nuevo viaje"}
        size="md"
        footer={
          <>
            <View style={{ flex: 1 }}>
              {editingPlanId && (
                <CustomButton variant="outline" size="sm" onPress={handleDeletePlan}>
                  Eliminar
                </CustomButton>
              )}
            </View>
            <View style={styles.modalFooterRight}>
              <CustomButton variant="outline" size="sm" onPress={() => setPlanModalOpen(false)}>
                Cancelar
              </CustomButton>
              <CustomButton variant="primary" size="sm" onPress={handleSavePlan}>
                {editingPlanId ? "Guardar" : "Agregar"}
              </CustomButton>
            </View>
          </>
        }
      >
        {/* Basic info */}
        <FormField label="Nombre del viaje *">
          <StyledInput
            value={planForm.name}
            onChangeText={(v) => setPlanField("name", v)}
            placeholder="Ej: Cancún 2025"
          />
        </FormField>

        <FormField label="Destino">
          <StyledInput
            value={planForm.destination}
            onChangeText={(v) => setPlanField("destination", v)}
            placeholder="Ciudad o país"
          />
        </FormField>

        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <CalendarPicker
              label="Fecha inicio"
              value={planForm.startDate}
              onChange={(d) => setPlanField("startDate", d)}
              placeholder="Seleccionar"
            />
          </View>
          <View style={{ flex: 1 }}>
            <CalendarPicker
              label="Fecha fin"
              value={planForm.endDate}
              onChange={(d) => setPlanField("endDate", d)}
              placeholder="Seleccionar"
              minimumDate={planForm.startDate ?? undefined}
            />
          </View>
        </View>

        <FormField label="Estado">
          <View style={styles.chipRow}>
            {STATUSES.map((s) => (
              <ToggleChip
                key={s}
                label={STATUS_LABELS[s]}
                active={planForm.status === s}
                color={STATUS_COLORS[s]}
                onPress={() => setPlanField("status", s)}
              />
            ))}
          </View>
        </FormField>

        {/* Personas */}
        <FormField label="👥 Personas">
          <View style={styles.inlineAddRow}>
            <StyledInput
              value={planForm.newPerson}
              onChangeText={(v) => setPlanField("newPerson", v)}
              placeholder="Nombre"
              style={{ flex: 1 }}
              onSubmitEditing={handleAddPerson}
              returnKeyType="done"
            />
            <CustomButton variant="outline" size="sm" onPress={handleAddPerson}>
              + Agregar
            </CustomButton>
          </View>
          {planForm.persons.length > 0 && (
            <View style={styles.tagRow}>
              {planForm.persons.map((p) => (
                <View key={p} style={[styles.tag, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
                  <Text style={[styles.tagText, { color: c.text }]}>{p}</Text>
                  <TouchableOpacity onPress={() => handleRemovePerson(p)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Text style={{ color: c.textPlaceholder, fontSize: 12 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </FormField>

        {/* Tasks checklist */}
        <FormField label="📋 Por hacer">
          <View style={styles.inlineAddRow}>
            <StyledInput
              value={planForm.newTask}
              onChangeText={(v) => setPlanField("newTask", v)}
              placeholder="Ej: Reservar hotel, Pasaportes..."
              style={{ flex: 1 }}
              onSubmitEditing={handleAddTask}
              returnKeyType="done"
            />
            <CustomButton variant="outline" size="sm" onPress={handleAddTask}>
              + Agregar
            </CustomButton>
          </View>
          {planForm.tasks.length > 0 && (
            <View style={styles.checkList}>
              {planForm.tasks.map((t) => (
                <View key={t.id} style={[styles.checkRow, { borderBottomColor: c.border }]}>
                  <TouchableOpacity onPress={() => handleToggleTask(t.id)} style={styles.checkRowLeft}>
                    <View style={[styles.checkBox, { borderColor: t.done ? c.primary : c.border, backgroundColor: t.done ? c.primary : "transparent" }]}>
                      {t.done && <Text style={{ color: c.background, fontSize: 10 }}>✓</Text>}
                    </View>
                    <Text style={[styles.checkText, { color: t.done ? c.textMuted : c.text, textDecorationLine: t.done ? "line-through" : "none" }]}>
                      {t.task}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRemoveTask(t.id)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Text style={{ color: c.textPlaceholder, fontSize: 12 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </FormField>

        {/* Payments checklist */}
        <FormField label="💳 Por pagar">
          <View style={styles.paymentAddBlock}>
            <View style={styles.inlineAddRow}>
              <StyledInput
                value={planForm.newPaymentDescription}
                onChangeText={(v) => setPlanField("newPaymentDescription", v)}
                placeholder="Ej: Boletos de avión"
                style={{ flex: 2 }}
              />
              <StyledInput
                value={planForm.newPaymentAmount}
                onChangeText={(v) => setPlanField("newPaymentAmount", v)}
                placeholder="$0"
                keyboardType="decimal-pad"
                style={{ flex: 1 }}
              />
            </View>
            <View style={styles.inlineAddRow}>
              <TouchableOpacity
                style={[styles.perPersonChip, { borderColor: planForm.newPaymentPerPerson ? c.primary : c.border, backgroundColor: planForm.newPaymentPerPerson ? c.primary + "22" : "transparent" }]}
                onPress={() => setPlanField("newPaymentPerPerson", !planForm.newPaymentPerPerson)}
                activeOpacity={0.7}
              >
                <Text style={[styles.perPersonText, { color: planForm.newPaymentPerPerson ? c.primary : c.textMuted }]}>
                  👤 Por persona {planForm.newPaymentPerPerson && planForm.persons.length > 0 ? `(×${planForm.persons.length})` : ""}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.perPersonChip, { borderColor: planForm.newPaymentTrackInGastos ? "#16A34A" : c.border, backgroundColor: planForm.newPaymentTrackInGastos ? "#16A34A22" : "transparent" }]}
                onPress={() => setPlanField("newPaymentTrackInGastos", !planForm.newPaymentTrackInGastos)}
                activeOpacity={0.7}
              >
                <Text style={[styles.perPersonText, { color: planForm.newPaymentTrackInGastos ? "#16A34A" : c.textMuted }]}>
                  {planForm.newPaymentTrackInGastos ? "✓ En gastos" : "Solo planeación"}
                </Text>
              </TouchableOpacity>
              <CustomButton variant="outline" size="sm" onPress={handleAddPayment}>
                + Agregar
              </CustomButton>
            </View>
          </View>

          {planForm.payments.length > 0 && (
            <View style={styles.checkList}>
              {planForm.payments.map((p) => {
                const perCount = planForm.persons.length;
                const itemTotal = p.amount * (p.perPerson ? Math.max(perCount, 1) : 1);
                return (
                  <View key={p.id} style={[styles.paymentRow, { borderBottomColor: c.border }]}>
                    <TouchableOpacity onPress={() => handleTogglePayment(p.id)} style={styles.checkRowLeft}>
                      <View style={[styles.checkBox, { borderColor: p.done ? "#16A34A" : c.border, backgroundColor: p.done ? "#16A34A" : "transparent" }]}>
                        {p.done && <Text style={{ color: "#fff", fontSize: 10 }}>✓</Text>}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Text style={[styles.checkText, { color: p.done ? c.textMuted : c.text, textDecorationLine: p.done ? "line-through" : "none" }]}>
                            {p.description}
                          </Text>
                          {p.trackInGastos === false && (
                            <Text style={{ fontSize: 9, color: c.textMuted, fontStyle: "italic" }}>solo plan</Text>
                          )}
                        </View>
                        {p.perPerson && perCount > 0 && (
                          <Text style={[styles.paymentSub, { color: c.textMuted }]}>
                            ${p.amount.toLocaleString("es-MX")} × {perCount}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                    <Text style={[styles.paymentAmount, { color: p.done ? c.textMuted : c.text }]}>
                      ${itemTotal.toLocaleString("es-MX")}
                    </Text>
                    <TouchableOpacity onPress={() => handleRemovePayment(p.id)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Text style={{ color: c.textPlaceholder, fontSize: 12 }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
              <View style={[styles.paymentTotal, { borderTopColor: c.border }]}>
                <Text style={[styles.paymentTotalLabel, { color: c.textMuted }]}>
                  Pagado: ${formPaymentDoneTotal.toLocaleString("es-MX")} · Pendiente:
                </Text>
                <Text style={[styles.paymentTotalAmount, { color: c.text }]}>
                  ${formPaymentTotal.toLocaleString("es-MX")}
                </Text>
              </View>
            </View>
          )}
        </FormField>

        <FormField label="Notas">
          <StyledInput
            value={planForm.notes}
            onChangeText={(v) => setPlanField("notes", v)}
            placeholder="Notas, ideas, requisitos..."
            multiline
          />
        </FormField>
      </CustomModal>

      {/* ── Day Modal ───────────────────────────────────────────────────────────── */}
      <CustomModal
        open={dayModalOpen}
        onOpenChange={setDayModalOpen}
        title="Agregar actividad"
        size="sm"
        footer={
          <View style={[styles.modalFooterRight, { justifyContent: "flex-end", flex: 1 }]}>
            <CustomButton variant="outline" size="sm" onPress={() => setDayModalOpen(false)}>
              Cancelar
            </CustomButton>
            <CustomButton variant="primary" size="sm" onPress={handleSaveDay}>
              Agregar
            </CustomButton>
          </View>
        }
      >
        <FormField label="Actividad *">
          <StyledInput
            value={dayForm.activity}
            onChangeText={(v) => setDayField("activity", v)}
            placeholder="Ej: Visita a la playa, Cena en restaurante"
          />
        </FormField>
        <FormField label="Fecha">
          <StyledInput
            value={dayForm.date}
            onChangeText={(v) => setDayField("date", v)}
            placeholder="YYYY-MM-DD"
          />
        </FormField>
        <FormField label="Costo estimado ($)">
          <StyledInput
            value={dayForm.estimatedCost}
            onChangeText={(v) => setDayField("estimatedCost", v)}
            placeholder="0"
            keyboardType="decimal-pad"
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

function StyledInput(props: React.ComponentProps<typeof TextInput> & { style?: object }) {
  const c = useColors();
  return (
    <TextInput
      style={[
        styles.input,
        { color: c.text, borderColor: c.border, backgroundColor: c.backgroundStrong },
        props.multiline && { minHeight: 72, textAlignVertical: "top" },
        props.style,
      ]}
      placeholderTextColor={c.textPlaceholder}
      {...props}
    />
  );
}

function ToggleChip({
  label, active, onPress, color,
}: { label: string; active: boolean; onPress: () => void; color?: string }) {
  const c = useColors();
  const bg = color ? color + "22" : c.primary;
  const border = color ? color + "55" : c.primary;
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        active
          ? { borderColor: border, backgroundColor: bg }
          : { borderColor: c.border, backgroundColor: c.backgroundStrong },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, { color: active ? (color ?? c.primary) : c.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, padding: SPACING.md, gap: SPACING.md },

  summaryBar: {
    flexDirection: "row",
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  summaryItem: { flex: 1, alignItems: "center", paddingVertical: SPACING.sm, gap: 2 },
  summaryValue: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: "700" },
  summaryLabel: { fontSize: TYPOGRAPHY.fontSize.xs, textAlign: "center" },
  summaryDivider: { width: 1 },

  addViajeRow: { alignItems: "flex-start" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: "600" },
  emptyHint: { fontSize: TYPOGRAPHY.fontSize.sm, textAlign: "center", maxWidth: 280 },

  list: { gap: SPACING.sm, paddingBottom: SPACING.lg },

  card: { borderRadius: BORDER_RADIUS.md, borderWidth: 1, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: SPACING.md, gap: SPACING.sm },
  cardHeaderLeft: { flex: 1, gap: 4 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  cardTitle: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "700", flex: 1 },
  cardSub: { fontSize: TYPOGRAPHY.fontSize.xs },
  cardHeaderRight: { alignItems: "flex-end", gap: 4 },
  budgetText: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "700" },
  progressText: { fontSize: TYPOGRAPHY.fontSize.xs },
  chevron: { fontSize: 10 },

  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },

  cardBody: { padding: SPACING.md, borderTopWidth: 1, gap: SPACING.sm },
  notesText: { fontSize: TYPOGRAPHY.fontSize.sm, fontStyle: "italic" },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sectionLabel: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" },
  sectionMeta: { fontSize: TYPOGRAPHY.fontSize.xs },

  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  tagText: { fontSize: TYPOGRAPHY.fontSize.xs },

  checkList: { gap: 0 },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  checkRowLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  checkBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: { flex: 1, fontSize: TYPOGRAPHY.fontSize.sm },
  rowDone: { opacity: 0.6 },

  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  paymentSub: { fontSize: TYPOGRAPHY.fontSize.xs },
  paymentAmount: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600", minWidth: 60, textAlign: "right" },
  paymentTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: SPACING.xs,
  },
  paymentTotalLabel: { fontSize: TYPOGRAPHY.fontSize.xs },
  paymentTotalAmount: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "700" },

  noDays: { fontSize: TYPOGRAPHY.fontSize.xs, fontStyle: "italic" },
  daysList: { gap: 0 },
  dayRow: { flexDirection: "row", alignItems: "center", paddingVertical: SPACING.xs, borderBottomWidth: 1 },
  dayActivity: { fontSize: TYPOGRAPHY.fontSize.sm },
  daySub: { fontSize: TYPOGRAPHY.fontSize.xs },
  dayRight: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  dayCost: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },

  // Form
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  twoCol: { flexDirection: "row", gap: SPACING.sm },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs },
  chip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  chipText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "500" },

  inlineAddRow: { flexDirection: "row", gap: SPACING.xs, alignItems: "center" },
  paymentAddBlock: { gap: SPACING.xs },
  perPersonChip: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  perPersonText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "500" },

  modalFooterRight: { flexDirection: "row", gap: SPACING.sm },
});
