import { useEffect, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { FeatureShell } from "@/shared/components/shell/FeatureShell";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
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

const TABS = [
  { key: "gastos", label: "Todos los gastos" },
  { key: "fijos", label: "Fijos" },
  { key: "ingresos", label: "Ingresos" },
  { key: "cuentas", label: "Cuentas" },
  { key: "vacaciones", label: "Vacaciones" },
  { key: "resumen", label: "Resumen" },
];

type SyncStatus = "idle" | "saving" | "saved" | "error";

function SyncIndicator({ status }: { status: SyncStatus }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === "saved") {
      opacity.setValue(1);
      const timer = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }).start();
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      opacity.setValue(1);
    }
  }, [status]);

  if (status === "idle") return null;

  const config: Record<Exclude<SyncStatus, "idle">, { label: string; dot: string; bg: string; text: string }> = {
    saving: { label: "Guardando…", dot: "#F59E0B", bg: "#F59E0B18", text: "#92400E" },
    saved:  { label: "Guardado",   dot: "#16A34A", bg: "#16A34A18", text: "#166534" },
    error:  { label: "Error al guardar", dot: "#EF4444", bg: "#EF444418", text: "#991B1B" },
  };
  const cfg = config[status];

  return (
    <Animated.View style={[styles.syncBadge, { backgroundColor: cfg.bg, opacity }]}>
      <View style={[styles.syncDot, { backgroundColor: cfg.dot }]} />
      <Text style={[styles.syncLabel, { color: cfg.text }]}>{cfg.label}</Text>
    </Animated.View>
  );
}

export function ExpensesScreen() {
  const [activeTab, setActiveTab] = useState("gastos");
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
    setSyncStatus("saving");
    debounceTimer.current = setTimeout(() => {
      expensesApi.put(getAppData())
        .then(() => setSyncStatus("saved"))
        .catch(() => {
          setSyncStatus("error");
          if (Platform.OS !== "web") hasPendingSync.current = true;
        });
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [expenses, creditCards, recurringExpenses, incomes, accounts, scheduledExpenses, vacations, installmentPayments, initialCreditDebt, creditCutDay, creditPayDay]);

  // On mobile: flush any pending save once connectivity is restored
  useEffect(() => {
    if (Platform.OS === "web" || !isConnected || !hasPendingSync.current) return;
    hasPendingSync.current = false;
    setSyncStatus("saving");
    expensesApi.put(getAppData())
      .then(() => setSyncStatus("saved"))
      .catch(() => {
        hasPendingSync.current = true;
        setSyncStatus("error");
      });
  }, [isConnected]);

  return (
    <FeatureShell
      title="Finanzas"
      titleExtra={<SyncIndicator status={syncStatus} />}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabUrlKey="fin-view"
      filters={activeTab === "gastos" ? <ExpenseFilters /> : undefined}
    >
      {activeTab === "gastos" && <ExpenseList />}
      {activeTab === "resumen" && <ResumenTab />}
      {activeTab === "fijos" && <FijosTab />}
      {activeTab === "ingresos" && <IncomesTab />}
      {activeTab === "cuentas" && <CuentasTab />}
      {activeTab === "vacaciones" && <VacationPlanner />}
    </FeatureShell>
  );
}

const styles = StyleSheet.create({
  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.xs,
  },
  syncDot: { width: 6, height: 6, borderRadius: 3 },
  syncLabel: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },
});
