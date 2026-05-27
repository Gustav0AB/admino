import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { FeatureShell } from "@/shared/components/shell/FeatureShell";
import { useAuthStore } from "@/shared/store/authStore";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";
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
  { key: "gastos", label: "Todos los gastos" },
  { key: "fijos", label: "Fijos" },
  { key: "vacaciones", label: "Vacaciones" },
  { key: "tarjetas", label: "Tarjetas" },
  { key: "resumen", label: "Resumen" },
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

  const { scheduledExpenses, vacations, installmentPayments } = usePlanningStore();

  const { isConnected } = useNetworkStatus();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextAutoSave = useRef(false);
  const hasPendingSync = useRef(false);
  // Block auto-save until the initial GET has settled (success or failure)
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!userId) return;
    expensesApi
      .get()
      .then((res) => {
        const appData = res.data as AppData;
        if (appData && Array.isArray(appData.expenses)) {
          skipNextAutoSave.current = true;
          loadAppData(appData);
        }
      })
      .catch((err) => console.error("[ExpensesScreen] Fetch error:", err))
      .finally(() => {
        initialLoadDone.current = true;
      });
  }, [userId]);

  useEffect(() => {
    // Never save before the initial fetch completes — avoids PUT with empty data on mount
    if (!initialLoadDone.current) return;
    if (skipNextAutoSave.current) {
      skipNextAutoSave.current = false;
      return;
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      expensesApi.put(getAppData()).catch(() => {
        if (Platform.OS !== "web") hasPendingSync.current = true;
      });
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [expenses, creditCards, recurringExpenses, scheduledExpenses, vacations, installmentPayments, initialCreditDebt, creditCutDay, creditPayDay]);

  // On mobile: flush any pending save once connectivity is restored
  useEffect(() => {
    if (Platform.OS === "web" || !isConnected || !hasPendingSync.current) return;
    hasPendingSync.current = false;
    expensesApi.put(getAppData()).catch(() => {
      hasPendingSync.current = true;
    });
  }, [isConnected]);

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
