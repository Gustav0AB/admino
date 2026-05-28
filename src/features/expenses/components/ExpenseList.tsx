import { useMemo, useState } from "react";
import {
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { CustomSelect } from "@/shared/components/inputs/CustomSelect";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { CustomModal } from "@/shared/components/feedback/CustomModal";
import { TableShell } from "@/shared/components/data-display/TableShell";
import { tableStyles } from "@/shared/components/data-display/tableStyles";
import { useColors } from "@/shared/hooks/useColors";
import {
  BORDER_RADIUS,
  BREAKPOINTS,
  SPACING,
  TYPOGRAPHY,
} from "@/shared/theme/tokens";
import { useExpensesStore } from "../store";
import { getFilteredExpenses, MESES_LIST, formatMXN } from "../helpers";
import { ExpenseRow } from "./ExpenseRow";
import { ExpenseModal } from "./ExpenseModal";
import { UpcomingSection } from "./UpcomingSection";
import type { Estado, Expense } from "../types";
import type { ScheduledExpense } from "@/features/expenses/planning/types";

const ESTADO_OPTIONS: { label: string; value: Estado }[] = [
  { label: "Pagado", value: "pagado" },
  { label: "No pagado", value: "no pagado" },
  { label: "Guardado", value: "guardado" },
  { label: "No guardado", value: "no guardado" },
];

const COLUMN_HEADERS = [
  "",
  "Mes",
  "Descripción",
  "Monto",
  "Método",
  "Frec.",
  "Fecha",
  "Nota",
  "Estado",
  "",
];

type SectionData = { title: string; data: Expense[]; total: number };

export function ExpenseList() {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isMobile = width < BREAKPOINTS.tablet;

  const {
    expenses,
    filterMes,
    filterFrecuencia,
    filterFecha,
    selectAll,
    bulkAddExpenses,
    bulkUpdateEstado,
    bulkDuplicateExpenses,
    duplicateExpense,
    removeExpense,
    addExpenseFromModal,
    updateExpenseFromModal,
  } = useExpensesStore();

  const filtered = useMemo(
    () =>
      getFilteredExpenses(expenses, filterMes, filterFrecuencia, filterFecha),
    [expenses, filterMes, filterFrecuencia, filterFecha],
  );

  const selected = filtered.filter((e) => e.selected);
  const allSelected =
    filtered.length > 0 && selected.length === filtered.length;

  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkEstado, setBulkEstado] = useState<Estado>("pagado");
  const [bulkMeses, setBulkMeses] = useState<string[]>([]);
  const [showBulkDup, setShowBulkDup] = useState(false);
  const [dense, setDense] = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteConfirmExpense, setDeleteConfirmExpense] = useState<Expense | null>(null);

  const handleBulkAdd = () => {
    const mes =
      filterMes !== "Todos"
        ? filterMes
        : (MESES_LIST[new Date().getMonth()] ?? MESES_LIST[0]!);
    bulkAddExpenses(bulkText, mes);
    setBulkText("");
    setShowBulkAdd(false);
  };

  const toggleBulkMes = (mes: string) => {
    setBulkMeses((prev) =>
      prev.includes(mes) ? prev.filter((m) => m !== mes) : [...prev, mes],
    );
  };

  const handleBulkDuplicate = () => {
    if (bulkMeses.length > 0) bulkDuplicateExpenses(bulkMeses);
    setShowBulkDup(false);
    setBulkMeses([]);
  };

  const statusBarData = useMemo(() => {
    const pagado = filtered
      .filter((e) => e.estado === "pagado" && e.monto > 0)
      .reduce((s, e) => s + e.monto, 0);
    const sinPagar = filtered
      .filter(
        (e) =>
          (e.estado === "no pagado" || e.estado === "no guardado") &&
          e.monto > 0,
      )
      .reduce((s, e) => s + e.monto, 0);
    const guardado = filtered
      .filter((e) => e.estado === "guardado" && e.monto > 0)
      .reduce((s, e) => s + e.monto, 0);
    const total = pagado + sinPagar + guardado;
    return { pagado, sinPagar, guardado, total };
  }, [filtered]);

  const groupedSections = useMemo<SectionData[]>(() => {
    if (filterMes !== "Todos") return [];
    const map = new Map<string, Expense[]>();
    for (const e of filtered) {
      const arr = map.get(e.mes) ?? [];
      arr.push(e);
      map.set(e.mes, arr);
    }
    return MESES_LIST.filter((m) => map.has(m)).map((m) => {
      const items = map.get(m)!;
      return {
        title: m,
        data: items,
        total: items.reduce((s, e) => s + e.monto, 0),
      };
    });
  }, [filtered, filterMes]);

  const toolbar = (
    <>
      <View style={tableStyles.toolbarLeft}>
        <TouchableOpacity onPress={() => selectAll(!allSelected)}>
          <View
            style={[
              tableStyles.checkbox,
              {
                borderColor: c.border,
                backgroundColor: allSelected ? c.primary : "transparent",
              },
            ]}
          >
            {allSelected && (
              <Text
                style={[tableStyles.checkMark, { color: c.primaryForeground }]}
              >
                ✓
              </Text>
            )}
          </View>
        </TouchableOpacity>
        <CustomButton variant="primary" size="sm" onPress={() => setAddModalOpen(true)}>
          + Agregar
        </CustomButton>
        <CustomButton
          variant="outline"
          size="sm"
          onPress={() => setShowBulkAdd(!showBulkAdd)}
        >
          + Múltiple
        </CustomButton>
        <CustomButton
          variant="outline"
          size="sm"
          onPress={() => setDense((v) => !v)}
        >
          {dense ? "⊞ Cómodo" : "⊟ Compact"}
        </CustomButton>
      </View>

      {selected.length > 0 && (
        <View style={tableStyles.toolbarRight}>
          <Text style={[tableStyles.cellText, { color: c.textMuted }]}>
            {selected.length} seleccionados
          </Text>
          <CustomSelect
            options={ESTADO_OPTIONS}
            value={bulkEstado}
            onChange={(v) => setBulkEstado(v as Estado)}
            style={{ minWidth: 120 }}
          />
          <CustomButton
            variant="secondary"
            size="sm"
            onPress={() => bulkUpdateEstado(bulkEstado)}
          >
            Aplicar
          </CustomButton>
          <CustomButton
            variant="outline"
            size="sm"
            onPress={() => setShowBulkDup(true)}
          >
            Duplicar
          </CustomButton>
        </View>
      )}
    </>
  );

  const getHeaderStyle = (h: string, i: number) => {
    if (i === 0) return { width: 40, textAlign: "center" as const };
    if (i === 9) return { width: 56, textAlign: "center" as const };
    if (h === "Fecha") return { width: 70 };
    if (h === "Descripción") return { flex: 2 };
    return { flex: 1 };
  };

  const headerRow = (
    <>
      {COLUMN_HEADERS.map((h, i) => (
        <Text
          key={i}
          style={[
            tableStyles.headerText,
            { color: c.textMuted },
            getHeaderStyle(h, i),
          ]}
        >
          {h}
        </Text>
      ))}
    </>
  );

  const panels = (
    <>
      {showBulkAdd && (
        <View
          style={[
            tableStyles.panel,
            {
              borderBottomColor: c.border,
              backgroundColor: c.backgroundStrong,
            },
          ]}
        >
          <Text style={[tableStyles.panelHint, { color: c.textMuted }]}>
            Formato: Renta, 8500, 30, efectivo (una por línea)
          </Text>
          <TextInput
            style={[
              localStyles.bulkInput,
              {
                color: c.text,
                borderColor: c.border,
                backgroundColor: c.background,
              },
            ]}
            value={bulkText}
            onChangeText={setBulkText}
            multiline
            numberOfLines={4}
            placeholder={
              "Renta, 8500, 30, efectivo\nGroceries, 2000, 15, credito"
            }
            placeholderTextColor={c.textPlaceholder}
          />
          <View style={tableStyles.panelActions}>
            <CustomButton
              variant="outline"
              size="sm"
              onPress={() => {
                setShowBulkAdd(false);
                setBulkText("");
              }}
            >
              Cancelar
            </CustomButton>
            <CustomButton variant="primary" size="sm" onPress={handleBulkAdd}>
              Agregar
            </CustomButton>
          </View>
        </View>
      )}

      {showBulkDup && (
        <View
          style={[
            tableStyles.panel,
            {
              borderBottomColor: c.border,
              backgroundColor: c.backgroundStrong,
            },
          ]}
        >
          <Text style={[tableStyles.panelHint, { color: c.text }]}>
            Duplicar {selected.length} filas a:
          </Text>
          <View style={localStyles.dupGrid}>
            {MESES_LIST.map((mes) => {
              const sel = bulkMeses.includes(mes);
              return (
                <TouchableOpacity
                  key={mes}
                  onPress={() => toggleBulkMes(mes)}
                  style={[
                    localStyles.dupChip,
                    {
                      borderColor: sel ? c.primary : c.border,
                      backgroundColor: sel ? `${c.primary}20` : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      localStyles.dupChipText,
                      { color: sel ? c.primary : c.text },
                    ]}
                  >
                    {mes.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={tableStyles.panelActions}>
            <CustomButton
              variant="outline"
              size="sm"
              onPress={() => {
                setShowBulkDup(false);
                setBulkMeses([]);
              }}
            >
              Cancelar
            </CustomButton>
            <CustomButton
              variant="primary"
              size="sm"
              onPress={handleBulkDuplicate}
            >
              Confirmar
            </CustomButton>
          </View>
        </View>
      )}
    </>
  );

  const hasBarData = statusBarData.total > 0;

  const statusBar = hasBarData ? (
    <View style={localStyles.statusBarContainer}>
      <View style={localStyles.statusBar}>
        <View
          style={[
            localStyles.statusSegment,
            {
              flex: statusBarData.pagado,
              backgroundColor: "#16A34A",
              borderTopLeftRadius: BORDER_RADIUS.full,
              borderBottomLeftRadius: BORDER_RADIUS.full,
            },
          ]}
        />
        <View
          style={[
            localStyles.statusSegment,
            {
              flex: statusBarData.sinPagar,
              backgroundColor: "#CA8A04",
            },
          ]}
        />
        <View
          style={[
            localStyles.statusSegment,
            {
              flex: statusBarData.guardado,
              backgroundColor: "#2563EB",
              borderTopRightRadius: BORDER_RADIUS.full,
              borderBottomRightRadius: BORDER_RADIUS.full,
            },
          ]}
        />
      </View>
      <View style={localStyles.statusLabels}>
        <Text style={[localStyles.statusLabel, { color: "#16A34A" }]}>
          Pag. ${formatMXN(statusBarData.pagado)}
        </Text>
        <Text style={[localStyles.statusLabel, { color: "#CA8A04" }]}>
          S/P ${formatMXN(statusBarData.sinPagar)}
        </Text>
        <Text style={[localStyles.statusLabel, { color: "#2563EB" }]}>
          Grd. ${formatMXN(statusBarData.guardado)}
        </Text>
      </View>
    </View>
  ) : null;

  const modals = (
    <>
      <ExpenseModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={(data) => {
          addExpenseFromModal(data);
          setAddModalOpen(false);
        }}
      />
      <ExpenseModal
        open={editModalOpen}
        {...(editingExpense ? { expense: editingExpense } : {})}
        onClose={() => setEditModalOpen(false)}
        onSave={(data) => {
          if (editingExpense) updateExpenseFromModal(editingExpense.id, data);
          setEditModalOpen(false);
        }}
        onDelete={() => {
          setDeleteConfirmExpense(editingExpense);
          setEditModalOpen(false);
        }}
      />
      <CustomModal
        open={deleteConfirmExpense !== null}
        onOpenChange={(v) => { if (!v) setDeleteConfirmExpense(null); }}
        title="¿Eliminar gasto?"
        size="sm"
        footer={
          <View style={localStyles.deleteFooter}>
            <CustomButton variant="outline" size="sm" onPress={() => setDeleteConfirmExpense(null)}>
              Cancelar
            </CustomButton>
            <CustomButton
              variant="outline"
              size="sm"
              onPress={() => {
                if (deleteConfirmExpense) removeExpense(deleteConfirmExpense.id);
                setDeleteConfirmExpense(null);
              }}
            >
              Eliminar
            </CustomButton>
          </View>
        }
      >
        <Text style={{ color: c.text }}>
          Esto eliminará el registro permanentemente.
        </Text>
      </CustomModal>
    </>
  );

  const makeRowProps = (e: Expense) => ({
    expense: e,
    dense,
    onEdit: () => { setEditingExpense(e); setEditModalOpen(true); },
    onClone: () => duplicateExpense(e.id, [e.mes]),
    onDelete: () => setDeleteConfirmExpense(e),
  });

  if (isMobile) {
    if (filterMes === "Todos" && groupedSections.length > 0) {
      return (
        <View style={localStyles.container}>
          {modals}
          <View
            style={[
              tableStyles.toolbar,
              { borderBottomColor: c.border, backgroundColor: c.background },
            ]}
          >
            {toolbar}
          </View>
          {panels}
          {statusBar}
          <UpcomingSection />
          <SectionList
            sections={groupedSections}
            keyExtractor={(e) => e.id}
            renderItem={({ item }) => <ExpenseRow {...makeRowProps(item)} />}
            renderSectionHeader={({ section }) => (
              <View
                style={[
                  localStyles.sectionHeader,
                  { backgroundColor: c.backgroundStrong, borderBottomColor: c.border },
                ]}
              >
                <Text style={[localStyles.sectionTitle, { color: c.text }]}>
                  {section.title}
                </Text>
                <Text style={[localStyles.sectionTotal, { color: c.textMuted }]}>
                  ${formatMXN(section.total)}
                </Text>
              </View>
            )}
            contentContainerStyle={localStyles.mobileList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      );
    }

    return (
      <View style={localStyles.container}>
        {modals}
        <View
          style={[
            tableStyles.toolbar,
            { borderBottomColor: c.border, backgroundColor: c.background },
          ]}
        >
          {toolbar}
        </View>
        {panels}
        {statusBar}
        <UpcomingSection />
        <SectionList
          sections={[{ title: "", data: filtered, total: 0 }]}
          keyExtractor={(e) => e.id}
          renderItem={({ item }) => <ExpenseRow {...makeRowProps(item)} />}
          renderSectionHeader={() => null}
          contentContainerStyle={localStyles.mobileList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  if (filterMes === "Todos" && groupedSections.length > 0) {
    return (
      <View style={localStyles.container}>
        {modals}
        {panels}
        {statusBar}
        <UpcomingSection />
        <TableShell toolbar={toolbar} header={headerRow}>
          {groupedSections.map((section) => (
            <View key={section.title}>
              <View
                style={[
                  localStyles.groupHeader,
                  { backgroundColor: c.backgroundStrong, borderBottomColor: c.border },
                ]}
              >
                <Text style={[localStyles.groupTitle, { color: c.text }]}>
                  {section.title}
                </Text>
                <Text style={[localStyles.groupTotal, { color: c.textMuted }]}>
                  ${formatMXN(section.total)}
                </Text>
              </View>
              {section.data.map((e) => (
                <ExpenseRow key={e.id} {...makeRowProps(e)} />
              ))}
            </View>
          ))}
        </TableShell>
      </View>
    );
  }

  return (
    <View style={localStyles.container}>
      {modals}
      {panels}
      {statusBar}
      <UpcomingSection />
      <TableShell toolbar={toolbar} header={headerRow}>
        {filtered.map((e) => (
          <ExpenseRow key={e.id} {...makeRowProps(e)} />
        ))}
      </TableShell>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: { flex: 1 },
  mobileList: { padding: SPACING.sm },
  bulkInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    minHeight: 80,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  dupGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs },
  dupChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  dupChipText: { fontSize: TYPOGRAPHY.fontSize.xs },
  statusBarContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  statusBar: {
    height: 8,
    flexDirection: "row",
    borderRadius: BORDER_RADIUS.full,
    overflow: "hidden",
  },
  statusSegment: {
    height: 8,
  },
  statusLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
  },
  sectionTotal: {
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  groupTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
  },
  groupTotal: {
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  deleteFooter: {
    flexDirection: "row",
    gap: SPACING.sm,
    justifyContent: "flex-end",
  },
  scheduledGroupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  scheduledRow: {
    flexDirection: "row",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    opacity: 0.85,
  },
  scheduledCell: { justifyContent: "center" },
  scheduledText: { fontSize: TYPOGRAPHY.fontSize.xs },
  scheduledBold: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
});

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const STATUS_DOT_COLOR: Record<string, string> = {
  pending: "#f59e0b",
  done: "#22c55e",
  cancelled: "#9ca3af",
};

const CATEGORY_ICON: Record<string, string> = {
  mechanic: "🔧",
  insurance: "🛡",
  medical: "🏥",
  utilities: "💡",
  subscription: "📅",
  other: "📌",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  done: "Completado",
  cancelled: "Cancelado",
};

function scheduledDateToMes(date: string): string {
  const m = parseInt(date.split("-")[1] ?? "1", 10) - 1;
  return MONTH_NAMES[m] ?? "—";
}

function scheduledDateToDay(date: string): string {
  return date.split("-")[2]?.replace(/^0/, "") ?? "—";
}

function ScheduledSection({ expenses }: { expenses: ScheduledExpense[] }) {
  const c = useColors();
  if (expenses.length === 0) return null;

  const knownTotal = expenses
    .filter((e) => e.amountKnown && e.status !== "cancelled")
    .reduce((s, e) => s + e.amount, 0);

  return (
    <View>
      <View
        style={[
          localStyles.scheduledGroupHeader,
          { backgroundColor: c.backgroundStrong, borderBottomColor: c.border, borderTopColor: c.border },
        ]}
      >
        <Text style={[localStyles.groupTitle, { color: c.textMuted }]}>📅 Programados</Text>
        <Text style={[localStyles.groupTotal, { color: c.textMuted }]}>
          {knownTotal > 0 ? `$${formatMXN(knownTotal)}` : `${expenses.length} eventos`}
        </Text>
      </View>

      {expenses.map((e) => {
        const dotColor = STATUS_DOT_COLOR[e.status] ?? "#9ca3af";
        const statusLabel = STATUS_LABEL[e.status] ?? e.status;
        return (
          <View
            key={e.id}
            style={[
              localStyles.scheduledRow,
              { borderBottomColor: c.border },
              e.status === "cancelled" && { opacity: 0.45 },
            ]}
          >
            {/* checkbox-width placeholder */}
            <View style={{ width: 40, alignItems: "center" }}>
              <Text style={{ fontSize: 14 }}>{CATEGORY_ICON[e.category] ?? "📌"}</Text>
            </View>

            {/* Mes */}
            <View style={[localStyles.scheduledCell, { flex: 1 }]}>
              <Text style={[localStyles.scheduledText, { color: c.textMuted }]} numberOfLines={1}>
                {scheduledDateToMes(e.scheduledDate)}
              </Text>
            </View>

            {/* Descripción */}
            <View style={[localStyles.scheduledCell, { flex: 2 }]}>
              <Text style={[localStyles.scheduledBold, { color: c.text }]} numberOfLines={1}>
                {e.title}
              </Text>
              {e.notes ? (
                <Text style={[localStyles.scheduledText, { color: c.textMuted }]} numberOfLines={1}>
                  {e.notes}
                </Text>
              ) : null}
            </View>

            {/* Monto */}
            <View style={[localStyles.scheduledCell, { flex: 1 }]}>
              <Text style={[localStyles.scheduledText, { color: c.text, textAlign: "right" }]}>
                {e.amountKnown ? `$${formatMXN(e.amount)}` : "Por definir"}
              </Text>
            </View>

            {/* Método placeholder */}
            <View style={[localStyles.scheduledCell, { flex: 1 }]} />

            {/* Frec. */}
            <View style={[localStyles.scheduledCell, { flex: 1 }]}>
              <Text style={[localStyles.scheduledText, { color: c.textMuted }]}>Único</Text>
            </View>

            {/* Fecha */}
            <View style={[localStyles.scheduledCell, { width: 70 }]}>
              <Text style={[localStyles.scheduledText, { color: c.text }]}>
                {scheduledDateToDay(e.scheduledDate)}
              </Text>
              {e.time ? (
                <Text style={[localStyles.scheduledText, { color: c.textMuted }]}>{e.time}</Text>
              ) : null}
            </View>

            {/* Nota */}
            <View style={[localStyles.scheduledCell, { flex: 1 }]}>
              <Text style={[localStyles.scheduledText, { color: c.textMuted }]} numberOfLines={1}>
                {e.scheduledDate}
              </Text>
            </View>

            {/* Estado */}
            <View style={[localStyles.scheduledCell, { flex: 1, flexDirection: "row", alignItems: "center", gap: 4 }]}>
              <View style={[localStyles.statusDot, { backgroundColor: dotColor }]} />
              <Text style={[localStyles.scheduledText, { color: c.textMuted }]}>{statusLabel}</Text>
            </View>

            {/* Actions placeholder */}
            <View style={{ width: 56 }} />
          </View>
        );
      })}
    </View>
  );
}
