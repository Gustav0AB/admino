import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { CustomModal } from "@/shared/components/feedback/CustomModal";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { CustomInput } from "@/shared/components/inputs/CustomInput";
import { CustomDatePicker } from "@/shared/components/inputs/CustomDatePicker";
import { SPACING } from "@/shared/theme/tokens";
import { recoverySchema } from "../types";
import { useMarkRecovered } from "../hooks/useInjuries";
import type { InjuryRecord, RecoveryValues } from "../types";

function ep(msg: string | undefined): { error: string } | Record<string, never> {
  return msg !== undefined ? { error: msg } : {};
}

type RecoveryModalProps = {
  injury: InjuryRecord | null;
  open: boolean;
  onClose: () => void;
};

export function RecoveryModal({ injury, open, onClose }: RecoveryModalProps) {
  const { t } = useTranslation();
  const { mutate: markRecovered, isPending } = useMarkRecovered();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecoveryValues>({
    resolver: zodResolver(recoverySchema),
    defaultValues: { notes: "", recoveredAt: new Date().toISOString().split("T")[0] ?? "" },
  });

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  function onSubmit(values: RecoveryValues) {
    if (!injury) return;
    markRecovered({ id: injury.id, ...values }, { onSuccess: onClose });
  }

  return (
    <CustomModal
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      title={t("injuries.markRecovered")}
      size="sm"
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
            {t("injuries.confirmRecovery")}
          </CustomButton>
        </View>
      }
    >
      <View style={styles.body}>
        <Controller
          control={control}
          name="recoveredAt"
          render={({ field }) => (
            <CustomDatePicker
              label={t("injuries.recoveredAt")}
              {...(field.value ? { value: new Date(field.value) } : {})}
              onChange={(d: Date) => field.onChange(d.toISOString().split("T")[0] ?? "")}
              {...ep(errors.recoveredAt?.message)}
            />
          )}
        />
        <Controller
          control={control}
          name="notes"
          render={({ field }) => (
            <CustomInput
              label={t("injuries.recoveryNotes")}
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
  footer: {
    flexDirection: "row",
    gap: SPACING.sm,
    justifyContent: "flex-end",
  },
});
