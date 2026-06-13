import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { CustomSelect } from "@/shared/components/inputs/CustomSelect";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { useExpensesStore } from "../store";
import {
  currentMonthName,
  currentYear,
  formatMXN,
  INCOME_CATEGORIES,
  MESES_LIST,
} from "../helpers";
import type { Income, IncomeCategory, IncomeEstado, IncomeFrecuencia } from "../types";

const MES_OPTIONS = MESES_LIST.map((m) => ({ label: m, value: m }));
const FECHA_OPTIONS = [
  { label: "Sin fecha", value: 0 },
  ...Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: i + 1 })),
];

type IncomeForm = {
  mes: string;
  descripcion: string;
  monto: number;
  fecha: number;
  frecuencia: IncomeFrecuencia;
  estado: IncomeEstado;
  category: IncomeCategory;
  accountId: string;
};

function blankForm(mes: string): IncomeForm {
  return {
    mes,
    descripcion: "",
    monto: 0,
    fecha: 0,
    frecuencia: "mes",
    estado: "pendiente",
    category: "sueldo",
    accountId: "",
  };
}

function incomeToForm(i: Income): IncomeForm {
  return {
    mes: i.mes,
    descripcion: i.descripcion,
    monto: i.monto,
    fecha: i.fecha,
    frecuencia: i.frecuencia,
    estado: i.estado,
    category: i.category,
    accountId: i.accountId ?? "",
  };
}

