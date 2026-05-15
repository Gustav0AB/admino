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
import type { VacationDay, VacationPlan, VacationStatus } from "../types";

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

type PlanFormState = {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: string;
  notes: string;
  status: VacationStatus;
};

type DayFormState = {
  date: string;
  activity: string;
  estimatedCost: string;
};

const blankPlanForm = (): PlanFormState => ({
  name: "",
  destination: "",
  startDate: "",
  endDate: "",
  budget: "",
  notes: "",
  status: "planning",
});

const blankDayForm = (): DayFormState => ({ date: "", activity: "", estimatedCost: "" });

export function VacationPlanner() {
  const c = useColors();
  const { vacations, addVacation, updateVacation, removeVacation, addVacationDay, removeVacationDay } =
    usePlanningStore();

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<PlanFormState>(blankPlanForm());

  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [dayTargetVacationId, setDayTargetVacationId] = useState<string | null>(null);
  const [dayForm, setDayForm] = useState<DayFormState>(blankDayForm());

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalBudget = vacations
    .filter((v) => v.status !== "cancelled")
    .reduce((sum, v) => sum + v.budget, 0);

  const totalDaysCost = vacations
    .filter((v) => v.status !== "cancelled")
    .flatMap((v) => v.days)
    .reduce((sum, d) => sum + d.estimatedCost, 0);

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
      startDate: plan.startDate,
      endDate: plan.endDate,
      budget: plan.budget > 0 ? String(plan.budget) : "",
      notes: plan.notes,
      status: plan.status,
    });
    setPlanModalOpen(true);
  };

  const handleSavePlan = () => {
    if (!planForm.name.trim()) return;
    const payload: Omit<VacationPlan, "id" | "days"> = {
      name: planForm.name.trim(),
      destination: planForm.destination.trim(),
      startDate: planForm.startDate.trim(),
      endDate: planForm.endDate.trim(),
      budget: parseFloat(planForm.budget) || 0,
      notes: planForm.notes.trim(),
      status: planForm.status,
    };
    if (editingPlanId) {
      updateVacation(editingPlanId, payload);
    } else {
      addVacation(payload);
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

  return (
    <View style={styles.root}>
      {/* Summary */}
      <View style={[styles.summaryBar, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: c.text }]}>{vacations.length}</Text>
          <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Viajes planeados</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: c.text }]}>
            ${totalBudget.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
          </Text>
          <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Presupuesto total</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: c.text }]}>
            ${totalDaysCost.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
          </Text>
          <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Costo días</Text>
        </View>
      </View>

      {/* Add */}
      <View style={styles.addRow}>
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
            Agrega tu próximas vacaciones y lleva el control de días y gastos
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.list}>
            {vacations.map((plan) => {
              const isExpanded = expandedId === plan.id;
              const days = calcDays(plan.startDate, plan.endDate);
              const daysCost = plan.days.reduce((s, d) => s + d.estimatedCost, 0);

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
                        {plan.destination
                          ? `📍 ${plan.destination}`
                          : "Sin destino"}{" "}
                        {plan.startDate && plan.endDate
                          ? `· ${plan.startDate} → ${plan.endDate}${days ? ` (${days} días)` : ""}`
                          : ""}
                      </Text>
                    </View>
                    <View style={styles.cardHeaderRight}>
                      {plan.budget > 0 && (
                        <Text style={[styles.budgetText, { color: c.text }]}>
                          ${plan.budget.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
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

                      {/* Days */}
                      <View style={styles.daysHeader}>
                        <Text style={[styles.sectionLabel, { color: c.text }]}>
                          Actividades del viaje
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
                            <View
                              key={day.id}
                              style={[styles.dayRow, { borderBottomColor: c.border }]}
                            >
                              <View style={{ flex: 1, gap: 2 }}>
                                <Text style={[styles.dayActivity, { color: c.text }]}>
                                  {day.activity}
                                </Text>
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
                          {plan.days.length > 0 && (
                            <Text style={[styles.daysTotalText, { color: c.textMuted }]}>
                              Total actividades: ${daysCost.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                            </Text>
                          )}
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

      {/* Plan Modal */}
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
            <FormField label="Fecha inicio">
              <StyledInput
                value={planForm.startDate}
                onChangeText={(v) => setPlanField("startDate", v)}
                placeholder="YYYY-MM-DD"
              />
            </FormField>
          </View>
          <View style={{ flex: 1 }}>
            <FormField label="Fecha fin">
              <StyledInput
                value={planForm.endDate}
                onChangeText={(v) => setPlanField("endDate", v)}
                placeholder="YYYY-MM-DD"
              />
            </FormField>
          </View>
        </View>

        <FormField label="Presupuesto ($)">
          <StyledInput
            value={planForm.budget}
            onChangeText={(v) => setPlanField("budget", v)}
            placeholder="0"
            keyboardType="decimal-pad"
          />
        </FormField>

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

        <FormField label="Notas">
          <StyledInput
            value={planForm.notes}
            onChangeText={(v) => setPlanField("notes", v)}
            placeholder="Notas, ideas, requisitos..."
            multiline
          />
        </FormField>
      </CustomModal>

      {/* Day Modal */}
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

  addRow: { alignItems: "flex-start" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: "600" },
  emptyHint: { fontSize: TYPOGRAPHY.fontSize.sm, textAlign: "center", maxWidth: 280 },

  list: { gap: SPACING.sm, paddingBottom: SPACING.lg },

  card: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  cardHeaderLeft: { flex: 1, gap: 4 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  cardTitle: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "700", flex: 1 },
  cardSub: { fontSize: TYPOGRAPHY.fontSize.xs },
  cardHeaderRight: { alignItems: "flex-end", gap: 4 },
  budgetText: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "700" },
  chevron: { fontSize: 10 },

  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },

  cardBody: {
    padding: SPACING.md,
    borderTopWidth: 1,
    gap: SPACING.sm,
  },
  notesText: { fontSize: TYPOGRAPHY.fontSize.sm, fontStyle: "italic" },

  daysHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionLabel: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" },
  noDays: { fontSize: TYPOGRAPHY.fontSize.xs, fontStyle: "italic" },

  daysList: { gap: 0 },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
  },
  dayActivity: { fontSize: TYPOGRAPHY.fontSize.sm },
  daySub: { fontSize: TYPOGRAPHY.fontSize.xs },
  dayRight: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  dayCost: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },
  daysTotalText: { fontSize: TYPOGRAPHY.fontSize.xs, textAlign: "right", marginTop: 4 },

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

  modalFooterRight: { flexDirection: "row", gap: SPACING.sm },
});
