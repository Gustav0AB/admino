import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { CustomSelect } from "@/shared/components/inputs/CustomSelect";
import { tableStyles } from "@/shared/components/data-display/tableStyles";
import { useColors } from "@/shared/hooks/useColors";
import {
  BORDER_RADIUS,
  BREAKPOINTS,
  SPACING,
  TYPOGRAPHY,
} from "@/shared/theme/tokens";
import { useExpensesStore } from "../store";
import { MESES_LIST } from "../helpers";
import type { Expense } from "../types";

const MES_OPTIONS = MESES_LIST.map((m) => ({ label: m, value: m }));
const METODO_OPTIONS = [
  { label: "Efectivo", value: "efectivo" },
  { label: "Crédito", value: "credito" },
];
const FREC_OPTIONS = [
  { label: "Mensual", value: "mes" },
  { label: "Quincenal", value: "quincenal" },
  { label: "Único", value: "unico" },
];
const FECHA_OPTIONS = [
  { label: "—", value: 0 },
  { label: "15", value: 15 },
  { label: "30", value: 30 },
];
const ESTADO_OPTIONS = [
  { label: "Pagado", value: "pagado" },
  { label: "No pagado", value: "no pagado" },
  { label: "Guardado", value: "guardado" },
  { label: "No guardado", value: "no guardado" },
];

type Props = { expense: Expense };