export function IncomesTab() {
  const c = useColors();
  const { incomes, accounts, addIncome, removeIncome, updateIncome } = useExpensesStore();

  const [selectedMes, setSelectedMes] = useState(currentMonthName());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<IncomeForm>(blankForm(currentMonthName()));

  function patch(u: Partial<IncomeForm>) {
    setForm((f) => ({ ...f, ...u }));
  }

  function openAdd() {
    setEditingId(null);
    setForm(blankForm(selectedMes));
    setShowForm(true);
  }

  function openEdit(income: Income) {
    setEditingId(income.id);
    setForm(incomeToForm(income));
    setShowForm(true);
  }

  function handleSave() {
    if (!form.descripcion.trim() || form.monto <= 0) return;
    const { accountId, ...rest } = form;
    const data: Omit<Income, "id"> = { ...rest, año: currentYear(), ...(accountId ? { accountId } : {}) };
    if (editingId) {
      updateIncome(editingId, data);
    } else {
      addIncome(data);
    }
    setShowForm(false);
    setEditingId(null);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
  }

  const filtered = useMemo(
    () => incomes.filter((i) => i.mes === selectedMes),
    [incomes, selectedMes],
  );

  const totalRecibido = filtered
    .filter((i) => i.estado === "recibido")
    .reduce((s, i) => s + i.monto, 0);
  const totalPendiente = filtered
    .filter((i) => i.estado === "pendiente")
    .reduce((s, i) => s + i.monto, 0);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <CustomSelect
          value={selectedMes}
          options={MES_OPTIONS}
          onChange={(v) => setSelectedMes(String(v))}
          style={styles.mesSelect}
        />
        <CustomButton variant="outline" size="sm" onPress={openAdd}>
          + Ingreso
        </CustomButton>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
          <Text style={[styles.summaryValue, { color: "#16A34A" }]}>${formatMXN(totalRecibido)}</Text>
          <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Recibido</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
          <Text style={[styles.summaryValue, { color: c.textMuted }]}>${formatMXN(totalPendiente)}</Text>
          <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Pendiente</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: c.backgroundStrong, borderColor: c.border, flex: 1.5 }]}>
          <Text style={[styles.summaryValue, { color: c.primary }]}>${formatMXN(totalRecibido + totalPendiente)}</Text>
          <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Total {selectedMes}</Text>
        </View>
      </View>

      {/* Form */}
      {showForm && (
        <View style={[styles.form, { backgroundColor: c.backgroundStrong, borderColor: c.primary }]}>
          <Text style={[styles.formTitle, { color: c.text }]}>
            {editingId ? "Editar ingreso" : "Nuevo ingreso"}
          </Text>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Descripción</Text>
            <TextInput
              style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
              value={form.descripcion}
              onChangeText={(v) => patch({ descripcion: v })}
              placeholder="Ej. Sueldo quincena"
              placeholderTextColor={c.textPlaceholder}
            />
          </View>

          <View style={styles.row2}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Monto ($)</Text>
              <TextInput
                style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
                value={form.monto === 0 ? "" : String(form.monto)}
                onChangeText={(v) => patch({ monto: parseFloat(v) || 0 })}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={c.textPlaceholder}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Mes</Text>
              <CustomSelect
                value={form.mes}
                options={MES_OPTIONS}
                onChange={(v) => patch({ mes: String(v) })}
              />
            </View>
          </View>

          <View style={styles.row2}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Fecha</Text>
              <CustomSelect
                value={form.fecha}
                options={FECHA_OPTIONS}
                onChange={(v) => patch({ fecha: Number(v) })}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Frecuencia</Text>
              <View style={styles.chips}>
                {(["mes", "quincenal", "unico"] as IncomeFrecuencia[]).map((f) => (
                  <Chip
                    key={f}
                    label={f === "mes" ? "Mensual" : f === "quincenal" ? "Quincenal" : "Único"}
                    selected={form.frecuencia === f}
                    onPress={() => patch({ frecuencia: f })}
                    c={c}
                  />
                ))}
              </View>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Estado</Text>
            <View style={styles.chips}>
              <Chip label="Recibido" selected={form.estado === "recibido"} onPress={() => patch({ estado: "recibido" })} c={c} color="#16A34A" />
              <Chip label="Pendiente" selected={form.estado === "pendiente"} onPress={() => patch({ estado: "pendiente" })} c={c} color={c.textMuted} />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Categoría</Text>
            <View style={styles.chips}>
              {INCOME_CATEGORIES.map((cat) => (
                <Chip
                  key={cat.value}
                  label={cat.label}
                  selected={form.category === cat.value}
                  onPress={() => patch({ category: cat.value })}
                  c={c}
                  color={cat.color}
                />
              ))}
            </View>
          </View>

          {accounts.length > 0 && (
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Cuenta destino (opcional)</Text>
              <CustomSelect
                value={form.accountId}
                options={[{ label: "Sin vincular", value: "" }, ...accounts.map((a) => ({ label: a.name, value: a.id }))]}
                onChange={(v) => patch({ accountId: String(v) })}
                placeholder="Sin vincular"
              />
            </View>
          )}

          <View style={styles.formActions}>
            <CustomButton variant="outline" size="sm" onPress={handleCancel}>Cancelar</CustomButton>
            <CustomButton variant="primary" size="sm" onPress={handleSave}>Guardar</CustomButton>
          </View>
        </View>
      )}

      {/* Empty */}
      {filtered.length === 0 && !showForm && (
        <View style={[styles.empty, { borderColor: c.border }]}>
          <Text style={[styles.emptyText, { color: c.textMuted }]}>
            Sin ingresos en {selectedMes}.{"\n"}Agrega uno con el botón de arriba.
          </Text>
        </View>
      )}

      {/* List */}
      {filtered.map((income) => (
        <IncomeRow
          key={income.id}
          income={income}
          onEdit={() => openEdit(income)}
          onRemove={() => removeIncome(income.id)}
          onToggleEstado={() =>
            updateIncome(income.id, { estado: income.estado === "recibido" ? "pendiente" : "recibido" })
          }
          c={c}
        />
      ))}
    </ScrollView>
  );
}

