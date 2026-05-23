import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDisplay(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

type CalendarPickerProps = {
  label?: string | undefined;
  value?: Date | null | undefined;
  onChange?: ((date: Date) => void) | undefined;
  placeholder?: string | undefined;
  error?: string | undefined;
  disabled?: boolean | undefined;
  minimumDate?: Date | undefined;
  maximumDate?: Date | undefined;
  style?: StyleProp<ViewStyle> | undefined;
};

export function CalendarPicker({
  label,
  value,
  onChange,
  placeholder = "Select date",
  error,
  disabled = false,
  minimumDate,
  maximumDate,
  style,
}: CalendarPickerProps) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => value ?? new Date());

  function openCalendar() {
    if (disabled) return;
    setViewDate(value ?? new Date());
    setOpen(true);
  }

  function handleDayPress(day: number) {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange?.(selected);
    setOpen(false);
  }

  function prevMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  function nextMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={[styles.label, { color: c.text }]}>{label}</Text> : null}

      <TouchableOpacity
        style={[
          styles.trigger,
          {
            backgroundColor: c.background,
            borderColor: error ? c.danger : c.border,
            borderWidth: error ? 2 : 1,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        onPress={openCalendar}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={{ color: value ? c.text : c.textPlaceholder, fontSize: TYPOGRAPHY.fontSize.sm }}>
          {value ? formatDisplay(value) : placeholder}
        </Text>
        <Text style={{ color: c.textMuted, fontSize: TYPOGRAPHY.fontSize.md }}>▾</Text>
      </TouchableOpacity>

      {error ? <Text style={[styles.error, { color: c.danger }]}>{error}</Text> : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.card, { backgroundColor: c.background, borderColor: c.border }]}
          >
            {/* Month navigation */}
            <View style={styles.nav}>
              <TouchableOpacity onPress={prevMonth} style={styles.navBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={[styles.navArrow, { color: c.primary }]}>‹</Text>
              </TouchableOpacity>
              <Text style={[styles.monthTitle, { color: c.text }]}>
                {MONTH_NAMES[month]} {year}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={styles.navBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={[styles.navArrow, { color: c.primary }]}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Weekday headers */}
            <View style={styles.weekdayRow}>
              {WEEKDAYS.map((wd) => (
                <Text key={wd} style={[styles.weekday, { color: c.textMuted }]}>
                  {wd}
                </Text>
              ))}
            </View>

            {/* Day grid */}
            <View style={styles.grid}>
              {cells.map((day, idx) => {
                if (!day) {
                  return <View key={`empty-${idx}`} style={styles.cell} />;
                }
                const cellDate = new Date(year, month, day);
                const isSelected =
                  value != null &&
                  value.getFullYear() === year &&
                  value.getMonth() === month &&
                  value.getDate() === day;
                // Normalize to local midnight so UTC-parsed dates don't shift the boundary
                const minLocal = minimumDate
                  ? new Date(minimumDate.getFullYear(), minimumDate.getMonth(), minimumDate.getDate())
                  : null;
                const maxLocal = maximumDate
                  ? new Date(maximumDate.getFullYear(), maximumDate.getMonth(), maximumDate.getDate())
                  : null;
                const tooEarly = minLocal != null && cellDate < minLocal;
                const tooLate = maxLocal != null && cellDate > maxLocal;
                const isDisabled = tooEarly || tooLate;
                const isToday =
                  cellDate.toDateString() === new Date().toDateString();

                return (
                  <TouchableOpacity
                    key={`day-${day}`}
                    style={[
                      styles.cell,
                      isSelected && {
                        backgroundColor: c.primary,
                        borderRadius: BORDER_RADIUS.sm,
                      },
                      !isSelected && isToday && {
                        borderWidth: 1,
                        borderColor: c.primary,
                        borderRadius: BORDER_RADIUS.sm,
                      },
                    ]}
                    onPress={() => !isDisabled && handleDayPress(day)}
                    disabled={isDisabled}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontSize: TYPOGRAPHY.fontSize.sm,
                        color: isSelected
                          ? c.primaryForeground
                          : isDisabled
                            ? c.textPlaceholder
                            : c.text,
                      }}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
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
    fontWeight: "500",
    marginBottom: SPACING.xs,
  },
  trigger: {
    minHeight: 44,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  error: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  navBtn: {
    padding: SPACING.xs,
  },
  navArrow: {
    fontSize: 26,
    fontWeight: "600",
    lineHeight: 28,
  },
  monthTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: "600",
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: SPACING.xs,
  },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
