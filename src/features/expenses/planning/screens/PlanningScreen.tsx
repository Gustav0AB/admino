import { useState } from "react";
import { FeatureShell } from "@/shared/components/shell/FeatureShell";
import { VacationPlanner } from "../components/VacationPlanner";
import { ScheduledExpensesList } from "../components/ScheduledExpensesList";

const TABS = [
  { key: "vacations", label: "Vacaciones" },
  { key: "scheduled", label: "Gastos Programados" },
];

export function PlanningScreen() {
  const [activeTab, setActiveTab] = useState("vacations");

  return (
    <FeatureShell
      title="Planeación"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabUrlKey="plan-view"
    >
      {activeTab === "vacations" ? <VacationPlanner /> : <ScheduledExpensesList />}
    </FeatureShell>
  );
}
