import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { FeatureShell } from "@/shared/components/shell/FeatureShell";
import { SPACING } from "@/shared/theme/tokens";
import { useTrainingPlans } from "./hooks/useTrainingPlans";
import { PlansTable } from "./components/PlansTable";
import { PlanWizard } from "./components/PlanWizard";
import { ClonePlanModal } from "./components/ClonePlanModal";
import type { TrainingPlan } from "./types";

export function TrainingPlanningScreen() {
  const { t } = useTranslation();
  const { data: plans, isLoading, isFetching } = useTrainingPlans();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [cloneTarget, setCloneTarget] = useState<TrainingPlan | null>(null);

  return (
    <FeatureShell
      title={t("trainingPlanning.title")}
      saveActions={[
        {
          label: t("trainingPlanning.newPlan"),
          type: "primary",
          onClick: () => setWizardOpen(true),
        },
      ]}
    >
      <View style={styles.content}>
        <PlansTable
          data={plans ?? []}
          isLoading={isLoading}
          isFetching={isFetching}
          onClone={(plan) => setCloneTarget(plan)}
        />
      </View>

      <PlanWizard open={wizardOpen} onOpenChange={setWizardOpen} />

      <ClonePlanModal
        plan={cloneTarget}
        open={cloneTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCloneTarget(null);
        }}
      />
    </FeatureShell>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.md,
  },
});
