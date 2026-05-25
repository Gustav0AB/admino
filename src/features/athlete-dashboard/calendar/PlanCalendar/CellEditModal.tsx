import { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { CustomModal } from "@/shared/components/feedback/CustomModal";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { CustomInput } from "@/shared/components/inputs/CustomInput";
import { useColors } from "@/shared/hooks/useColors";
import { SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";

type CellEditModalProps = {
  open: boolean;
  dateLabel: string;
  initialValue: string;
  onClose: () => void;
  onSave: (text: string) => void;
};

const CELL_HINT = `Estructura del día para el atleta:
• Línea 1: título del día (ej. "Fuerza")
• Líneas siguientes: cada ejercicio en una línea → se convierte en ítem del checklist
• trote [2x4] 40min → sección de cardio con temporizador
• nota: mensaje → instrucción extra del entrenador

Ejemplo:
Fuerza
pecho banca plana 2 series de 4
trote 2x4 40min
nota: calentar 10 min antes`;

export function CellEditModal({ open, dateLabel, initialValue, onClose, onSave }: CellEditModalProps) {
  const c = useColors();
  const [value, setValue] = useState(initialValue);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  function handleSave() {
    onSave(value);
    onClose();
  }

  return (
    <CustomModal
      open={open}
      onOpenChange={onClose}
      title={dateLabel}
      size="sm"
      footer={
        <View style={styles.footer}>
          <CustomButton variant="ghost" size="sm" onPress={onClose}>Cancelar</CustomButton>
          <CustomButton variant="primary" size="sm" onPress={handleSave}>Guardar</CustomButton>
        </View>
      }
    >
      <View style={{ gap: SPACING.sm }}>
        <CustomInput
          value={value}
          onChangeText={setValue}
          placeholder={"Fuerza\npecho banca plana 2 series de 4\ntrote 2x4 40min\nnota: calentar bien"}
          multiline
          numberOfLines={6}
          style={styles.textArea}
          textAlignVertical="top"
        />
        <View style={[styles.hintBox, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
          <Text
            style={[styles.hintToggle, { color: c.primary }]}
            onPress={() => setShowHint((v) => !v)}
          >
            {showHint ? "▲ Ocultar formato" : "▼ Ver formato del atleta"}
          </Text>
          {showHint && (
            <Text style={[styles.hintText, { color: c.textMuted }]}>{CELL_HINT}</Text>
          )}
        </View>
      </View>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  footer: { flex: 1, flexDirection: "row", justifyContent: "flex-end", gap: SPACING.sm },
  textArea: { minHeight: 120 },
  hintBox: { borderRadius: 8, borderWidth: 1, padding: SPACING.sm },
  hintToggle: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },
  hintText: { fontSize: TYPOGRAPHY.fontSize.xs, lineHeight: 18, marginTop: SPACING.xs },
});
