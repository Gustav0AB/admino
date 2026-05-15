import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Controller, useFormContext, useFieldArray } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useColors } from "@/shared/hooks/useColors";
import { CustomInput } from "@/shared/components/inputs/CustomInput";
import { CustomSelect } from "@/shared/components/inputs/CustomSelect";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import type { CreatePlanValues } from "../../types";

const UNIT_OPTIONS = [
  { label: "kg", value: "kg" },
  { label: "lbs", value: "lbs" },
];

function ep(msg: string | undefined): { error: string } | Record<string, never> {
  return msg !== undefined ? { error: msg } : {};
}

function makeExercise() {
  return {
    id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    sets: [{ reps: 1, weight: 0, unit: "kg" as const }],
    restSeconds: 60,
    notes: "",
  };
}

export function StepExercises() {
  const { t } = useTranslation();
  const c = useColors();
  const {
    control,
    formState: { errors },
  } = useFormContext<CreatePlanValues>();

  const { fields: exerciseFields, append, remove } = useFieldArray({
    control,
    name: "exercises",
  });

  return (
    <View style={styles.container}>
      {exerciseFields.length === 0 && (
        <View style={[styles.emptyHint, { borderColor: c.border, backgroundColor: c.backgroundStrong }]}>
          <Text style={[styles.emptyText, { color: c.textMuted }]}>
            {t("trainingPlanning.addExercise")} to get started.
          </Text>
        </View>
      )}

      {exerciseFields.map((exerciseField, exIdx) => (
        <ExerciseCard
          key={exerciseField.id}
          exIdx={exIdx}
          control={control}
          errors={errors}
          onRemove={() => remove(exIdx)}
          t={t}
          c={c}
        />
      ))}

      <CustomButton
        variant="outline"
        size="md"
        onPress={() => append(makeExercise())}
      >
        + {t("trainingPlanning.addExercise")}
      </CustomButton>

      {errors.exercises?.root?.message && (
        <Text style={[styles.rootError, { color: c.danger }]}>
          {errors.exercises.root.message}
        </Text>
      )}
    </View>
  );
}

type ExerciseCardProps = {
  exIdx: number;
  control: ReturnType<typeof useFormContext<CreatePlanValues>>["control"];
  errors: ReturnType<typeof useFormContext<CreatePlanValues>>["formState"]["errors"];
  onRemove: () => void;
  t: ReturnType<typeof useTranslation>["t"];
  c: ReturnType<typeof useColors>;
};

function ExerciseCard({ exIdx, control, errors, onRemove, t, c }: ExerciseCardProps) {
  const { fields: setFields, append: appendSet, remove: removeSet } = useFieldArray({
    control,
    name: `exercises.${exIdx}.sets`,
  });

  return (
    <View style={[styles.card, { borderColor: c.border, backgroundColor: c.backgroundStrong }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: c.text }]}>
          {t("trainingPlanning.exercises")} #{exIdx + 1}
        </Text>
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.removeText, { color: c.danger }]}>
            {t("trainingPlanning.removeExercise")}
          </Text>
        </TouchableOpacity>
      </View>

      <Controller
        control={control}
        name={`exercises.${exIdx}.name`}
        render={({ field }) => (
          <CustomInput
            label={t("trainingPlanning.exerciseName")}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder={t("trainingPlanning.exerciseName")}
            {...ep(errors.exercises?.[exIdx]?.name?.message)}
          />
        )}
      />

      <View style={styles.inlineRow}>
        <Controller
          control={control}
          name={`exercises.${exIdx}.restSeconds`}
          render={({ field }) => (
            <CustomInput
              label={t("trainingPlanning.restSeconds")}
              value={String(field.value)}
              onChangeText={(v) => field.onChange(Number(v))}
              onBlur={field.onBlur}
              keyboardType="numeric"
              containerStyle={styles.halfField}
            />
          )}
        />
        <Controller
          control={control}
          name={`exercises.${exIdx}.notes`}
          render={({ field }) => (
            <CustomInput
              label={t("trainingPlanning.notes")}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Optional"
              containerStyle={styles.halfField}
            />
          )}
        />
      </View>

      <Text style={[styles.setsLabel, { color: c.textMuted }]}>{t("trainingPlanning.sets")}</Text>

      {setFields.map((setField, sIdx) => (
        <View key={setField.id} style={styles.setRow}>
          <Text style={[styles.setIndex, { color: c.textMuted }]}>{sIdx + 1}</Text>

          <Controller
            control={control}
            name={`exercises.${exIdx}.sets.${sIdx}.reps`}
            render={({ field }) => (
              <CustomInput
                label={t("trainingPlanning.reps")}
                value={String(field.value)}
                onChangeText={(v) => field.onChange(Number(v))}
                onBlur={field.onBlur}
                keyboardType="numeric"
                containerStyle={styles.setField}
                {...ep(errors.exercises?.[exIdx]?.sets?.[sIdx]?.reps?.message)}
              />
            )}
          />

          <Controller
            control={control}
            name={`exercises.${exIdx}.sets.${sIdx}.weight`}
            render={({ field }) => (
              <CustomInput
                label={t("trainingPlanning.weight")}
                value={String(field.value)}
                onChangeText={(v) => field.onChange(Number(v))}
                onBlur={field.onBlur}
                keyboardType="numeric"
                containerStyle={styles.setField}
              />
            )}
          />

          <Controller
            control={control}
            name={`exercises.${exIdx}.sets.${sIdx}.unit`}
            render={({ field }) => (
              <CustomSelect
                label={t("trainingPlanning.unit")}
                options={UNIT_OPTIONS}
                value={field.value}
                onChange={(v) => field.onChange(v as "kg" | "lbs")}
                style={styles.unitField}
              />
            )}
          />

          {setFields.length > 1 && (
            <TouchableOpacity
              onPress={() => removeSet(sIdx)}
              style={styles.removeSetBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.removeSetText, { color: c.danger }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <TouchableOpacity
        onPress={() => appendSet({ reps: 1, weight: 0, unit: "kg" })}
        style={[styles.addSetBtn, { borderColor: c.border }]}
      >
        <Text style={[styles.addSetText, { color: c.primary }]}>
          + {t("trainingPlanning.addSet")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  emptyHint: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: "center",
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  card: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: "600",
  },
  removeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  inlineRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  halfField: {
    flex: 1,
  },
  setsLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
    marginTop: SPACING.xs,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: SPACING.xs,
  },
  setIndex: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
    width: 18,
    paddingBottom: 12,
  },
  setField: {
    flex: 1,
    minWidth: 60,
  },
  unitField: {
    width: 80,
    marginBottom: 0,
  },
  removeSetBtn: {
    paddingBottom: 12,
  },
  removeSetText: {
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  addSetBtn: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.xs,
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  addSetText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
  },
  rootError: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
});
