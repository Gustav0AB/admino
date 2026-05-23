import { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { CustomModal } from "@/shared/components/feedback/CustomModal";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { CustomInput } from "@/shared/components/inputs/CustomInput";
import { SPACING } from "@/shared/theme/tokens";

type CellEditModalProps = {
  open: boolean;
  dateLabel: string;
  initialValue: string;
  onClose: () => void;
  onSave: (text: string) => void;
};

export function CellEditModal({ open, dateLabel, initialValue, onClose, onSave }: CellEditModalProps) {
  const [value, setValue] = useState(initialValue);

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
          <CustomButton variant="ghost" size="sm" onPress={onClose}>Cancel</CustomButton>
          <CustomButton variant="primary" size="sm" onPress={handleSave}>Add</CustomButton>
        </View>
      }
    >
      <CustomInput
        value={value}
        onChangeText={setValue}
        placeholder="Training notes..."
        multiline
        numberOfLines={6}
        style={styles.textArea}
        textAlignVertical="top"
      />
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  footer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: SPACING.sm,
  },
  textArea: {
    minHeight: 120,
  },
});
