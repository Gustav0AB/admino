import { create } from "zustand";
import { persist } from "zustand/middleware";
import { userScopedStorage } from "@/shared/store/userScopedStorage";
import { randomId } from "@/features/expenses/helpers";
import type {
  InstallmentPayment,
  PlanningData,
  ScheduledExpense,
  VacationDay,
  VacationPlan,
} from "./types";

type PlanningState = {
  vacations: VacationPlan[];
  scheduledExpenses: ScheduledExpense[];
  installmentPayments: InstallmentPayment[];

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

  // Installment payment actions
  addInstallment: (p: Omit<InstallmentPayment, "id">) => void;
  updateInstallment: (id: string, patch: Partial<InstallmentPayment>) => void;
  removeInstallment: (id: string) => void;

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
      installmentPayments: [],

      addInstallment: (p) =>
        set((s) => ({
          installmentPayments: [...s.installmentPayments, { ...p, id: randomId() }],
        })),

      updateInstallment: (id, patch) =>
        set((s) => ({
          installmentPayments: s.installmentPayments.map((ip) =>
            ip.id === id ? { ...ip, ...patch } : ip
          ),
        })),

      removeInstallment: (id) =>
        set((s) => ({
          installmentPayments: s.installmentPayments.filter((ip) => ip.id !== id),
        })),

      addVacation: (plan) =>
        set((s) => ({
          vacations: [
            ...s.vacations,
            {
              ...plan,
              id: randomId(),
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
              ? { ...v, days: [...v.days, { ...day, id: randomId() }] }
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
          scheduledExpenses: [...s.scheduledExpenses, { ...expense, id: randomId() }],
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
          installmentPayments: s.installmentPayments,
          savedAt: new Date().toISOString(),
        };
      },

      loadPlanningData: (data) =>
        set({
          vacations: data.vacations ?? [],
          scheduledExpenses: data.scheduledExpenses ?? [],
          installmentPayments: data.installmentPayments ?? [],
        }),

      clearAll: () => set({ vacations: [], scheduledExpenses: [], installmentPayments: [] }),

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
