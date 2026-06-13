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
import { CustomSelect } from "@/shared/components/inputs/CustomSelect";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { useExpensesStore } from "../store";
import { CATEGORIES, currentMonthName, MESES_LIST } from "../helpers";
import type { Estado, Expense, ExpenseCategory, Frecuencia, MetodoPago } from "../types";

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
  category: ExpenseCategory | "";
  accountId: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  expense?: Expense;
  onSave: (data: Omit<Expense, "id" | "selected">) => void;
  onDelete?: () => void;
};

const MES_OPTIONS = MESES_LIST.map((m) => ({ label: m, value: m }));

const FECHA_OPTIONS = [
  { label: "Sin fecha", value: 0 },
  ...Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: i + 1 })),
];

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
    category: "",
    accountId: "",
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
    category: e.category ?? "",
    accountId: e.accountId ?? "",
  };
}

export function ExpenseModal({ open, onClose, expense, onSave, onDelete }: Props) {
  const c = useColors();
  const { creditCards, accounts } = useExpensesStore();
  const isEdit = expense !== undefined;

  const [form, setForm] = useState<FormState>(isEdit ? expenseToForm(expense) : blankForm());
  const [cardError, setCardError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(expense ? expenseToForm(expense) : blankForm());
      setCardError("");
    }
  }, [open, expense]);

  useEffect(() => {
    if (creditCards.length === 0 && form.metodoPago === "credito") {
      patch({ metodoPago: "efectivo" });
    }
  }, [creditCards.length]);

  function patch(update: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...update }));
    if (update.creditCardId) setCardError("");
  }

  function handleSelectCredito() {
    const firstCard = creditCards[0]?.id ?? "";
    patch({ metodoPago: "credito", creditCardId: form.creditCardId || firstCard });
  }

  function handleSave() {
    if (form.metodoPago === "credito" && !form.creditCardId) {
      setCardError("Debes seleccionar una tarjeta para pagos con crédito");
      return;
    }
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
    if (form.creditCardId) data.creditCardId = form.creditCardId;
    if (form.category) data.category = form.category;
    if (form.accountId) data.accountId = form.accountId;
    onSave(data);
  }

  const cardOptions = creditCards.map((c) => ({ label: c.name, value: c.id }));

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
          <CustomSelect
            value={form.mes}
            options={MES_OPTIONS}
            onChange={(v) => patch({ mes: String(v) })}
            placeholder="Seleccionar mes"
          />
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
            <Chip label="Efectivo" selected={form.metodoPago === "efectivo"} onPress={() => patch({ metodoPago: "efectivo", creditCardId: "" })} c={c} />
            <Chip
              label="Crédito"
              selected={form.metodoPago === "credito"}
              onPress={handleSelectCredito}
              disabled={creditCards.length === 0}
              c={c}
            />
          </View>
        </FormSection>

        {form.metodoPago === "credito" && (
          <FormSection label="Tarjeta de crédito *">
            <CustomSelect
              value={form.creditCardId}
              options={cardOptions}
              onChange={(v) => patch({ creditCardId: String(v) })}
              placeholder="Seleccionar tarjeta"
            />
            {cardError ? (
              <Text style={{ color: c.danger, fontSize: TYPOGRAPHY.fontSize.xs, marginTop: 2 }}>
                {cardError}
              </Text>
            ) : null}
          </FormSection>
        )}

        {accounts.length > 0 && form.metodoPago === "efectivo" && (
          <FormSection label="Cuenta de origen (opcional)">
            <CustomSelect
              value={form.accountId}
              options={[{ label: "Sin vincular", value: "" }, ...accounts.map((a) => ({ label: a.name, value: a.id }))]}
              onChange={(v) => patch({ accountId: String(v) })}
              placeholder="Sin vincular"
            />
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
          <CustomSelect
            value={form.fecha}
            options={FECHA_OPTIONS}
            onChange={(v) => patch({ fecha: Number(v) })}
            placeholder="Sin fecha"
          />
        </FormSection>

        <FormSection label="Estado">
          <View style={styles.chipRow}>
            <Chip label="Pagado" selected={form.estado === "pagado"} onPress={() => patch({ estado: "pagado" })} c={c} />
            <Chip label="No pagado" selected={form.estado === "no pagado"} onPress={() => patch({ estado: "no pagado" })} c={c} />
            <Chip label="Guardado" selected={form.estado === "guardado"} onPress={() => patch({ estado: "guardado" })} c={c} />
            <Chip label="No guardado" selected={form.estado === "no guardado"} onPress={() => patch({ estado: "no guardado" })} c={c} />
          </View>
        </FormSection>

        <FormSection label="Categoría">
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                onPress={() => patch({ category: form.category === cat.value ? "" : cat.value })}
                style={[
                  styles.chip,
                  {
                    borderColor: form.category === cat.value ? cat.color : c.border,
                    backgroundColor: form.category === cat.value ? `${cat.color}22` : "transparent",
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: form.category === cat.value ? cat.color : c.text }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
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
  label, selected, onPress, disabled = false, c,
}: {
  label: string; selected: boolean; onPress: () => void; disabled?: boolean; c: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.chip,
        { borderColor: selected ? c.primary : c.border, backgroundColor: selected ? `${c.primary}20` : "transparent" },
        disabled && { opacity: 0.4 },
      ]}
    >
      <Text style={[styles.chipText, { color: selected ? c.primary : c.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 520 },
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
  chip: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.full, borderWidth: 1 },
  chipText: { fontSize: TYPOGRAPHY.fontSize.xs },
  footerRow: { flexDirection: "row", justifyContent: "space-between", flex: 1 },
  footerLeft: {},
  footerRight: { flexDirection: "row", gap: SPACING.sm },
});
