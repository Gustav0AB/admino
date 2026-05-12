import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";
import { Platform } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useAuthStore } from "@/shared/store/authStore";
import { currentMonthName, buildAppData } from "./helpers";
import type { AppData, Estado, Expense, Frecuencia, MetodoPago } from "./types";

function getUserId() {
  return useAuthStore.getState().user?.id ?? "anonymous";
}

const userScopedStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    const key = `${name}-${getUserId()}`;
    if (Platform.OS === "web") return Promise.resolve(localStorage.getItem(key));
    return AsyncStorage.getItem(key);
  },
  setItem: (name: string, value: string) => {
    const key = `${name}-${getUserId()}`;
    if (Platform.OS === "web") { localStorage.setItem(key, value); return Promise.resolve(); }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (name: string) => {
    const key = `${name}-${getUserId()}`;
    if (Platform.OS === "web") { localStorage.removeItem(key); return Promise.resolve(); }
    return AsyncStorage.removeItem(key);
  },
}));

function blankExpense(): Expense {
  return {
    id: randomUUID(),
    mes: currentMonthName(),
    gastos: "",
    monto: 0,
    metodoPago: "efectivo",
    frecuencia: "mes",
    fecha: 0,
    fechaMaxima: "",
    estado: "no pagado",
    selected: true,
  };
}

type ExpensesState = {
  expenses: Expense[];
  filterMes: string;
  filterFrecuencia: string;
  filterFecha: number;
  initialCreditDebt: number;
  creditDebtMes: string;
  creditCutDay: number;
  creditPayDay: number;

  setExpenses: (expenses: Expense[]) => void;
  setFilterMes: (v: string) => void;
  setFilterFrecuencia: (v: string) => void;
  setFilterFecha: (v: number) => void;
  setInitialCreditDebt: (v: number) => void;
  setCreditDebtMes: (v: string) => void;
  setCreditCutDay: (v: number) => void;
  setCreditPayDay: (v: number) => void;

  addExpense: () => void;
  removeExpense: (id: string) => void;
  updateExpense: (id: string, field: keyof Expense, value: unknown) => void;
  toggleSelected: (id: string) => void;
  selectAll: (selected: boolean) => void;
  duplicateExpense: (id: string, targetMeses: string[]) => void;
  bulkDuplicateExpenses: (targetMeses: string[]) => void;
  bulkUpdateEstado: (estado: Estado) => void;
  bulkAddExpenses: (text: string, defaultMes: string) => number;
  getAppData: () => AppData;
  loadAppData: (data: AppData) => void;
  clearAll: () => void;
  rehydrate: () => Promise<void>;
};

export const useExpensesStore = create<ExpensesState>()(
  persist(
    (set, get) => ({
      expenses: [],
      filterMes: currentMonthName(),
      filterFrecuencia: "Todos",
      filterFecha: 0,
      initialCreditDebt: 0,
      creditDebtMes: currentMonthName(),
      creditCutDay: 0,
      creditPayDay: 0,

      setExpenses: (expenses) => set({ expenses }),
      setFilterMes: (filterMes) => set({ filterMes }),
      setFilterFrecuencia: (filterFrecuencia) => set({ filterFrecuencia }),
      setFilterFecha: (filterFecha) => set({ filterFecha }),
      setInitialCreditDebt: (initialCreditDebt) => set({ initialCreditDebt }),
      setCreditDebtMes: (creditDebtMes) => set({ creditDebtMes }),
      setCreditCutDay: (creditCutDay) => set({ creditCutDay }),
      setCreditPayDay: (creditPayDay) => set({ creditPayDay }),

      addExpense: () =>
        set((s) => ({ expenses: [...s.expenses, blankExpense()] })),

      removeExpense: (id) =>
        set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      updateExpense: (id, field, value) =>
        set((s) => ({
          expenses: s.expenses.map((e) =>
            e.id === id ? { ...e, [field]: value } : e
          ),
        })),

      toggleSelected: (id) =>
        set((s) => ({
          expenses: s.expenses.map((e) =>
            e.id === id ? { ...e, selected: !e.selected } : e
          ),
        })),

      selectAll: (selected) =>
        set((s) => ({ expenses: s.expenses.map((e) => ({ ...e, selected })) })),

      duplicateExpense: (id, targetMeses) => {
        const { expenses } = get();
        const idx = expenses.findIndex((e) => e.id === id);
        if (idx === -1) return;
        const source = expenses[idx];
        const copies = targetMeses.map((mes) => ({
          ...source,
          id: randomUUID(),
          mes,
          selected: false,
        }));
        const next = [...expenses];
        next.splice(idx + 1, 0, ...copies);
        set({ expenses: next });
      },

      bulkDuplicateExpenses: (targetMeses) => {
        const { expenses } = get();
        const selected = expenses.filter((e) => e.selected);
        const copies = selected.flatMap((source) =>
          targetMeses.map((mes) => ({
            ...source,
            id: randomUUID(),
            mes,
            selected: false,
          }))
        );
        set({ expenses: [...expenses, ...copies] });
      },

      bulkUpdateEstado: (estado) =>
        set((s) => ({
          expenses: s.expenses.map((e) =>
            e.selected ? { ...e, estado } : e
          ),
        })),

      bulkAddExpenses: (text, defaultMes) => {
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
        const newExpenses: Expense[] = [];

        for (const line of lines) {
          const parts = line.split(",").map((p) => p.trim());
          if (parts.length < 2) continue;

          const [gastos = "", montoRaw = "0", fechaRaw = "0", metodoPagoRaw = "efectivo"] = parts;
          const monto = parseFloat(montoRaw.replace(/[^0-9.]/g, "")) || 0;

          let fecha: 0 | 15 | 30 = 0;
          const f = parseInt(fechaRaw, 10);
          if (f === 15) fecha = 15;
          else if (f === 30) fecha = 30;

          const metodoPago: MetodoPago =
            metodoPagoRaw.toLowerCase().includes("cred") ? "credito" : "efectivo";

          newExpenses.push({
            id: randomUUID(),
            mes: defaultMes,
            gastos,
            monto,
            metodoPago,
            frecuencia: "mes" as Frecuencia,
            fecha,
            fechaMaxima: "",
            estado: "no pagado",
            selected: true,
          });
        }

        set((s) => ({ expenses: [...s.expenses, ...newExpenses] }));
        return newExpenses.length;
      },

      getAppData: () => {
        const s = get();
        return buildAppData(
          s.expenses,
          s.initialCreditDebt,
          s.creditDebtMes,
          s.creditCutDay,
          s.creditPayDay
        );
      },

      loadAppData: (data: AppData) =>
        set({
          expenses: data.expenses ?? [],
          initialCreditDebt: data.creditDebt ?? 0,
          creditDebtMes: data.creditDebtMes ?? currentMonthName(),
          creditCutDay: data.creditCutDay ?? 0,
          creditPayDay: data.creditPayDay ?? 0,
        }),

      clearAll: () =>
        set({
          expenses: [],
          filterMes: currentMonthName(),
          filterFrecuencia: "Todos",
          filterFecha: 0,
          initialCreditDebt: 0,
          creditDebtMes: currentMonthName(),
          creditCutDay: 0,
          creditPayDay: 0,
        }),

      rehydrate: async () => {
        await useExpensesStore.persist.rehydrate();
      },
    }),
    {
      name: "expenses",
      storage: userScopedStorage,
    }
  )
);
