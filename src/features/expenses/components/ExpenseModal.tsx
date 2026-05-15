import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CustomModal } from "@/shared/components/feedback/CustomModal";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { useExpensesStore } from "../store";
import { currentMonthName, MESES_LIST } from "../helpers";
import type { Estado, Expense, Frecuencia, MetodoPago } from "../types";

type FormState = {
  mes: string;
  gastos: string;
  monto: number;
  metodoPago: MetodoPago;
  frecuencia: Frecuencia;
  fecha: number;
  fechaMaxima: string;
  estado: Estado;
  creditCardId: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  expense?: Expense;
  onSave: (data: Omit<Expense, "id" | "selected">) => void;
  onDelete?: () => void;
};

const MES_ABBR = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function blankForm(): FormState {
  return {
    mes: currentMonthName(),
    gastos: "",
    monto: 0,
    metodoPago: "efectivo",
    frecuencia: "mes",
    fecha: 0,
    fechaMaxima: "",
    estado: "no pagado",
    creditCardId: "",
  };
}

function expenseToForm(e: Expense): FormState {
  return {
    mes: e.mes,
    gastos: e.gastos,
    monto: e.monto,
    metodoPago: e.metodoPago,
    frecuencia: e.frecuencia,
    fecha: e.fecha,
    fechaMaxima: e.fechaMaxima,
    estado: e.estado,
    creditCardId: e.creditCardId ?? "",
  };
}

export function ExpenseModal({ open, onClose, expense, onSave, onDelete }: Props) {
  const c = useColors();
  const { creditCards } = useExpensesStore();
  const isEdit = expense !== undefined;

  const [form, setForm] = useState<FormState>(isEdit ? expenseToForm(expense) : blankForm());

  useEffect(() => {
    if (open) {
      setForm(expense ? expenseToForm(expense) : blankForm());
    }
  }, [open, expense]);

  function patch(update: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...update }));
  }

  function handleSave() {
    const data: Omit<Expense, "id" | "selected"> = {
      mes: form.mes,
      gastos: form.gastos,
      monto: form.monto,
      metodoPago: form.metodoPago,
      frecuencia: form.frecuencia,
      fecha: form.fecha,
      fechaMaxima: form.fechaMaxima,
      estado: form.estado,
    };
    if (form.creditCardId) {
      data.creditCardId = form.creditCardId;
    }
    onSave(data);
  }

  const footer = (
    <View style={styles.footerRow}>
      <View style={styles.footerLeft}>
        {isEdit && onDelete && (
          <CustomButton variant="outline" size="sm" onPress={onDelete}>
            Eliminar
          </CustomButton>
        )}
      </View>
      <View style={styles.footerRight}>
        <CustomButton variant="outline" size="sm" onPress={onClose}>
          Cancelar
        </CustomButton>
        <CustomButton variant="primary" size="sm" onPress={handleSave}>
          Guardar
        </CustomButton>
      </View>
    </View>
  );

  return (
    <CustomModal
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      title={isEdit ? "Editar gasto" : "Agregar gasto"}
      size="md"
      footer={footer}
    >
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <FormSection label="Descripción">
          <TextInput
            style={[styles.textInput, { color: c.text, borderColor: c.border, backgroundColor: c.backgroundStrong }]}
            value={form.gastos}
            onChangeText={(v) => patch({ gastos: v })}
            placeholder="Descripción del gasto"
            placeholderTextColor={c.textPlaceholder}
          />
        </FormSection>

        <FormSection label="Mes">
          <View style={styles.chipRow}>
            {MESES_LIST.map((mes, i) => {
              const sel = form.mes === mes;
              return (
                <Chip key={mes} label={MES_ABBR[i] ?? mes} selected={sel} onPress={() => patch({ mes })} c={c} />
              );
            })}
          </View>
        </FormSection>

        <FormSection label="Monto">
          <View style={styles.montoRow}>
            <Text style={[styles.montoPrefix, { color: c.textMuted }]}>$</Text>
            <TextInput
              style={[styles.textInput, styles.montoInput, { color: c.text, borderColor: c.border, backgroundColor: c.backgroundStrong }]}
              value={form.monto === 0 ? "" : String(form.monto)}
              onChangeText={(v) => patch({ monto: parseFloat(v) || 0 })}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={c.textPlaceholder}
            />
          </View>
        </FormSection>

        <FormSection label="Método de pago">
          <View style={styles.chipRow}>
            <Chip label="Efectivo" selected={form.metodoPago === "efectivo"} onPress={() => patch({ metodoPago: "efectivo" })} c={c} />
            <Chip label="Crédito" selected={form.metodoPago === "credito"} onPress={() => patch({ metodoPago: "credito" })} c={c} />
          </View>
        </FormSection>

        {form.metodoPago === "credito" && (
          <FormSection label="Tarjeta">
            {creditCards.length === 0 ? (
              <Text style={[styles.noteText, { color: c.textMuted }]}>
                Configura tus tarjetas en el panel de Crédito
              </Text>
            ) : (
              <View style={styles.chipRow}>
                <Chip
                  label="Ninguna"
                  selected={form.creditCardId === ""}
                  onPress={() => patch({ creditCardId: "" })}
                  c={c}
                />
                {creditCards.map((card) => (
                  <Chip
                    key={card.id}
                    label={card.name}
                    selected={form.creditCardId === card.id}
                    onPress={() => patch({ creditCardId: card.id })}
                    c={c}
                  />
                ))}
              </View>
            )}
          </FormSection>
        )}

        <FormSection label="Frecuencia">
          <View style={styles.chipRow}>
            <Chip label="Mensual" selected={form.frecuencia === "mes"} onPress={() => patch({ frecuencia: "mes" })} c={c} />
            <Chip label="Quincenal" selected={form.frecuencia === "quincenal"} onPress={() => patch({ frecuencia: "quincenal" })} c={c} />
            <Chip label="Único" selected={form.frecuencia === "unico"} onPress={() => patch({ frecuencia: "unico" })} c={c} />
          </View>
        </FormSection>

        <FormSection label="Fecha de cobro">
          <Text style={[styles.rangeLabel, { color: c.textMuted }]}>Primera quincena</Text>
          <View style={styles.dayGrid}>
            {Array.from({ length: 15 }, (_, i) => i + 1).map((day) => (
              <DayChip
                key={day}
                day={day}
                selected={form.fecha === day}
                onPress={() => patch({ fecha: form.fecha === day ? 0 : day })}
                c={c}
              />
            ))}
          </View>
          <Text style={[styles.rangeLabel, { color: c.textMuted, marginTop: SPACING.xs }]}>Segunda quincena</Text>
          <View style={styles.dayGrid}>
            {Array.from({ length: 16 }, (_, i) => i + 16).map((day) => (
              <DayChip
                key={day}
                day={day}
                selected={form.fecha === day}
                onPress={() => patch({ fecha: form.fecha === day ? 0 : day })}
                c={c}
              />
            ))}
          </View>
        </FormSection>

        <FormSection label="Estado">
          <View style={styles.chipRow}>
            <Chip label="Pagado" selected={form.estado === "pagado"} onPress={() => patch({ estado: "pagado" })} c={c} />
            <Chip label="No pagado" selected={form.estado === "no pagado"} onPress={() => patch({ estado: "no pagado" })} c={c} />
            <Chip label="Guardado" selected={form.estado === "guardado"} onPress={() => patch({ estado: "guardado" })} c={c} />
            <Chip label="No guardado" selected={form.estado === "no guardado"} onPress={() => patch({ estado: "no guardado" })} c={c} />
          </View>
        </FormSection>

        <FormSection label="Nota">
          <TextInput
            style={[styles.textInput, { color: c.text, borderColor: c.border, backgroundColor: c.backgroundStrong }]}
            value={form.fechaMaxima}
            onChangeText={(v) => patch({ fechaMaxima: v })}
            placeholder="Nota opcional"
            placeholderTextColor={c.textPlaceholder}
          />
        </FormSection>
      </ScrollView>
    </CustomModal>
  );
}

