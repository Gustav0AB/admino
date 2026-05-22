import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";
import { Platform } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useAuthStore } from "@/shared/store/authStore";
import { currentMonthName, buildAppData } from "./helpers";
import type { AppData, CreditCard, Estado, Expense, Frecuencia, MetodoPago } from "./types";
import { usePlanningStore } from "./planning/store";

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
  creditCards: CreditCard[];

  setExpenses: (expenses: Expense[]) => void;
  setFilterMes: (v: string) => void;
  setFilterFrecuencia: (v: string) => void;
  setFilterFecha: (v: number) => void;
  setInitialCreditDebt: (v: number) => void;
  setCreditDebtMes: (v: string) => void;
  setCreditCutDay: (v: number) => void;
  setCreditPayDay: (v: number) => void;

  addCreditCard: (card: Omit<CreditCard, "id">) => void;
  updateCreditCard: (id: string, patch: Partial<CreditCard>) => void;
  removeCreditCard: (id: string) => void;

  addExpense: () => void;
  removeExpense: (id: string) => void;
  updateExpense: (id: string, field: keyof Expense, value: unknown) => void;
  toggleSelected: (id: string) => void;
  selectAll: (selected: boolean) => void;
  duplicateExpense: (id: string, targetMeses: string[]) => void;
  bulkDuplicateExpenses: (targetMeses: string[]) => void;
  bulkUpdateEstado: (estado: Estado) => void;
  bulkAddExpenses: (text: string, defaultMes: string) => number;
  addExpenseFromModal: (data: Omit<Expense, "id" | "selected">) => void;
  updateExpenseFromModal: (id: string, data: Omit<Expense, "id" | "selected">) => void;
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
      creditCards: [],

      setExpenses: (expenses) => set({ expenses }),
      setFilterMes: (filterMes) => set({ filterMes }),
      setFilterFrecuencia: (filterFrecuencia) => set({ filterFrecuencia }),
      setFilterFecha: (filterFecha) => set({ filterFecha }),
      setInitialCreditDebt: (initialCreditDebt) => set({ initialCreditDebt }),
      setCreditDebtMes: (creditDebtMes) => set({ creditDebtMes }),
      setCreditCutDay: (creditCutDay) => set({ creditCutDay }),
      setCreditPayDay: (creditPayDay) => set({ creditPayDay }),

      addCreditCard: (card) =>
        set((s) => ({
          creditCards: [...s.creditCards, { ...card, id: randomUUID() }],
        })),

      updateCreditCard: (id, patch) =>
        set((s) => ({
          creditCards: s.creditCards.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        })),

      removeCreditCard: (id) =>
        set((s) => ({
          creditCards: s.creditCards.filter((c) => c.id !== id),
        })),

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
        if (!source) return;
        const copies: Expense[] = targetMeses.map((mes) => ({
          id: randomUUID(),
          mes,
          gastos: source.gastos,
          monto: source.monto,
          metodoPago: source.metodoPago,
          frecuencia: source.frecuencia,
          fecha: source.fecha,
          fechaMaxima: source.fechaMaxima,
          estado: source.estado,
          selected: false,
          ...(source.creditCardId ? { creditCardId: source.creditCardId } : {}),
        }));
        const next = [...expenses];
        next.splice(idx + 1, 0, ...copies);
        set({ expenses: next });
      },

      bulkDuplicateExpenses: (targetMeses) => {
        const { expenses } = get();
        const selectedExpenses = expenses.filter((e) => e.selected);
        const copies: Expense[] = selectedExpenses.flatMap((source) =>
          targetMeses.map((mes): Expense => ({
            id: randomUUID(),
            mes,
            gastos: source.gastos,
            monto: source.monto,
            metodoPago: source.metodoPago,
            frecuencia: source.frecuencia,
            fecha: source.fecha,
            fechaMaxima: source.fechaMaxima,
            estado: source.estado,
            selected: false,
            ...(source.creditCardId ? { creditCardId: source.creditCardId } : {}),
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

          const fecha = parseInt(fechaRaw, 10) || 0;

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

      addExpenseFromModal: (data) =>
        set((s) => ({
          expenses: [
            ...s.expenses,
            { ...data, id: randomUUID(), selected: true },
          ],
        })),

      updateExpenseFromModal: (id, data) =>
        set((s) => ({
          expenses: s.expenses.map((e) =>
            e.id === id ? { ...data, id, selected: e.selected } : e
          ),
        })),

      getAppData: () => {
        const s = get();
        const planningData = usePlanningStore.getState().getPlanningData();
        return buildAppData(
          s.expenses,
          s.initialCreditDebt,
          s.creditDebtMes,
          s.creditCutDay,
          s.creditPayDay,
          s.creditCards,
          planningData
        );
      },

      loadAppData: (data: AppData) => {
        let creditCards: CreditCard[] = [];
        if (data.creditCards && data.creditCards.length > 0) {
          creditCards = data.creditCards;
        } else if ((data.creditCutDay ?? 0) > 0 || (data.creditPayDay ?? 0) > 0) {
          creditCards = [
            {
              id: randomUUID(),
              name: "Tarjeta Principal",
              cutDay: data.creditCutDay ?? 0,
              payDay: data.creditPayDay ?? 0,
              initialDebt: data.creditDebt ?? 0,
              debtMes: data.creditDebtMes ?? currentMonthName(),
            },
          ];
        }
        set({
          expenses: data.expenses ?? [],
          initialCreditDebt: data.creditDebt ?? 0,
          creditDebtMes: data.creditDebtMes ?? currentMonthName(),
          creditCutDay: data.creditCutDay ?? 0,
          creditPayDay: data.creditPayDay ?? 0,
          creditCards,
        });
        if (data.planningData) {
          usePlanningStore.getState().loadPlanningData(data.planningData);
        }
      },

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
          creditCards: [],
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