function IncomeRow({
  income, onEdit, onRemove, onToggleEstado, c,
}: {
  income: Income;
  onEdit: () => void;
  onRemove: () => void;
  onToggleEstado: () => void;
  c: ReturnType<typeof useColors>;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const cat = INCOME_CATEGORIES.find((c) => c.value === income.category);
  const isRecibido = income.estado === "recibido";

  return (
    <View style={[styles.incomeRow, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
      <TouchableOpacity onPress={onToggleEstado} style={[styles.estadoDot, { backgroundColor: isRecibido ? "#16A34A" : c.border }]} />
      <View style={styles.incomeInfo}>
        <Text style={[styles.incomeDesc, { color: c.text }]} numberOfLines={1}>{income.descripcion}</Text>
        <View style={styles.incomeMeta}>
          {cat && (
            <View style={[styles.catChip, { backgroundColor: `${cat.color}22` }]}>
              <Text style={[styles.catChipText, { color: cat.color }]}>{cat.label}</Text>
            </View>
          )}
          {income.fecha > 0 && (
            <Text style={[styles.metaText, { color: c.textMuted }]}>día {income.fecha}</Text>
          )}
          <Text style={[styles.metaText, { color: isRecibido ? "#16A34A" : c.textMuted }]}>
            {isRecibido ? "Recibido" : "Pendiente"}
          </Text>
        </View>
      </View>
      <Text style={[styles.incomeMonto, { color: "#16A34A" }]}>+${formatMXN(income.monto)}</Text>
      <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
        <Text style={[styles.actionText, { color: c.primary }]}>✎</Text>
      </TouchableOpacity>
      {confirmRemove ? (
        <View style={styles.confirmRow}>
          <TouchableOpacity onPress={onRemove}>
            <Text style={[styles.actionText, { color: c.danger }]}>Sí</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setConfirmRemove(false)}>
            <Text style={[styles.actionText, { color: c.textMuted }]}>No</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={() => setConfirmRemove(true)} style={styles.actionBtn}>
          <Text style={[styles.actionText, { color: c.textMuted }]}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function Chip({
  label, selected, onPress, c, color,
}: {
  label: string; selected: boolean; onPress: () => void; c: ReturnType<typeof useColors>; color?: string;
}) {
  const activeColor = color ?? c.primary;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: selected ? activeColor : c.border, backgroundColor: selected ? `${activeColor}22` : "transparent" },
      ]}
    >
      <Text style={[styles.chipText, { color: selected ? activeColor : c.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xl },

  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACING.sm },
  mesSelect: { minWidth: 150 },

  summaryRow: { flexDirection: "row", gap: SPACING.sm },
  summaryCard: { flex: 1, borderRadius: BORDER_RADIUS.md, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.sm, alignItems: "center", gap: 2 },
  summaryValue: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: "700" },
  summaryLabel: { fontSize: TYPOGRAPHY.fontSize.xs },

  form: { borderRadius: BORDER_RADIUS.md, borderWidth: 1, padding: SPACING.md, gap: SPACING.md },
  formTitle: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "700" },
  formActions: { flexDirection: "row", justifyContent: "flex-end", gap: SPACING.sm },

  field: { gap: 4 },
  fieldLabel: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, fontSize: TYPOGRAPHY.fontSize.sm },
  row2: { flexDirection: "row", gap: SPACING.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs },
  chip: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.full, borderWidth: 1 },
  chipText: { fontSize: TYPOGRAPHY.fontSize.xs },

  empty: { borderWidth: 1, borderStyle: "dashed", borderRadius: BORDER_RADIUS.md, padding: SPACING.xl, alignItems: "center" },
  emptyText: { fontSize: TYPOGRAPHY.fontSize.sm, textAlign: "center", lineHeight: 22 },

  incomeRow: { flexDirection: "row", alignItems: "center", borderRadius: BORDER_RADIUS.md, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.sm, gap: SPACING.sm },
  estadoDot: { width: 10, height: 10, borderRadius: 5 },
  incomeInfo: { flex: 1, gap: 2 },
  incomeDesc: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "500" },
  incomeMeta: { flexDirection: "row", alignItems: "center", gap: SPACING.xs, flexWrap: "wrap" },
  catChip: { paddingHorizontal: SPACING.xs, paddingVertical: 1, borderRadius: BORDER_RADIUS.sm },
  catChipText: { fontSize: 10, fontWeight: "600" },
  metaText: { fontSize: 10 },
  incomeMonto: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "700" },
  actionBtn: { padding: SPACING.xs },
  actionText: { fontSize: TYPOGRAPHY.fontSize.sm },
  confirmRow: { flexDirection: "row", gap: SPACING.xs },
});
