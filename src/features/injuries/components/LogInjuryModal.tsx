import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { CustomModal } from "@/shared/components/feedback/CustomModal";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { CustomInput } from "@/shared/components/inputs/CustomInput";
import { CustomSelect } from "@/shared/components/inputs/CustomSelect";
import { CustomDatePicker } from "@/shared/components/inputs/CustomDatePicker";
import { SPACING } from "@/shared/theme/tokens";
import { logInjurySchema, type LogInjuryValues } from "../types";
import { useLogInjury } from "../hooks/useInjuries";
import type { Athlete } from "@/shared/types/api";

function ep(msg: string | undefined): { error: string } | Record<string, never> {
  return msg !== undefined ? { error: msg } : {};
}

type LogInjuryModalProps = {
  open: boolean;
  onClose: () => void;
  athletes: Athlete[];
  defaultAthleteId?: string;
};

const BODY_PART_OPTIONS = [
  "shoulder", "knee", "ankle", "back", "hip",
  "wrist", "neck", "hamstring", "quadriceps", "calf", "other",
] as const;

const SEVERITY_OPTIONS = ["mild", "moderate", "severe"] as const;

export function LogInjuryModal({ open, onClose, athletes, defaultAthleteId }: LogInjuryModalProps) {
  const { t } = useTranslation();
  const { mutate: logInjury, isPending } = useLogInjury();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LogInjuryValues>({
    resolver: zodResolver(logInjurySchema),
    defaultValues: {
      athleteId: defaultAthleteId ?? "",
      bodyPart: "knee",
      severity: "mild",
      occurredAt: new Date().toISOString().split("T")[0] ?? "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  function onSubmit(values: LogInjuryValues) {
    logInjury(values, { onSuccess: onClose });
  }

  const athleteOptions = athletes.map((a) => ({ label: a.name, value: a.id }));
  const bodyPartOptions = BODY_PART_OPTIONS.map((bp) => ({
    label: t(`injuries.${bp}`),
    value: bp,
  }));
  const severityOptions = SEVERITY_OPTIONS.map((s) => ({
    label: t(`injuries.${s}`),
    value: s,
  }));

  return (
    <CustomModal
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      title={t("injuries.logInjury")}
      size="md"
      footer={
        <View style={styles.footer}>
          <CustomButton variant="outline" size="sm" onPress={onClose}>
            {t("common.cancel")}
          </CustomButton>
          <CustomButton
            variant="primary"
            size="sm"
            onPress={handleSubmit(onSubmit)}
            disabled={isPending}
          >
            {t("common.save")}
          </CustomButton>
        </View>
      }
    >
      <View style={styles.body}>
        {!defaultAthleteId && (
          <Controller
            control={control}
            name="athleteId"
            render={({ field }) => (
              <CustomSelect
                label={t("injuries.athlete")}
                options={athleteOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder={t("injuries.selectAthlete")}
                {...ep(errors.athleteId?.message)}
              />
            )}
          />
        )}

        <View style={styles.row}>
          <View style={styles.flex}>
            <Controller
              control={control}
              name="bodyPart"
              render={({ field }) => (
                <CustomSelect
                  label={t("injuries.bodyPart")}
                  options={bodyPartOptions}
                  value={field.value}
                  onChange={field.onChange}
                  {...ep(errors.bodyPart?.message)}
                />
              )}
            />
          </View>
          <View style={styles.flex}>
            <Controller
              control={control}
              name="severity"
              render={({ field }) => (
                <CustomSelect
                  label={t("injuries.severity")}
                  options={severityOptions}
                  value={field.value}
                  onChange={field.onChange}
                  {...ep(errors.severity?.message)}
                />
              )}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="occurredAt"
          render={({ field }) => (
            <CustomDatePicker
              label={t("injuries.occurredAt")}
              {...(field.value ? { value: new Date(field.value) } : {})}
              onChange={(d: Date) => field.onChange(d.toISOString().split("T")[0] ?? "")}
              {...ep(errors.occurredAt?.message)}
            />
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field }) => (
            <CustomInput
              label={t("injuries.notes")}
              value={field.value}
              onChangeText={field.onChange}
              multiline
              numberOfLines={3}
              {...ep(errors.notes?.message)}
            />
          )}
        />
      </View>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: SPACING.md,
  },
  row: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  flex: {
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    gap: SPACING.sm,
    justifyContent: "flex-end",
  },
});
