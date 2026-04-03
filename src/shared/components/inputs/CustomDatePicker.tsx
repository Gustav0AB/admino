import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";

type DatePickerMode = "date" | "time" | "datetime";

type CustomDatePickerProps = {
  label?: string;
  value?: Date;
  onChange?: (date: Date) => void;
  mode?: DatePickerMode;
  placeholder?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
};

export function CustomDatePicker({
  label,
  value,
  onChange,
  mode = "date",
  placeholder = "Select date and time",
  error,
  hint,
  disabled = false,
  minimumDate,
  maximumDate,
}: CustomDatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value || new Date());
  const c = useColors();

  const formatDate = (date: Date) => {
    if (mode === "date") {
      return date.toLocaleDateString();
    } else if (mode === "time") {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const handleConfirm = () => {
    onChange?.(tempDate);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setTempDate(value || new Date());
    setShowPicker(false);
  };

  const renderDatePicker = () => {
    if (Platform.OS === "ios") {
      // For iOS, we'd use DateTimePicker from @react-native-community/datetimepicker
      // For now, showing a simplified version
      return (
        <View
          style={[styles.pickerContainer, { backgroundColor: c.background }]}
        >
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={handleCancel}>
              <Text style={{ color: c.primary }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={{ color: c.primary, fontWeight: "600" }}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pickerContent}>
            <Text style={{ color: c.text }}>Date Picker UI would go here</Text>
            <Text style={{ color: c.textMuted, marginTop: SPACING.sm }}>
              Selected: {formatDate(tempDate)}
            </Text>
          </View>
        </View>
      );
    } else {
      // For Android and Web, show a calendar-like interface
      const currentYear = tempDate.getFullYear();
      const currentMonth = tempDate.getMonth();

      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

      const days = [];
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null);
      }
      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(day);
      }

      return (
        <View
          style={[styles.pickerContainer, { backgroundColor: c.background }]}
        >
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={handleCancel}>
              <Text style={{ color: c.primary }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={{ color: c.primary, fontWeight: "600" }}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.calendarHeader}>
            <Text style={{ color: c.text, fontWeight: "600" }}>
              {tempDate.toLocaleDateString("default", {
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>

          <View style={styles.weekdays}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <Text key={day} style={[styles.weekday, { color: c.textMuted }]}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {days.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  {
                    backgroundColor:
                      day === tempDate.getDate() &&
                      currentMonth === tempDate.getMonth() &&
                      currentYear === tempDate.getFullYear()
                        ? c.primary
                        : "transparent",
                  },
                ]}
                onPress={() => {
                  if (day) {
                    const newDate = new Date(currentYear, currentMonth, day);
                    if (mode === "datetime" || mode === "time") {
                      newDate.setHours(tempDate.getHours());
                      newDate.setMinutes(tempDate.getMinutes());
                    }
                    setTempDate(newDate);
                  }
                }}
              >
                <Text
                  style={{
                    color:
                      day === tempDate.getDate() &&
                      currentMonth === tempDate.getMonth() &&
                      currentYear === tempDate.getFullYear()
                        ? c.background
                        : day
                          ? c.text
                          : "transparent",
                  }}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {(mode === "time" || mode === "datetime") && (
            <View style={styles.timeSection}>
              <Text style={{ color: c.text, marginBottom: SPACING.sm }}>
                Time
              </Text>
              <View style={styles.timeInputs}>
                <TouchableOpacity style={styles.timeButton}>
                  <Text style={{ color: c.text }}>
                    {tempDate.getHours().toString().padStart(2, "0")}
                  </Text>
                </TouchableOpacity>
                <Text style={{ color: c.text, marginHorizontal: SPACING.sm }}>
                  :
                </Text>
                <TouchableOpacity style={styles.timeButton}>
                  <Text style={{ color: c.text }}>
                    {tempDate.getMinutes().toString().padStart(2, "0")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: c.text }]}>{label}</Text>}

      <TouchableOpacity
        style={[
          styles.input,
          {
            backgroundColor: c.background,
            borderColor: error ? c.danger : c.border,
            borderWidth: error ? 2 : 1,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        onPress={() => !disabled && setShowPicker(true)}
        disabled={disabled}
      >
        <Text
          style={{
            color: value ? c.text : c.textPlaceholder,
          }}
        >
          {value ? formatDate(value) : placeholder}
        </Text>
      </TouchableOpacity>

      {hint && !error && (
        <Text style={[styles.hintText, { color: c.textMuted }]}>{hint}</Text>
      )}

      {error && (
        <Text style={[styles.errorText, { color: c.danger }]}>{error}</Text>
      )}

      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>{renderDatePicker()}</View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.xs,
  },
  input: {
    minHeight: 44,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: "center",
  },
  hintText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.xs,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    maxHeight: "80%",
  },
  pickerContainer: {
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  pickerContent: {
    padding: SPACING.lg,
    alignItems: "center",
  },
  calendarHeader: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  weekdays: {
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: SPACING.lg,
  },
  dayCell: {
    width: "14.28%", // 100% / 7 days
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  timeSection: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  timeInputs: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  timeButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    minWidth: 50,
    alignItems: "center",
  },
});
