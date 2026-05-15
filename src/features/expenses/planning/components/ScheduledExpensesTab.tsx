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
import { ScheduledCalendar } from "./ScheduledCalendar";
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

const STATUS_COLOR: Record<ScheduledExpenseStatus, string> = {
  pending: "#f59e0b",
  done: "#22c55e",
  cancelled: "#9ca3af",
};

const CATEGORIES: ScheduledExpenseCategory[] = [
  "mechanic", "insurance", "medical", "utilities", "subscription", "other",
];

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

type FormState = {
  title: string;
  scheduledDate: string;
  time: string;
  category: ScheduledExpenseCategory;
  amountKnown: boolean;
  amount: string;
  notes: string;
  status: ScheduledExpenseStatus;
};

const blankForm = (): FormState => ({
  title: "",
  scheduledDate: "",
  time: "",
  category: "other",
  amountKnown: false,
  amount: "",
  notes: "",
  status: "pending",
});

type ViewMode = "list" | "calendar";

export function ScheduledExpensesTab() {
  const c = useColors();
  const { scheduledExpenses, addScheduledExpense, updateScheduledExpense, removeScheduledExpense } =
    usePlanningStore();

  const today = new Date();
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(blankForm());

  // ── Derived data ────────────────────────────────────────────────────────────
  const sorted = [...scheduledExpenses].sort((a, b) => {
    const dateCmp = a.scheduledDate.localeCompare(b.scheduledDate);
    if (dateCmp !== 0) return dateCmp;
    return (a.time ?? "").localeCompare(b.time ?? "");
  });

  const totalKnown = scheduledExpenses
    .filter((e) => e.amountKnown && e.status !== "cancelled")
    .reduce((sum, e) => sum + e.amount, 0);

  const unknownCount = scheduledExpenses.filter(
    (e) => !e.amountKnown && e.status !== "cancelled"
  ).length;

  const monthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
  const monthExpenses = [...scheduledExpenses]
    .filter((e) => e.scheduledDate.startsWith(monthPrefix))
    .sort((a, b) => {
      const dateCmp = a.scheduledDate.localeCompare(b.scheduledDate);
      if (dateCmp !== 0) return dateCmp;
      return (a.time ?? "").localeCompare(b.time ?? "");
    });

  const selectedExpenses = selectedDate
    ? [...scheduledExpenses]
        .filter((e) => e.scheduledDate === selectedDate)
        .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""))
    : [];

  // ── Month nav ───────────────────────────────────────────────────────────────
  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
    setSelectedDate(null);
  };

  // ── Modal helpers ───────────────────────────────────────────────────────────
  const openAdd = (prefillDate?: string) => {
    setEditingId(null);
    setForm({ ...blankForm(), scheduledDate: prefillDate ?? "" });
    setModalOpen(true);
  };

  const openEdit = (expense: ScheduledExpense) => {
    setEditingId(expense.id);
    setForm({
      title: expense.title,
      scheduledDate: expense.scheduledDate,
      time: expense.time ?? "",
      category: expense.category,
      amountKnown: expense.amountKnown,
      amount: expense.amount > 0 ? String(expense.amount) : "",
      notes: expense.notes,
      status: expense.status,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.scheduledDate.trim()) return;
    const trimmedTime = form.time.trim();
    const base = {
      title: form.title.trim(),
      scheduledDate: form.scheduledDate.trim(),
      category: form.category,
      amountKnown: form.amountKnown,
      amount: form.amountKnown ? parseFloat(form.amount) || 0 : 0,
      notes: form.notes.trim(),
      status: form.status,
    };
    const payload = trimmedTime ? { ...base, time: trimmedTime } : base;
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

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderExpenseRow = (exp: ScheduledExpense, showDate = false) => (
    <TouchableOpacity
      key={exp.id}
      style={[
        styles.expRow,
        { borderBottomColor: c.border },
        exp.status === "cancelled" && { opacity: 0.45 },
      ]}
      onPress={() => openEdit(exp)}
      activeOpacity={0.75}
    >
      {/* Time column */}
      <View style={styles.timeCol}>
        {exp.time ? (
          <Text style={[styles.timeText, { color: c.primary }]}>{exp.time}</Text>
        ) : showDate ? (
          <Text style={[styles.dateText, { color: c.textMuted }]}>
            {exp.scheduledDate.slice(5)}
          </Text>
        ) : (
          <Text style={[styles.noTime, { color: c.textPlaceholder }]}>—</Text>
        )}
      </View>

      {/* Icon */}
      <Text style={styles.expIcon}>{CATEGORY_ICONS[exp.category]}</Text>

      {/* Body */}
      <View style={styles.expBody}>
        <Text
          style={[
            styles.expTitle,
            { color: c.text },
            exp.status === "done" && styles.textStrike,
          ]}
          numberOfLines={1}
        >
          {exp.title}
        </Text>
        <Text style={[styles.expSub, { color: c.textMuted }]}>
          {CATEGORY_LABELS[exp.category]}
          {exp.notes ? ` · ${exp.notes}` : ""}
        </Text>
      </View>

      {/* Right: amount + status dot */}
      <View style={styles.expRight}>
        {exp.amountKnown ? (
          <Text style={[styles.expAmount, { color: c.text }]}>
            ${exp.amount.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
          </Text>
        ) : (
          <Text style={[styles.expAmountUnknown, { color: c.textPlaceholder }]}>
            Por definir
          </Text>
        )}
        <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[exp.status] }]} />
      </View>
    </TouchableOpacity>
  );

  // ── Side panel (calendar mode) ───────────────────────────────────────────────
  const renderSidePanel = () => {
    if (selectedDate) {
      // Format display date
      const parts = selectedDate.split("-");
      const mm = parts[1] ?? "01";
      const dd = parts[2] ?? "01";
      const displayDate = `${parseInt(dd)} ${MONTH_NAMES[parseInt(mm) - 1]}`;
      const hasTime = selectedExpenses.some((e) => e.time);

      return (
        <>
          <View style={[styles.sidePanelHeader, { borderBottomColor: c.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sidePanelTitle, { color: c.text }]}>{displayDate}</Text>
              <Text style={[styles.sidePanelSub, { color: c.textMuted }]}>
                {selectedExpenses.length === 0
                  ? "Sin programado"
                  : `${selectedExpenses.length} evento${selectedExpenses.length !== 1 ? "s" : ""}`}
              </Text>
            </View>
            <CustomButton variant="outline" size="sm" onPress={() => openAdd(selectedDate)}>
              + Agregar
            </CustomButton>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.sidePanelScroll}>
            {selectedExpenses.length === 0 ? (
              <View style={styles.sidePanelEmpty}>
                <Text style={[styles.sidePanelEmptyText, { color: c.textPlaceholder }]}>
                  Toca "+ Agregar" para programar algo aquí
                </Text>
              </View>
            ) : (
              <View>
                {hasTime && (
                  <Text style={[styles.sidePanelHint, { color: c.textPlaceholder }]}>
                    Por hora
                  </Text>
                )}
                {selectedExpenses.map((exp) => renderExpenseRow(exp, false))}
              </View>
            )}
          </ScrollView>
        </>
      );
    }

    // No date selected — show month list
    return (
      <>
        <View style={[styles.sidePanelHeader, { borderBottomColor: c.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sidePanelTitle, { color: c.text }]}>
              {MONTH_NAMES[calMonth]}
            </Text>
            <Text style={[styles.sidePanelSub, { color: c.textMuted }]}>
              {monthExpenses.length === 0
                ? "Sin programado"
                : `${monthExpenses.length} evento${monthExpenses.length !== 1 ? "s" : ""}`}
            </Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.sidePanelScroll}>
          {monthExpenses.length === 0 ? (
            <View style={styles.sidePanelEmpty}>
              <Text style={[styles.sidePanelEmptyText, { color: c.textPlaceholder }]}>
                Nada programado este mes. Toca un día para agregar.
              </Text>
            </View>
          ) : (
            <View>
              {monthExpenses.map((exp) => renderExpenseRow(exp, true))}
            </View>
          )}
        </ScrollView>
      </>
    );
  };

  // ── Root render ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* Toolbar */}
      <View style={[styles.toolbar, { borderBottomColor: c.border }]}>
        <View style={[styles.summaryBar, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: c.text }]}>
              ${totalKnown.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
            </Text>
            <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Conocido</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: c.text }]}>{unknownCount}</Text>
            <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Por definir</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: c.text }]}>{scheduledExpenses.length}</Text>
            <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Total</Text>
          </View>
        </View>

        <View style={styles.toolbarActions}>
          <View style={[styles.viewToggle, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
            <TouchableOpacity
              style={[styles.viewToggleBtn, viewMode === "calendar" && { backgroundColor: c.primary }]}
              onPress={() => setViewMode("calendar")}
              activeOpacity={0.7}
            >
              <Text style={[styles.viewToggleBtnText, { color: viewMode === "calendar" ? c.background : c.textMuted }]}>
                📅 Calendario
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleBtn, viewMode === "list" && { backgroundColor: c.primary }]}
              onPress={() => setViewMode("list")}
              activeOpacity={0.7}
            >
              <Text style={[styles.viewToggleBtnText, { color: viewMode === "list" ? c.background : c.textMuted }]}>
                ☰ Lista
              </Text>
            </TouchableOpacity>
          </View>

          <CustomButton variant="primary" size="sm" onPress={() => openAdd()}>
            + Agregar
          </CustomButton>
        </View>
      </View>

      {/* Content */}
      {viewMode === "calendar" ? (
        // 70 / 30 side-by-side layout
        <View style={styles.calendarLayout}>
          {/* Left: calendar (70%) */}
          <ScrollView
            style={styles.calendarPane}
            contentContainerStyle={styles.calendarPaneContent}
            showsVerticalScrollIndicator={false}
          >
            <ScheduledCalendar
              scheduledExpenses={scheduledExpenses}
              year={calYear}
              month={calMonth}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
            />
          </ScrollView>

          {/* Right: side panel (30%) */}
          <View style={[styles.sidePanel, { borderLeftColor: c.border, backgroundColor: c.background }]}>
            {renderSidePanel()}
          </View>
        </View>
      ) : (
        // Flat list
        <ScrollView showsVerticalScrollIndicator={false} style={styles.listScroll}>
          <View style={styles.listWrap}>
            {sorted.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={[styles.emptyText, { color: c.textMuted }]}>Sin gastos programados</Text>
                <Text style={[styles.emptyHint, { color: c.textPlaceholder }]}>
                  Agrega citas al mecánico, pagos de seguro y más
                </Text>
              </View>
            ) : (
              sorted.map((exp) => (
                <TouchableOpacity
                  key={exp.id}
                  style={[
                    styles.card,
                    { backgroundColor: c.backgroundStrong, borderColor: c.border },
                    exp.status === "done" && styles.cardDone,
                    exp.status === "cancelled" && { opacity: 0.5 },
                  ]}
                  onPress={() => openEdit(exp)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.cardIcon}>{CATEGORY_ICONS[exp.category]}</Text>
                  <View style={styles.cardBody}>
                    <View style={styles.cardTitleRow}>
                      <Text
                        style={[
                          styles.cardTitle,
                          { color: c.text },
                          exp.status === "done" && styles.textStrike,
                        ]}
                        numberOfLines={1}
                      >
                        {exp.title}
                      </Text>
                      <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[exp.status] }]} />
                    </View>
                    <Text style={[styles.cardSub, { color: c.textMuted }]}>
                      {CATEGORY_LABELS[exp.category]} · {exp.scheduledDate}
                      {exp.time ? ` · ${exp.time}` : ""}
                    </Text>
                    {exp.notes ? (
                      <Text style={[styles.cardNotes, { color: c.textPlaceholder }]} numberOfLines={1}>
                        {exp.notes}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.cardRight}>
                    {exp.amountKnown ? (
                      <Text style={[styles.cardAmount, { color: c.text }]}>
                        ${exp.amount.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                      </Text>
                    ) : (
                      <Text style={[styles.cardAmountUnknown, { color: c.textPlaceholder }]}>
                        Por definir
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
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
            <View style={styles.footerRight}>
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

        <View style={styles.twoCol}>
          <View style={{ flex: 2 }}>
            <FormField label="Fecha *">
              <StyledInput
                value={form.scheduledDate}
                onChangeText={(v) => setField("scheduledDate", v)}
                placeholder="YYYY-MM-DD"
              />
            </FormField>
          </View>
          <View style={{ flex: 1 }}>
            <FormField label="Hora (opcional)">
              <StyledInput
                value={form.time}
                onChangeText={(v) => setField("time", v)}
                placeholder="14:30"
              />
            </FormField>
          </View>
        </View>

        <FormField label="Categoría">
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.chip,
                  form.category === cat
                    ? { borderColor: c.primary, backgroundColor: c.primary }
                    : { borderColor: c.border, backgroundColor: c.backgroundStrong },
                ]}
                onPress={() => setField("category", cat)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 12 }}>{CATEGORY_ICONS[cat]}</Text>
                <Text style={[styles.chipText, { color: form.category === cat ? c.background : c.text }]}>
                  {CATEGORY_LABELS[cat]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </FormField>

        <FormField label="¿Sabes cuánto costará?">
          <View style={styles.chipRow}>
            {([true, false] as const).map((known) => (
              <TouchableOpacity
                key={String(known)}
                style={[
                  styles.chip,
                  form.amountKnown === known
                    ? { borderColor: c.primary, backgroundColor: c.primary }
                    : { borderColor: c.border, backgroundColor: c.backgroundStrong },
                ]}
                onPress={() => setField("amountKnown", known)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, { color: form.amountKnown === known ? c.background : c.text }]}>
                  {known ? "Monto conocido" : "Por definir"}
                </Text>
              </TouchableOpacity>
            ))}
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

        <FormField label="Estado">
          <View style={styles.chipRow}>
            {(["pending", "done", "cancelled"] as ScheduledExpenseStatus[]).map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.chip,
                  form.status === s
                    ? { borderColor: c.primary, backgroundColor: c.primary }
                    : { borderColor: c.border, backgroundColor: c.backgroundStrong },
                ]}
                onPress={() => setField("status", s)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, { color: form.status === s ? c.background : c.text }]}>
                  {STATUS_LABELS[s]}
                </Text>
              </TouchableOpacity>
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  // ── Toolbar
  toolbar: {
    padding: SPACING.md,
    gap: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryBar: {
    flexDirection: "row",
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  summaryItem: { flex: 1, alignItems: "center", paddingVertical: SPACING.sm, gap: 2 },
  summaryValue: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: "700" },
  summaryLabel: { fontSize: TYPOGRAPHY.fontSize.xs },
  summaryDivider: { width: 1 },
  toolbarActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewToggle: {
    flexDirection: "row",
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  viewToggleBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  viewToggleBtnText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },

  // ── Calendar layout (70 / 30)
  calendarLayout: { flex: 1, flexDirection: "row" },
  calendarPane: { flex: 7 },
  calendarPaneContent: { padding: SPACING.md, paddingBottom: SPACING.lg },
  sidePanel: {
    flex: 3,
    borderLeftWidth: StyleSheet.hairlineWidth,
    flexDirection: "column",
  },
  sidePanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  sidePanelTitle: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "700" },
  sidePanelSub: { fontSize: TYPOGRAPHY.fontSize.xs, marginTop: 2 },
  sidePanelHint: { fontSize: TYPOGRAPHY.fontSize.xs, paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  sidePanelScroll: { flex: 1 },
  sidePanelEmpty: {
    padding: SPACING.md,
    alignItems: "center",
    paddingTop: SPACING.lg,
  },
  sidePanelEmptyText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    textAlign: "center",
    lineHeight: 18,
  },

  // ── Expense row (used in side panel)
  expRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.xs,
  },
  timeCol: { width: 38, alignItems: "center" },
  timeText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "700" },
  dateText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },
  noTime: { fontSize: TYPOGRAPHY.fontSize.xs },
  expIcon: { fontSize: 16 },
  expBody: { flex: 1, gap: 1 },
  expTitle: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },
  textStrike: { textDecorationLine: "line-through" },
  expSub: { fontSize: 10 },
  expRight: { alignItems: "flex-end", gap: 3 },
  expAmount: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "700" },
  expAmountUnknown: { fontSize: 10, fontStyle: "italic" },
  statusDot: { width: 7, height: 7, borderRadius: 4 },

  // ── Flat list
  listScroll: { flex: 1 },
  listWrap: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.lg },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: "600" },
  emptyHint: { fontSize: TYPOGRAPHY.fontSize.sm, textAlign: "center", maxWidth: 260 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  cardDone: { opacity: 0.7 },
  cardIcon: { fontSize: 22, width: 30, textAlign: "center" },
  cardBody: { flex: 1, gap: 2 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardTitle: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600", flex: 1 },
  cardSub: { fontSize: TYPOGRAPHY.fontSize.xs },
  cardNotes: { fontSize: TYPOGRAPHY.fontSize.xs },
  cardRight: { alignItems: "flex-end" },
  cardAmount: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "700" },
  cardAmountUnknown: { fontSize: TYPOGRAPHY.fontSize.xs, fontStyle: "italic" },

  // ── Form
  twoCol: { flexDirection: "row", gap: SPACING.sm },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs },
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
  footerRight: { flexDirection: "row", gap: SPACING.sm },
});