export function ExpenseRow({ expense }: Props) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isMobile = width < BREAKPOINTS.tablet;
  const { updateExpense, removeExpense, duplicateExpense, toggleSelected } =
    useExpensesStore();
  const [showDuplicatePanel, setShowDuplicatePanel] = useState(false);
  const [selectedMeses, setSelectedMeses] = useState<string[]>([]);

  const isCredito = expense.metodoPago === "credito";
  const isPagado = expense.estado === "pagado";
  const isTarjeta =
    expense.gastos.toLowerCase().trim() === "tarjeta de credito";

  const rowBg = isTarjeta
    ? `${c.secondary}18`
    : expense.selected
      ? `${c.primary}12`
      : isCredito
        ? `${c.primary}08`
        : isPagado
          ? "#16A34A10"
          : "transparent";

  const confirmDuplicate = () => {
    if (selectedMeses.length > 0) duplicateExpense(expense.id, selectedMeses);
    setShowDuplicatePanel(false);
    setSelectedMeses([]);
  };

  const toggleMes = (mes: string) => {
    setSelectedMeses((prev) =>
      prev.includes(mes) ? prev.filter((m) => m !== mes) : [...prev, mes],
    );
  };

  if (isMobile) {
    return (
      <View
        style={[
          tableStyles.mobileCard,
          { backgroundColor: rowBg, borderColor: c.border },
        ]}
      >
        <View style={localStyles.cardHeader}>
          <TouchableOpacity onPress={() => toggleSelected(expense.id)}>
            <View
              style={[
                tableStyles.checkbox,
                {
                  borderColor: c.border,
                  backgroundColor: expense.selected ? c.primary : "transparent",
                },
              ]}
            >
              {expense.selected && (
                <Text
                  style={[
                    tableStyles.checkMark,
                    { color: c.primaryForeground },
                  ]}
                >
                  ✓
                </Text>
              )}
            </View>
          </TouchableOpacity>
          <View style={localStyles.cardActions}>
            <TouchableOpacity
              onPress={() => setShowDuplicatePanel(!showDuplicatePanel)}
            >
              <Text style={[tableStyles.actionBtn, { color: c.textMuted }]}>
                ⧉
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeExpense(expense.id)}>
              <Text style={[tableStyles.actionBtn, { color: c.danger }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={localStyles.cardFields}>
          <Field label="Mes">
            <CustomSelect
              options={MES_OPTIONS}
              value={expense.mes}
              onChange={(v) => updateExpense(expense.id, "mes", v)}
            />
          </Field>
          <Field label="Gasto">
            <TextInput
              style={[
                localStyles.input,
                { color: c.text, borderColor: c.border },
              ]}
              value={expense.gastos}
              onChangeText={(v) => updateExpense(expense.id, "gastos", v)}
              placeholder="Descripción"
              placeholderTextColor={c.textPlaceholder}
            />
          </Field>
          <Field label="Monto">
            <TextInput
              style={[
                localStyles.input,
                { color: c.text, borderColor: c.border },
              ]}
              value={expense.monto === 0 ? "" : String(expense.monto)}
              onChangeText={(v) =>
                updateExpense(expense.id, "monto", parseFloat(v) || 0)
              }
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={c.textPlaceholder}
            />
          </Field>
          <Field label="Método">
            <CustomSelect
              options={METODO_OPTIONS}
              value={expense.metodoPago}
              onChange={(v) => updateExpense(expense.id, "metodoPago", v)}
            />
          </Field>
          <Field label="Frecuencia">
            <CustomSelect
              options={FREC_OPTIONS}
              value={expense.frecuencia}
              onChange={(v) => updateExpense(expense.id, "frecuencia", v)}
            />
          </Field>
          <Field label="Fecha">
            <CustomSelect
              options={FECHA_OPTIONS}
              value={expense.fecha}
              onChange={(v) => updateExpense(expense.id, "fecha", Number(v))}
            />
          </Field>
          <Field label="Nota">
            <TextInput
              style={[
                localStyles.input,
                { color: c.text, borderColor: c.border },
              ]}
              value={expense.fechaMaxima}
              onChangeText={(v) => updateExpense(expense.id, "fechaMaxima", v)}
              placeholder="Nota"
              placeholderTextColor={c.textPlaceholder}
            />
          </Field>
          <Field label="Estado">
            <CustomSelect
              options={ESTADO_OPTIONS}
              value={expense.estado}
              onChange={(v) => updateExpense(expense.id, "estado", v)}
            />
          </Field>
        </View>

        {showDuplicatePanel && (
          <DuplicatePanel
            sourceMes={expense.mes}
            selected={selectedMeses}
            onToggle={toggleMes}
            onConfirm={confirmDuplicate}
            onCancel={() => {
              setShowDuplicatePanel(false);
              setSelectedMeses([]);
            }}
            c={c}
          />
        )}
      </View>
    );
  }

  // ── Desktop row ──
  return (
    <>
      <View
        style={[
          tableStyles.row,
          { backgroundColor: rowBg, borderBottomColor: c.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => toggleSelected(expense.id)}
          style={tableStyles.checkboxCell}
        >
          <View
            style={[
              tableStyles.checkbox,
              {
                borderColor: c.border,
                backgroundColor: expense.selected ? c.primary : "transparent",
              },
            ]}
          >
            {expense.selected && (
              <Text
                style={[tableStyles.checkMark, { color: c.primaryForeground }]}
              >
                ✓
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={[tableStyles.cell, { flex: 1 }]}>
          <CustomSelect
            options={MES_OPTIONS}
            value={expense.mes}
            onChange={(v) => updateExpense(expense.id, "mes", v)}
          />
        </View>
        <View style={[tableStyles.cell, { flex: 2 }]}>
          <TextInput
            style={[localStyles.tableInput, { color: c.text }]}
            value={expense.gastos}
            onChangeText={(v) => updateExpense(expense.id, "gastos", v)}
            placeholder="Descripción"
            placeholderTextColor={c.textPlaceholder}
          />
        </View>
        <View style={[tableStyles.cell, { flex: 1 }]}>
          <TextInput
            style={[
              localStyles.tableInput,
              { color: c.text, textAlign: "right" },
            ]}
            value={expense.monto === 0 ? "" : String(expense.monto)}
            onChangeText={(v) =>
              updateExpense(expense.id, "monto", parseFloat(v) || 0)
            }
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={c.textPlaceholder}
          />
        </View>
        <View style={[tableStyles.cell, { flex: 1 }]}>
          <CustomSelect
            options={METODO_OPTIONS}
            value={expense.metodoPago}
            onChange={(v) => updateExpense(expense.id, "metodoPago", v)}
          />
        </View>
        <View style={[tableStyles.cell, { flex: 1 }]}>
          <CustomSelect
            options={FREC_OPTIONS}
            value={expense.frecuencia}
            onChange={(v) => updateExpense(expense.id, "frecuencia", v)}
          />
        </View>
        <View style={[tableStyles.cell, { width: 70 }]}>
          <CustomSelect
            options={FECHA_OPTIONS}
            value={expense.fecha}
            onChange={(v) => updateExpense(expense.id, "fecha", Number(v))}
          />
        </View>
        <View style={[tableStyles.cell, { flex: 1 }]}>
          <TextInput
            style={[localStyles.tableInput, { color: c.text }]}
            value={expense.fechaMaxima}
            onChangeText={(v) => updateExpense(expense.id, "fechaMaxima", v)}
            placeholder="Nota"
            placeholderTextColor={c.textPlaceholder}
          />
        </View>
        <View style={[tableStyles.cell, { flex: 1 }]}>
          <CustomSelect
            options={ESTADO_OPTIONS}
            value={expense.estado}
            onChange={(v) => updateExpense(expense.id, "estado", v)}
          />
        </View>
        <View style={[tableStyles.actionsCell, { width: 56 }]}>
          <TouchableOpacity
            onPress={() => setShowDuplicatePanel(!showDuplicatePanel)}
          >
            <Text style={[tableStyles.actionBtn, { color: c.textMuted }]}>
              ⧉
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => removeExpense(expense.id)}>
            <Text style={[tableStyles.actionBtn, { color: c.danger }]}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDuplicatePanel && (
        <View
          style={[
            localStyles.dupPanelRow,
            {
              borderBottomColor: c.border,
              backgroundColor: c.backgroundStrong,
            },
          ]}
        >
          <DuplicatePanel
            sourceMes={expense.mes}
            selected={selectedMeses}
            onToggle={toggleMes}
            onConfirm={confirmDuplicate}
            onCancel={() => {
              setShowDuplicatePanel(false);
              setSelectedMeses([]);
            }}
            c={c}
          />
        </View>
      )}
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const c = useColors();
  return (
    <View style={localStyles.fieldRow}>
      <Text style={[localStyles.fieldLabel, { color: c.textMuted }]}>
        {label}
      </Text>
      <View style={localStyles.fieldValue}>{children}</View>
    </View>
  );
}

function DuplicatePanel({
  sourceMes,
  selected,
  onToggle,
  onConfirm,
  onCancel,
  c,
}: {
  sourceMes: string;
  selected: string[];
  onToggle: (mes: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  c: ReturnType<typeof useColors>;
}) {
  return (
    <View style={localStyles.dupPanel}>
      <Text style={[localStyles.dupTitle, { color: c.text }]}>
        Duplicar a meses:
      </Text>
      <View style={localStyles.dupGrid}>
        {MESES_LIST.map((mes) => {
          const disabled = mes === sourceMes;
          const sel = selected.includes(mes);
          return (
            <TouchableOpacity
              key={mes}
              disabled={disabled}
              onPress={() => onToggle(mes)}
              style={[
                localStyles.dupChip,
                {
                  borderColor: sel ? c.primary : c.border,
                  backgroundColor: sel ? `${c.primary}20` : "transparent",
                  opacity: disabled ? 0.4 : 1,
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
      <View style={localStyles.dupActions}>
        <TouchableOpacity
          onPress={onCancel}
          style={[localStyles.dupBtn, { borderColor: c.border }]}
        >
          <Text style={[localStyles.dupBtnText, { color: c.text }]}>
            Cancelar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onConfirm}
          style={[
            localStyles.dupBtn,
            { backgroundColor: c.primary, borderColor: c.primary },
          ]}
        >
          <Text
            style={[localStyles.dupBtnText, { color: c.primaryForeground }]}
          >
            Confirmar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Only styles that are specific to ExpenseRow — shared chrome comes from tableStyles
const localStyles = StyleSheet.create({
  // Mobile card internals
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.sm,
  },
  cardFields: {
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  cardActions: { flexDirection: "row", gap: SPACING.md },

  // Inline text inputs for desktop row
  tableInput: { fontSize: TYPOGRAPHY.fontSize.sm, paddingVertical: SPACING.xs },

  // Mobile field layout
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  fieldRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  fieldLabel: { width: 80, fontSize: TYPOGRAPHY.fontSize.xs },
  fieldValue: { flex: 1 },

  // Duplicate panel
  dupPanelRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    padding: SPACING.md,
  },
  dupPanel: { gap: SPACING.sm },
  dupTitle: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" },
  dupGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs },
  dupChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  dupChipText: { fontSize: TYPOGRAPHY.fontSize.xs },
  dupActions: { flexDirection: "row", gap: SPACING.sm },
  dupBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  dupBtnText: { fontSize: TYPOGRAPHY.fontSize.sm },
});
