import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useColors } from "@/shared/hooks/useColors";
import { CustomModal } from "@/shared/components/feedback/CustomModal";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { CustomInput } from "@/shared/components/inputs/CustomInput";
import { CustomSelect } from "@/shared/components/inputs/CustomSelect";
import { useApiQuery } from "@/shared/api/useApiQuery";
import { mockGetAthletes } from "@/shared/api/mocks/athletes";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import {
  biometricsSchema,
  type BiometricsFormValues,
  type CompetitionEvent,
  type AthleteStatus,
} from "../types";
import { useLogBiometrics } from "../hooks/useEvents";
import { WEIGHT_CATEGORIES } from "../utils/eventUtils";

function ep(msg: string | undefined): { error: string } | Record<string, never> {
  return msg !== undefined ? { error: msg } : {};
}

const CATEGORY_OPTIONS = WEIGHT_CATEGORIES.map((c) => ({ label: c, value: c }));

const ATHLETE_STATUS_OPTIONS: { label: string; value: AthleteStatus }[] = [
  { label: "Fit", value: "fit" },
  { label: "Injured", value: "injured" },
  { label: "Questionable", value: "questionable" },
];

const STATUS_COLORS: Record<AthleteStatus, string> = {
  fit: "#10B981",
  injured: "#EF4444",
  questionable: "#F59E0B",
};

type BiometricsFormModalProps = {
  event: CompetitionEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BiometricsFormModal({
  event,
  open,
  onOpenChange,
}: BiometricsFormModalProps) {
  const { t } = useTranslation();
  const c = useColors();
  const { mutate: logBiometrics, isPending } = useLogBiometrics();

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
    watch,
    formState: { errors },
  } = useForm<BiometricsFormValues>({
    resolver: zodResolver(biometricsSchema),
    defaultValues: {
      athleteId: "",
      weight: 0,
      category: "",
      status: "fit",
      notes: "",
    },
  });

  const selectedStatus = watch("status");

  function handleClose() {
    onOpenChange(false);
    reset();
  }

  function onSubmit(values: BiometricsFormValues) {
    if (!event) return;
    logBiometrics({ ...values, eventId: event.id }, { onSuccess: handleClose });
  }

  return (
    <CustomModal
      open={open}
      onOpenChange={handleClose}
      title={`${t("events.logBiometrics")}`}
      size="md"
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
            {t("common.save")}
          </CustomButton>
        </View>
      }
    >
      {event && (
        <View style={[styles.eventBadge, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
          <Text style={[styles.eventLabel, { color: c.textMuted }]}>
            {t("events.logBiometricsFor")}
          </Text>
          <Text style={[styles.eventTitle, { color: c.text }]}>{event.title}</Text>
        </View>
      )}

      <Controller
        control={control}
        name="athleteId"
        render={({ field }) => (
          <CustomSelect
            label={t("events.selectAthlete")}
            placeholder={t("events.selectAthlete")}
            options={athleteOptions}
            value={field.value}
            onChange={(v) => field.onChange(v as string)}
            {...ep(errors.athleteId?.message)}
          />
        )}
      />

      <View style={styles.row}>
        <Controller
          control={control}
          name="weight"
          render={({ field }) => (
            <CustomInput
              label={t("events.weight")}
              value={field.value === 0 ? "" : String(field.value)}
              onChangeText={(v) => field.onChange(parseFloat(v) || 0)}
              onBlur={field.onBlur}
              keyboardType="numeric"
              placeholder="e.g. 72.5"
              containerStyle={styles.halfField}
              {...ep(errors.weight?.message)}
            />
          )}
        />
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <CustomSelect
              label={t("events.weightCategory")}
              placeholder="Select"
              options={CATEGORY_OPTIONS}
              value={field.value}
              onChange={(v) => field.onChange(v as string)}
              style={styles.halfField}
              {...ep(errors.category?.message)}
            />
          )}
        />
      </View>

      <View style={styles.statusSection}>
        <Text style={[styles.statusLabel, { color: c.text }]}>
          {t("events.athleteStatus")}
        </Text>
        <View style={styles.statusRow}>
          {ATHLETE_STATUS_OPTIONS.map((opt) => {
            const isSelected = selectedStatus === opt.value;
            const color = STATUS_COLORS[opt.value];
            return (
              <Controller
                key={opt.value}
                control={control}
                name="status"
                render={({ field }) => (
                  <TouchableOpacity
                    onPress={() => field.onChange(opt.value)}
                    style={[
                      styles.statusChip,
                      {
                        borderColor: isSelected ? color : c.border,
                        backgroundColor: isSelected ? color + "1A" : "transparent",
                      },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text style={[styles.statusChipText, { color: isSelected ? color : c.textMuted }]}>
                      {t(`events.${opt.value}` as never)}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            );
          })}
        </View>
        {errors.status?.message && (
          <Text style={[styles.errorText, { color: c.danger }]}>
            {errors.status.message}
          </Text>
        )}
      </View>

      <Controller
        control={control}
        name="notes"
        render={({ field }) => (
          <CustomInput
            label={t("events.notes")}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="Optional notes…"
            multiline
            numberOfLines={2}
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
  eventBadge: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  eventLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  eventTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  halfField: {
    flex: 1,
  },
  statusSection: {
    gap: SPACING.xs,
  },
  statusLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "500",
  },
  statusRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    flexWrap: "wrap",
  },
  statusChip: {
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  statusChipText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
});
