import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";
import { Platform } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useAuthStore } from "@/shared/store/authStore";
import type {
  PlanningData,
  ScheduledExpense,
  VacationDay,
  VacationPlan,
} from "./types";

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

type PlanningState = {
  vacations: VacationPlan[];
  scheduledExpenses: ScheduledExpense[];

  // Vacation actions
  addVacation: (plan: Omit<VacationPlan, "id" | "days">) => void;
  updateVacation: (id: string, patch: Partial<VacationPlan>) => void;
  removeVacation: (id: string) => void;
  addVacationDay: (vacationId: string, day: Omit<VacationDay, "id">) => void;
  updateVacationDay: (vacationId: string, dayId: string, patch: Partial<VacationDay>) => void;
  removeVacationDay: (vacationId: string, dayId: string) => void;

  // Scheduled expense actions
  addScheduledExpense: (expense: Omit<ScheduledExpense, "id">) => void;
  updateScheduledExpense: (id: string, patch: Partial<ScheduledExpense>) => void;
  removeScheduledExpense: (id: string) => void;

  // Persist helpers
  getPlanningData: () => PlanningData;
  loadPlanningData: (data: PlanningData) => void;
  clearAll: () => void;
  rehydrate: () => Promise<void>;
};

export const usePlanningStore = create<PlanningState>()(
  persist(
    (set, get) => ({
      vacations: [],
      scheduledExpenses: [],

      addVacation: (plan) =>
        set((s) => ({
          vacations: [
            ...s.vacations,
            {
              ...plan,
              id: randomUUID(),
              days: [],
              persons: plan.persons ?? [],
              tasks: plan.tasks ?? [],
              payments: plan.payments ?? [],
            },
          ],
        })),

      updateVacation: (id, patch) =>
        set((s) => ({
          vacations: s.vacations.map((v) => (v.id === id ? { ...v, ...patch } : v)),
        })),

      removeVacation: (id) =>
        set((s) => ({ vacations: s.vacations.filter((v) => v.id !== id) })),

      addVacationDay: (vacationId, day) =>
        set((s) => ({
          vacations: s.vacations.map((v) =>
            v.id === vacationId
              ? { ...v, days: [...v.days, { ...day, id: randomUUID() }] }
              : v
          ),
        })),

      updateVacationDay: (vacationId, dayId, patch) =>
        set((s) => ({
          vacations: s.vacations.map((v) =>
            v.id === vacationId
              ? {
                  ...v,
                  days: v.days.map((d) => (d.id === dayId ? { ...d, ...patch } : d)),
                }
              : v
          ),
        })),

      removeVacationDay: (vacationId, dayId) =>
        set((s) => ({
          vacations: s.vacations.map((v) =>
            v.id === vacationId
              ? { ...v, days: v.days.filter((d) => d.id !== dayId) }
              : v
          ),
        })),

      addScheduledExpense: (expense) =>
        set((s) => ({
          scheduledExpenses: [...s.scheduledExpenses, { ...expense, id: randomUUID() }],
        })),

      updateScheduledExpense: (id, patch) =>
        set((s) => ({
          scheduledExpenses: s.scheduledExpenses.map((e) =>
            e.id === id ? { ...e, ...patch } : e
          ),
        })),

      removeScheduledExpense: (id) =>
        set((s) => ({
          scheduledExpenses: s.scheduledExpenses.filter((e) => e.id !== id),
        })),

      getPlanningData: () => {
        const s = get();
        return {
          vacations: s.vacations,
          scheduledExpenses: s.scheduledExpenses,
          savedAt: new Date().toISOString(),
        };
      },

      loadPlanningData: (data) =>
        set({
          vacations: data.vacations ?? [],
          scheduledExpenses: data.scheduledExpenses ?? [],
        }),

      clearAll: () => set({ vacations: [], scheduledExpenses: [] }),

      rehydrate: async () => {
        await usePlanningStore.persist.rehydrate();
      },
    }),
    {
      name: "planning",
      storage: userScopedStorage,
    }
  )
);
