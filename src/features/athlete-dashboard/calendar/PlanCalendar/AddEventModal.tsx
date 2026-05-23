import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { CustomModal } from "@/shared/components/feedback/CustomModal";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { CustomInput } from "@/shared/components/inputs/CustomInput";
import { CustomSelect } from "@/shared/components/inputs/CustomSelect";
import { CalendarPicker } from "@/shared/components/inputs/CalendarPicker";
import { SPACING } from "@/shared/theme/tokens";
import { toIso, isoToLocalDate } from "./calendarUtils";
import type { CalendarEvent, EventType } from "./types";

const EVENT_TYPE_OPTIONS = [
  { label: "Competencia", value: "competition" },
  { label: "Seminario", value: "seminar" },
  { label: "Vacaciones", value: "vacation" },
];

type AddEventModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
};

export function AddEventModal({ open, onClose, onSave }: AddEventModalProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [type, setType] = useState<EventType>("competition");
  const [nameError, setNameError] = useState("");
  const [dateError, setDateError] = useState("");

  function handleClose() {
    setName("");
    setDate(null);
    setType("competition");
    setNameError("");
    setDateError("");
    onClose();
  }

  function handleSave() {
    let valid = true;
    if (!name.trim()) { setNameError("Event name required"); valid = false; }
    else setNameError("");
    if (!date) { setDateError("Date required"); valid = false; }
    else setDateError("");
    if (!valid) return;

    onSave({ id: `ev-${Date.now()}`, name: name.trim(), date: toIso(date!), type });
    handleClose();
  }

  return (
    <CustomModal
      open={open}
      onOpenChange={handleClose}
      title="Add Event"
      size="sm"
      footer={
        <View style={styles.footer}>
          <CustomButton variant="ghost" size="sm" onPress={handleClose}>Cancel</CustomButton>
          <CustomButton variant="primary" size="sm" onPress={handleSave}>Save Event</CustomButton>
        </View>
      }
    >
      <CustomInput
        label="Event name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Campeonato Regional"
        {...(nameError ? { error: nameError } : {})}
      />
      <CalendarPicker
        label="Date"
        value={date}
        onChange={setDate}
        placeholder="Select date"
        {...(dateError ? { error: dateError } : {})}
      />
      <CustomSelect
        label="Type"
        options={EVENT_TYPE_OPTIONS}
        value={type}
        onChange={(v) => setType(v as EventType)}
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
});
