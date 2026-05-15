import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { tableStyles } from "@/shared/components/data-display/tableStyles";
import { useColors } from "@/shared/hooks/useColors";
import {
  BORDER_RADIUS,
  BREAKPOINTS,
  SPACING,
  TYPOGRAPHY,
} from "@/shared/theme/tokens";
import { useExpensesStore } from "../store";
import { formatMXN } from "../helpers";
import type { Expense } from "../types";

type Props = {
  expense: Expense;
  dense?: boolean;
  onEdit: () => void;
  onClone: () => void;
  onDelete: () => void;
};

export function ExpenseRow({ expense, dense, onEdit, onClone, onDelete }: Props) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isMobile = width < BREAKPOINTS.tablet;
  const { toggleSelected } = useExpensesStore();

  const isCredito = expense.metodoPago === "credito";
  const isPagado = expense.estado === "pagado";
  const isTarjeta = expense.gastos.toLowerCase().trim() === "tarjeta de credito";

  const rowBg = isTarjeta
    ? `${c.secondary}18`
    : expense.selected
      ? `${c.primary}12`
      : isCredito
        ? `${c.primary}08`
        : isPagado
          ? "#16A34A10"
          : "transparent";

  const fechaRange = expense.fecha >= 1 && expense.fecha <= 15
    ? "1-15"
    : expense.fecha >= 16 && expense.fecha <= 31
      ? "16-31"
      : null;

  const estadoColor =
    expense.estado === "pagado" ? "#16A34A" :
    expense.estado === "no pagado" ? "#CA8A04" :
    expense.estado === "guardado" ? "#2563EB" : c.textMuted;

  const metodoBg =
    expense.metodoPago === "credito" ? `${c.primary}20` : "#16A34A20";
  const metodoColor =
    expense.metodoPago === "credito" ? c.primary : "#16A34A";
  const metodoLabel = expense.metodoPago === "credito" ? "Crédito" : "Efectivo";

  const frecuenciaLabel =
    expense.frecuencia === "mes" ? "Mensual" :
    expense.frecuencia === "quincenal" ? "Quincenal" : "Único";

  if (isMobile) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onEdit}
        style={[
          tableStyles.mobileCard,
          { backgroundColor: rowBg, borderColor: c.border },
        ]}
      >
        <View style={localStyles.cardHeader}>
          <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); toggleSelected(expense.id); }}>
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
                <Text style={[tableStyles.checkMark, { color: c.primaryForeground }]}>✓</Text>
              )}
            </View>
          </TouchableOpacity>
          <Text style={[localStyles.cardDesc, { color: c.text }]} numberOfLines={1}>
            {expense.gastos || "—"}
          </Text>
          <View style={localStyles.cardActions}>
            <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); onClone(); }}>
              <Text style={[tableStyles.actionBtn, { color: c.textMuted }]}>⧉</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); onDelete(); }}>
              <Text style={[tableStyles.actionBtn, { color: c.danger }]}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={localStyles.cardFields}>
          <FieldRow label="Mes" value={expense.mes} c={c} />
          <FieldRow label="Monto" value={`$${formatMXN(expense.monto)}`} c={c} />
          <View style={localStyles.fieldRow}>
            <Text style={[localStyles.fieldLabel, { color: c.textMuted }]}>Método</Text>
            <Badge label={metodoLabel} bg={metodoBg} color={metodoColor} />
          </View>
          <FieldRow label="Frecuencia" value={frecuenciaLabel} c={c} />
          <View style={localStyles.fieldRow}>
            <Text style={[localStyles.fieldLabel, { color: c.textMuted }]}>Fecha</Text>
            <Text style={[localStyles.fieldValue, { color: c.text }]}>
              {expense.fecha > 0 ? `Día ${expense.fecha}` : "—"}
              {fechaRange ? ` (${fechaRange})` : ""}
            </Text>
          </View>
          {!!expense.fechaMaxima && <FieldRow label="Nota" value={expense.fechaMaxima} c={c} />}
          <View style={localStyles.fieldRow}>
            <Text style={[localStyles.fieldLabel, { color: c.textMuted }]}>Estado</Text>
            <Badge label={expense.estado} bg={`${estadoColor}20`} color={estadoColor} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  const rowPaddingVertical = dense ? 2 : undefined;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onEdit}
      style={[
        tableStyles.row,
        { backgroundColor: rowBg, borderBottomColor: c.border, ...(rowPaddingVertical !== undefined ? { paddingVertical: rowPaddingVertical } : {}) },
      ]}
    >
      <TouchableOpacity
        onPress={(e) => { e.stopPropagation?.(); toggleSelected(expense.id); }}
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
            <Text style={[tableStyles.checkMark, { color: c.primaryForeground }]}>✓</Text>
          )}
        </View>
      </TouchableOpacity>

      <View style={[tableStyles.cell, { flex: 1 }]}>
        <Text style={[localStyles.cellText, { color: c.text }]} numberOfLines={1}>{expense.mes}</Text>
      </View>

      <View style={[tableStyles.cell, { flex: 2 }]}>
        <Text style={[localStyles.cellTextBold, { color: c.text }]} numberOfLines={1}>
          {expense.gastos || "—"}
        </Text>
      </View>

      <View style={[tableStyles.cell, { flex: 1 }]}>
        <Text style={[localStyles.cellText, { color: c.text, textAlign: "right" }]}>
          ${formatMXN(expense.monto)}
        </Text>
      </View>

      <View style={[tableStyles.cell, { flex: 1 }]}>
        <Badge label={metodoLabel} bg={metodoBg} color={metodoColor} />
      </View>

      <View style={[tableStyles.cell, { flex: 1 }]}>
        <Text style={[localStyles.cellText, { color: c.textMuted }]}>{frecuenciaLabel}</Text>
      </View>

      <View style={[tableStyles.cell, { width: 70 }]}>
        <Text style={[localStyles.cellText, { color: c.text }]}>
          {expense.fecha > 0 ? String(expense.fecha) : "—"}
        </Text>
        {fechaRange && (
          <Text style={[localStyles.rangeBadge, { color: c.textMuted }]}>{fechaRange}</Text>
        )}
      </View>

      <View style={[tableStyles.cell, { flex: 1 }]}>
        <Text style={[localStyles.cellText, { color: c.textMuted }]} numberOfLines={1}>
          {expense.fechaMaxima || "—"}
        </Text>
      </View>

      <View style={[tableStyles.cell, { flex: 1 }]}>
        <Badge label={expense.estado} bg={`${estadoColor}20`} color={estadoColor} />
      </View>

      <View style={[tableStyles.actionsCell, { width: 56 }]}>
        <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); onClone(); }}>
          <Text style={[tableStyles.actionBtn, { color: c.textMuted }]}>⧉</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); onDelete(); }}>
          <Text style={[tableStyles.actionBtn, { color: c.danger }]}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function FieldRow({ label, value, c }: { label: string; value: string; c: ReturnType<typeof useColors> }) {
  return (
    <View style={localStyles.fieldRow}>
      <Text style={[localStyles.fieldLabel, { color: c.textMuted }]}>{label}</Text>
      <Text style={[localStyles.fieldValue, { color: c.text }]}>{value}</Text>
    </View>
  );
}

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <View style={[localStyles.badge, { backgroundColor: bg }]}>
      <Text style={[localStyles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

const localStyles = StyleSheet.create({
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.sm,
  },
  cardDesc: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
  },
  cardActions: { flexDirection: "row", gap: SPACING.sm },
  cardFields: {
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  fieldRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  fieldLabel: { width: 80, fontSize: TYPOGRAPHY.fontSize.xs },
  fieldValue: { flex: 1, fontSize: TYPOGRAPHY.fontSize.xs },
  cellText: { fontSize: TYPOGRAPHY.fontSize.sm },
  cellTextBold: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" },
  rangeBadge: { fontSize: 10 },
  badge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "500" },
});
