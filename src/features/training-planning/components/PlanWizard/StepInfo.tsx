import { View, Text, StyleSheet } from "react-native";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useColors } from "@/shared/hooks/useColors";
import { CustomInput } from "@/shared/components/inputs/CustomInput";
import { CustomSelect } from "@/shared/components/inputs/CustomSelect";
import { CustomTextArea } from "@/shared/components/inputs/CustomTextArea";
import { SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import type { CreatePlanValues } from "../../types";
import { calcTotalWeeks } from "../../utils/planUtils";

const LAYOUT_OPTIONS = [
  { label: "Day-based (Mon–Sun)", value: "day-based" },
  { label: "Cycle-based (Day 1, Day 2…)", value: "cycle-based" },
];

function ep(msg: string | undefined): { error: string } | Record<string, never> {
  return msg !== undefined ? { error: msg } : {};
}

export function StepInfo() {
  const { t } = useTranslation();
  const c = useColors();
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext<CreatePlanValues>();

  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const totalWeeks =
    startDate && endDate && new Date(endDate) > new Date(startDate)
      ? calcTotalWeeks(startDate, endDate)
      : null;

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <CustomInput
            label={t("trainingPlanning.planName")}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder={t("trainingPlanning.planName")}
            {...ep(errors.name?.message)}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <CustomTextArea
            label={t("trainingPlanning.description")}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder={t("trainingPlanning.description")}
            numberOfLines={3}
          />
        )}
      />

      <Controller
        control={control}
        name="layoutType"
        render={({ field }) => (
          <CustomSelect
            label={t("trainingPlanning.layoutType")}
            options={LAYOUT_OPTIONS}
            value={field.value}
            onChange={(v) => field.onChange(v as string)}
            {...ep(errors.layoutType?.message)}
          />
        )}
      />

      <View style={styles.dateRow}>
        <Controller
          control={control}
          name="startDate"
          render={({ field }) => (
            <CustomInput
              label={t("trainingPlanning.startDate")}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="YYYY-MM-DD"
              containerStyle={styles.dateField}
              {...ep(errors.startDate?.message)}
            />
          )}
        />
        <Controller
          control={control}
          name="endDate"
          render={({ field }) => (
            <CustomInput
              label={t("trainingPlanning.endDate")}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="YYYY-MM-DD"
              containerStyle={styles.dateField}
              {...ep(errors.endDate?.message)}
            />
          )}
        />
      </View>

      {totalWeeks !== null && (
        <View style={[styles.weeksChip, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
          <Text style={[styles.weeksText, { color: c.textMuted }]}>
            {t("trainingPlanning.totalWeeks")}:{" "}
            <Text style={[styles.weeksValue, { color: c.text }]}>
              {totalWeeks} {t("trainingPlanning.weeks")}
            </Text>
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  dateRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  dateField: {
    flex: 1,
  },
  weeksChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  weeksText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  weeksValue: {
    fontWeight: "600",
  },
});
