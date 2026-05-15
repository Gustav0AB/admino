import { View, Text, StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useColors } from "@/shared/hooks/useColors";
import { CustomModal } from "@/shared/components/feedback/CustomModal";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { CustomSelect } from "@/shared/components/inputs/CustomSelect";
import { CustomInput } from "@/shared/components/inputs/CustomInput";
import { useApiQuery } from "@/shared/api/useApiQuery";
import { mockGetAthletes } from "@/shared/api/mocks/athletes";
import { SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { clonePlanSchema, type ClonePlanFormValues, type TrainingPlan } from "../types";
import { useClonePlan } from "../hooks/useTrainingPlans";
import { todayIso } from "../utils/planUtils";

function ep(msg: string | undefined): { error: string } | Record<string, never> {
  return msg !== undefined ? { error: msg } : {};
}

type ClonePlanModalProps = {
  plan: TrainingPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ClonePlanModal({ plan, open, onOpenChange }: ClonePlanModalProps) {
  const { t } = useTranslation();
  const c = useColors();
  const { mutate: clonePlan, isPending } = useClonePlan();

  const { data: athletesResponse } = useApiQuery(
    ["athletes"],
    "/api/athletes",
    mockGetAthletes
  );

  const athletes = athletesResponse?.data?.items ?? [];
  const athleteOptions = athletes
    .filter((a) => a.status === "active")
    .map((a) => ({ label: a.name, value: a.id }));

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClonePlanFormValues>({
    resolver: zodResolver(clonePlanSchema),
    defaultValues: {
      athleteId: "",
      startDate: todayIso(),
    },
  });

  function handleClose() {
    onOpenChange(false);
    reset();
  }

  function onSubmit(values: ClonePlanFormValues) {
    if (!plan) return;
    clonePlan(
      { planId: plan.id, athleteId: values.athleteId, startDate: values.startDate },
      { onSuccess: handleClose }
    );
  }

  return (
    <CustomModal
      open={open}
      onOpenChange={handleClose}
      title={t("trainingPlanning.clonePlan")}
      size="sm"
      footer={
        <View style={styles.footer}>
          <CustomButton variant="ghost" size="sm" onPress={handleClose}>
            {t("common.cancel")}
          </CustomButton>
          <CustomButton
            variant="primary"
            size="sm"
            onPress={handleSubmit(onSubmit)}
            loading={isPending}
          >
            {t("trainingPlanning.cloneConfirm")}
          </CustomButton>
        </View>
      }
    >
      {plan && (
        <Text style={[styles.planName, { color: c.textMuted }]}>
          {plan.name}
        </Text>
      )}

      <Controller
        control={control}
        name="athleteId"
        render={({ field }) => (
          <CustomSelect
            label={t("trainingPlanning.athlete")}
            placeholder={t("trainingPlanning.selectAthlete")}
            options={athleteOptions}
            value={field.value}
            onChange={(v) => field.onChange(v as string)}
            {...ep(errors.athleteId?.message)}
          />
        )}
      />

      <Controller
        control={control}
        name="startDate"
        render={({ field }) => (
          <CustomInput
            label={t("trainingPlanning.cloneStartDate")}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="YYYY-MM-DD"
            {...ep(errors.startDate?.message)}
          />
        )}
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
  planName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginBottom: SPACING.xs,
  },
});
