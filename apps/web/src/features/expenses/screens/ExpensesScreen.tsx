import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/shared/store/authStore";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";
import { expensesApi } from "../api";
import { ExpenseFilters } from "../components/ExpenseFilters";
import { ExpenseList } from "../components/ExpenseList";
import { CuentasTab } from "../components/CuentasTab";
import { FijosTab } from "../components/FijosTab";
import { IncomesTab } from "../components/IncomesTab";
import { ResumenTab } from "../components/ResumenTab";
import { useExpensesStore } from "../store";
import { usePlanningStore } from "@/features/expenses/planning/store";
import { VacationPlanner } from "@/features/expenses/planning/components/VacationPlanner";
import type { AppData } from "../types";

const DEBOUNCE_MS = 1500;

export const EXPENSE_TABS = [
  { key: "gastos", label: "Todos los gastos" },
  { key: "fijos", label: "Gastos Fijos" },
  { key: "ingresos", label: "Ingresos" },
  { key: "cuentas", label: "Cuentas" },
  { key: "vacaciones", label: "Vacaciones" },
  { key: "resumen", label: "Resumen" },
] as const;

export type ExpenseTab = (typeof EXPENSE_TABS)[number]["key"];
type SyncStatus = "idle" | "saving" | "saved" | "error";

const syncConfig: Record<Exclude<SyncStatus, "idle">, { label: string; className: string }> = {
  saving: { label: "Guardando…", className: "bg-amber-50 text-amber-800" },
  saved: { label: "Guardado", className: "bg-green-50 text-green-800" },
  error: { label: "Error al guardar", className: "bg-red-50 text-red-800" },
};

function SyncIndicator({ status }: { status: SyncStatus }) {
  if (status === "idle") return null;
  const cfg = syncConfig[status];
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${cfg.className}`}>{cfg.label}</span>;
}

export function ExpensesScreen({ activeTab = "gastos" }: { activeTab?: ExpenseTab }) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const userId = useAuthStore((s) => s.user?.id);

  const {
    expenses,
    creditCards,
    recurringExpenses,
    incomes,
    accounts,
    initialCreditDebt,
    creditCutDay,
    creditPayDay,
    getAppData,
    loadAppData,
  } = useExpensesStore();

  const { scheduledExpenses, vacations, installmentPayments } = usePlanningStore();
  const { isConnected } = useNetworkStatus();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPendingSync = useRef(false);
  const skipNextAutoSave = useRef(false);
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
      .catch((err) => console.error("[Finanzas] Error al cargar:", err))
      .finally(() => {
        initialLoadDone.current = true;
      });
  }, [loadAppData, userId]);

  useEffect(() => {
    if (!initialLoadDone.current) return;
    if (skipNextAutoSave.current) {
      skipNextAutoSave.current = false;
      return;
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setSyncStatus("saving");
    debounceTimer.current = setTimeout(() => {
      expensesApi.put(getAppData())
        .then(() => setSyncStatus("saved"))
        .catch(() => {
          setSyncStatus("error");
          hasPendingSync.current = true;
        });
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [expenses, creditCards, recurringExpenses, incomes, accounts, scheduledExpenses, vacations, installmentPayments, initialCreditDebt, creditCutDay, creditPayDay, getAppData]);

  useEffect(() => {
    if (!isConnected || !hasPendingSync.current) return;
    hasPendingSync.current = false;
    setSyncStatus("saving");
    expensesApi.put(getAppData())
      .then(() => setSyncStatus("saved"))
      .catch(() => {
        hasPendingSync.current = true;
        setSyncStatus("error");
      });
  }, [getAppData, isConnected]);

  return (
    <div className="page feature-page">
      <header className="feature-header">
        <div>
          <p className="eyebrow">Finanzas</p>
          <h1 className="page-title">{EXPENSE_TABS.find((tab) => tab.key === activeTab)?.label}</h1>
        </div>
        <SyncIndicator status={syncStatus} />
      </header>

      {activeTab === "gastos" && <ExpenseFilters />}
      <div className="feature-content">
        {activeTab === "gastos" && <ExpenseList />}
        {activeTab === "resumen" && <ResumenTab />}
        {activeTab === "fijos" && <FijosTab />}
        {activeTab === "ingresos" && <IncomesTab />}
        {activeTab === "cuentas" && <CuentasTab />}
        {activeTab === "vacaciones" && <VacationPlanner />}
      </div>
    </div>
  );
}
