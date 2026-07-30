import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { CustomModal } from "@/shared/components/feedback/CustomModal";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { CustomInput } from "@/shared/components/inputs/CustomInput";
import { CalendarPicker } from "@/shared/components/inputs/CalendarPicker";
import { useColors } from "@/shared/hooks/useColors";
import { SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { toIso, isoToLocalDate } from "./calendarUtils";
import { CELL_HINT } from "./CellEditModal";

type RepeatPatternModalProps = {
  open: boolean;
  defaultStartDate: string;
  onClose: () => void;
  onSave: (templates: string[], startDateIso: string) => void;
};

const MIN_TEMPLATES = 2;

export function RepeatPatternModal({ open, defaultStartDate, onClose, onSave }: RepeatPatternModalProps) {
  const c = useColors();
  const [templates, setTemplates] = useState<string[]>(["", ""]);
  const [startDate, setStartDate] = useState(defaultStartDate);

  useEffect(() => {
    if (open) { setTemplates(["", ""]); setStartDate(defaultStartDate); }
  }, [open, defaultStartDate]);

  function updateTemplate(i: number, text: string) {
    setTemplates((prev) => prev.map((t, idx) => (idx === i ? text : t)));
  }

  function addTemplate() {
    setTemplates((prev) => [...prev, ""]);
  }

  function removeTemplate(i: number) {
    setTemplates((prev) => (prev.length > MIN_TEMPLATES ? prev.filter((_, idx) => idx !== i) : prev));
  }

  function handleSave() {
    onSave(templates, startDate);
    onClose();
  }

  return (
    <CustomModal
      open={open}
      onOpenChange={onClose}
      title="Patrón repetitivo"
      size="md"
      footer={
        <View style={styles.footer}>
          <CustomButton variant="ghost" size="sm" onPress={onClose}>Cancelar</CustomButton>
          <CustomButton variant="primary" size="sm" onPress={handleSave}>Aplicar al plan</CustomButton>
        </View>
      }
    >
      <View style={{ gap: SPACING.md }}>
        <Text style={{ color: c.textMuted, fontSize: TYPOGRAPHY.fontSize.sm, lineHeight: 20 }}>
          Define un ciclo de días (ej. Pull / Push / Funcional) y se repetirá automáticamente,
          día por día, desde la fecha de inicio hasta el fin del plan.
        </Text>

        <CalendarPicker
          label="Empezar el ciclo desde"
          value={isoToLocalDate(startDate)}
          onChange={(d) => setStartDate(toIso(d))}
        />

        {templates.map((text, i) => (
          <View key={i} style={[styles.templateRow, { borderColor: c.border }]}>
            <View style={styles.templateHeader}>
              <Text style={[styles.templateLabel, { color: c.text }]}>Día {i + 1} del ciclo</Text>
              {templates.length > MIN_TEMPLATES && (
                <Text style={[styles.removeBtn, { color: c.danger }]} onPress={() => removeTemplate(i)}>
                  Quitar
                </Text>
              )}
            </View>
            <CustomInput
              value={text}
              onChangeText={(t) => updateTemplate(i, t)}
              placeholder={"Pull\njalón al pecho 4x10\nremo 4x10"}
              multiline
              numberOfLines={5}
              style={styles.textArea}
              textAlignVertical="top"
            />
          </View>
        ))}

        <CustomButton variant="outline" size="sm" onPress={addTemplate}>+ Agregar día al ciclo</CustomButton>

        <View style={[styles.hintBox, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
          <Text style={[styles.hintText, { color: c.textMuted }]}>{CELL_HINT}</Text>
        </View>
      </View>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  footer: { flex: 1, flexDirection: "row", justifyContent: "flex-end", gap: SPACING.sm },
  templateRow: { borderWidth: 1, borderRadius: 8, padding: SPACING.sm, gap: SPACING.xs },
  templateHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  templateLabel: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" },
  removeBtn: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },
  textArea: { minHeight: 100 },
  hintBox: { borderRadius: 8, borderWidth: 1, padding: SPACING.sm },
  hintText: { fontSize: TYPOGRAPHY.fontSize.xs, lineHeight: 18 },
});
