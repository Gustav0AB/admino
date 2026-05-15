import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useColors } from "@/shared/hooks/useColors";
import { CustomSelect } from "@/shared/components/inputs/CustomSelect";
import { CustomDatePicker } from "@/shared/components/inputs/CustomDatePicker";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import type { EventFilters, EventType } from "../types";

const EVENT_TYPE_OPTIONS = [
  { label: "All Types", value: "" },
  { label: "Competition", value: "competition" },
  { label: "Seminar", value: "seminar" },
  { label: "Training Camp", value: "training_camp" },
  { label: "Clinic", value: "clinic" },
];

type EventFiltersProps = {
  filters: EventFilters;
  onChange: (filters: EventFilters) => void;
  onClear: () => void;
};

export function EventFilters({ filters, onChange, onClear }: EventFiltersProps) {
  const { t } = useTranslation();
  const c = useColors();

  const hasActiveFilters =
    filters.eventType !== "" || filters.fromDate !== null || filters.toDate !== null;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.typeSelect}>
          <CustomSelect
            label={t("events.eventType")}
            options={EVENT_TYPE_OPTIONS}
            value={filters.eventType}
            onChange={(v) =>
              onChange({ ...filters, eventType: v as EventType | "" })
            }
          />
        </View>

        <View style={styles.datePicker}>
          <CustomDatePicker
            label={t("events.dateFrom")}
            value={filters.fromDate ?? undefined}
            onChange={(d) =>
              onChange({
                ...filters,
                fromDate: d,
                toDate:
                  filters.toDate && d > filters.toDate ? null : filters.toDate,
              })
            }
            mode="date"
            placeholder="Select date"
          />
        </View>

        <View style={styles.datePicker}>
          <CustomDatePicker
            label={t("events.dateTo")}
            value={filters.toDate ?? undefined}
            onChange={(d) => onChange({ ...filters, toDate: d })}
            mode="date"
            placeholder="Select date"
            minimumDate={filters.fromDate ?? undefined}
          />
        </View>
      </View>

      {hasActiveFilters && (
        <TouchableOpacity
          onPress={onClear}
          style={[styles.clearBtn, { borderColor: c.border }]}
          accessibilityRole="button"
        >
          <Text style={[styles.clearText, { color: c.textMuted }]}>
            ✕ {t("events.clearFilters")}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    alignItems: "flex-end",
  },
  typeSelect: {
    minWidth: 160,
    flex: 1,
  },
  datePicker: {
    minWidth: 140,
    flex: 1,
  },
  clearBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  clearText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
});
