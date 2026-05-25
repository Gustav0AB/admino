import { useEffect, useRef, useState } from "react";
import { FeatureShell } from "@/shared/components/shell/FeatureShell";
import { useAuthStore } from "@/shared/store/authStore";
import { expensesApi } from "../api";
import { ExpenseFilters } from "../components/ExpenseFilters";
import { ExpenseList } from "../components/ExpenseList";
import { CreditCardsTab } from "../components/CreditCardsTab";
import { FijosTab } from "../components/FijosTab";
import { ResumenTab } from "../components/ResumenTab";
import { useExpensesStore } from "../store";
import { usePlanningStore } from "@/features/expenses/planning/store";
import { VacationPlanner } from "@/features/expenses/planning/components/VacationPlanner";
import type { AppData } from "../types";

const DEBOUNCE_MS = 1500;

const TABS = [
  { key: "gastos", label: "Gastos" },
  { key: "resumen", label: "Resumen" },
  { key: "fijos", label: "Fijos" },
  { key: "vacaciones", label: "Vacaciones" },
  { key: "tarjetas", label: "Tarjetas" },
];

export function ExpensesScreen() {
  const [activeTab, setActiveTab] = useState("gastos");
  const userId = useAuthStore((s) => s.user?.id);

  const {
    expenses,
    creditCards,
    recurringExpenses,
    initialCreditDebt,
    creditCutDay,
    creditPayDay,
    getAppData,
    loadAppData,
  } = useExpensesStore();

  const { scheduledExpenses, vacations } = usePlanningStore();

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextAutoSave = useRef(false);

  useEffect(() => {
    if (!userId) return;
    expensesApi
      .get()
      .then((data) => {
        const appData = data as AppData;
        if (appData && Array.isArray(appData.expenses)) {
          skipNextAutoSave.current = true;
          loadAppData(appData);
        }
      })
      .catch((err) => console.error("[ExpensesScreen] Fetch error:", err));
  }, [userId]);

  useEffect(() => {
    if (skipNextAutoSave.current) {
      skipNextAutoSave.current = false;
      return;
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      expensesApi.put(getAppData()).catch(() => {});
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [expenses, creditCards, recurringExpenses, scheduledExpenses, vacations, initialCreditDebt, creditCutDay, creditPayDay]);

  return (
    <FeatureShell
      title="Finanzas"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabUrlKey="fin-view"
      filters={activeTab === "gastos" ? <ExpenseFilters /> : undefined}
    >
      {activeTab === "gastos" && <ExpenseList />}
      {activeTab === "resumen" && <ResumenTab />}
      {activeTab === "fijos" && <FijosTab />}
      {activeTab === "vacaciones" && <VacationPlanner />}
      {activeTab === "tarjetas" && <CreditCardsTab />}
    </FeatureShell>
  );
}
