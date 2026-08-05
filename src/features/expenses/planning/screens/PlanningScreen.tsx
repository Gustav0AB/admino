import { useState } from "react";
import { VacationPlanner } from "../components/VacationPlanner";
import { ScheduledExpensesList } from "../components/ScheduledExpensesList";

const TABS = [
  { key: "vacations", label: "Vacaciones" },
  { key: "scheduled", label: "Gastos Programados" },
] as const;

type Tab = (typeof TABS)[number]["key"];

export function PlanningScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("vacations");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-900">Planeación</h1>
      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? "tab-active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeTab === "vacations" ? <VacationPlanner /> : <ScheduledExpensesList />}
      </div>
    </div>
  );
}
