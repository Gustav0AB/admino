import { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useColors } from "@/shared/hooks/useColors";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { CustomModal } from "@/shared/components/feedback/CustomModal";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import {
  createPlanSchema,
  stepInfoSchema,
  stepExercisesSchema,
  type CreatePlanValues,
} from "../../types";
import { useCreatePlan } from "../../hooks/useTrainingPlans";
import { todayIso, addWeeksIso } from "../../utils/planUtils";
import { StepInfo } from "./StepInfo";
import { StepExercises } from "./StepExercises";
import { StepPreview } from "./StepPreview";

type Step = 0 | 1 | 2;

const STEP_SCHEMAS = [stepInfoSchema, stepExercisesSchema, createPlanSchema];

const STEP_KEYS: (keyof CreatePlanValues)[][] = [
  ["name", "description", "layoutType", "startDate", "endDate"],
  ["exercises"],
  [],
];

type PlanWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PlanWizard({ open, onOpenChange }: PlanWizardProps) {
  const { t } = useTranslation();
  const c = useColors();
  const [step, setStep] = useState<Step>(0);

  const { mutate: createPlan, isPending } = useCreatePlan();

  const methods = useForm<CreatePlanValues>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      name: "",
      description: "",
      layoutType: "day-based",
      startDate: todayIso(),
      endDate: addWeeksIso(todayIso(), 12),
      exercises: [],
    },
    mode: "onTouched",
  });

  const stepLabels = [
    t("trainingPlanning.stepInfo"),
    t("trainingPlanning.stepExercises"),
    t("trainingPlanning.stepPreview"),
  ];

  async function handleNext() {
    const fieldsToValidate = STEP_KEYS[step] as (keyof CreatePlanValues)[];
    const valid =
      fieldsToValidate.length > 0
        ? await methods.trigger(fieldsToValidate)
        : true;
    if (valid) setStep((s) => (s + 1) as Step);
  }

  function handleBack() {
    setStep((s) => (s - 1) as Step);
  }

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => {
      setStep(0);
      methods.reset();
    }, 300);
  }

  function onSubmit(values: CreatePlanValues) {
    createPlan(values, {
      onSuccess: () => handleClose(),
    });
  }

  const stepContent = [<StepInfo />, <StepExercises />, <StepPreview />][step];

  return (
    <CustomModal
      open={open}
      onOpenChange={handleClose}
      title={t("trainingPlanning.newPlan")}
      size="lg"
      footer={
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            {step > 0 && (
              <CustomButton variant="outline" size="sm" onPress={handleBack}>
                {t("trainingPlanning.back")}
              </CustomButton>
            )}
          </View>
          <View style={styles.footerRight}>
            <CustomButton variant="ghost" size="sm" onPress={handleClose}>
              {t("common.cancel")}
            </CustomButton>
            {step < 2 ? (
              <CustomButton variant="primary" size="sm" onPress={handleNext}>
                {t("trainingPlanning.next")}
              </CustomButton>
            ) : (
              <CustomButton
                variant="primary"
                size="sm"
                onPress={methods.handleSubmit(onSubmit)}
                loading={isPending}
              >
                {t("trainingPlanning.createPlan")}
              </CustomButton>
            )}
          </View>
        </View>
      }
    >
      <StepIndicator steps={stepLabels} current={step} c={c} />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <FormProvider {...methods}>{stepContent}</FormProvider>
      </ScrollView>
    </CustomModal>
  );
}

function StepIndicator({
  steps,
  current,
  c,
}: {
  steps: string[];
  current: number;
  c: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.stepIndicator}>
      {steps.map((label, i) => {
        const isActive = i === current;
        const isDone = i < current;
        return (
          <View key={i} style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                {
                  backgroundColor: isActive || isDone ? c.primary : c.backgroundStrong,
                  borderColor: isActive || isDone ? c.primary : c.border,
                },
              ]}
            >
              <Text style={[styles.stepDotText, { color: isActive || isDone ? c.primaryForeground : c.textMuted }]}>
                {isDone ? "✓" : String(i + 1)}
              </Text>
            </View>
            <Text
              style={[
                styles.stepLabel,
                { color: isActive ? c.text : c.textMuted },
              ]}
            >
              {label}
            </Text>
            {i < steps.length - 1 && (
              <View style={[styles.stepLine, { backgroundColor: i < current ? c.primary : c.border }]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  stepItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: "700",
  },
  stepLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: "500",
    flexShrink: 1,
  },
  stepLine: {
    flex: 1,
    height: 1.5,
    marginHorizontal: SPACING.xs,
  },
  scroll: {
    maxHeight: 420,
  },
  footer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    flexDirection: "row",
  },
  footerRight: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
});