function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.formSection}>
      <Text style={[styles.sectionLabel, { color: c.textMuted }]}>{label}</Text>
      {children}
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
  c,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  c: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: selected ? c.primary : c.border,
          backgroundColor: selected ? `${c.primary}20` : "transparent",
        },
      ]}
    >
      <Text style={[styles.chipText, { color: selected ? c.primary : c.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function DayChip({
  day,
  selected,
  onPress,
  c,
}: {
  day: number;
  selected: boolean;
  onPress: () => void;
  c: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.dayChip,
        {
          borderColor: selected ? c.primary : c.border,
          backgroundColor: selected ? c.primary : "transparent",
        },
      ]}
    >
      <Text style={[styles.dayChipText, { color: selected ? c.primaryForeground : c.text }]}>{day}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 500 },
  scrollContent: { gap: SPACING.md, paddingBottom: SPACING.sm },
  formSection: { gap: SPACING.xs },
  sectionLabel: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600", textTransform: "uppercase" },
  textInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  montoRow: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
  montoPrefix: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: "600" },
  montoInput: { flex: 1 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs },
  chip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  chipText: { fontSize: TYPOGRAPHY.fontSize.xs },
  rangeLabel: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "500" },
  dayGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs },
  dayChip: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayChipText: { fontSize: TYPOGRAPHY.fontSize.xs },
  noteText: { fontSize: TYPOGRAPHY.fontSize.xs, fontStyle: "italic" },
  footerRow: { flexDirection: "row", justifyContent: "space-between", flex: 1 },
  footerLeft: {},
  footerRight: { flexDirection: "row", gap: SPACING.sm },
});
