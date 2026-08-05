import { create } from "zustand";
import { persist } from "zustand/middleware";
import { userScopedStorage } from "@/shared/store/userScopedStorage";
import { currentMonthName, currentQuincena, currentYear, buildAppData, getFilteredExpenses, MESES_LIST, getIntervalDaysInMonth, getIntervalMonthDay, randomId } from "./helpers";
import type { Account, AppData, CreditCard, Estado, Expense, Frecuencia, Income, Loan, LoanPayment, MetodoPago, RecurringExpense, SavingsDeposit, SavingsGoal } from "./types";
import { usePlanningStore } from "./planning/store";

// Migrate records saved before the day→days rename
function migrateRecurring(items: RecurringExpense[]): RecurringExpense[] {
  return items.map((r) => {
    if (Array.isArray(r.days)) return r;
    const legacy = r as unknown as { day?: number };
    return { ...r, days: legacy.day != null ? [legacy.day] : [1] };
  });
}

function blankExpense(): Expense {
  return {
    id: randomId(),
    mes: currentMonthName(),
    año: currentYear(),
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
  filterAño: number;
  filterCategoria: string;
  initialCreditDebt: number;
  creditDebtMes: string;
  creditCutDay: number;
  creditPayDay: number;
  creditCards: CreditCard[];
  recurringExpenses: RecurringExpense[];
  activatedMonths: string[];
  incomes: Income[];
  accounts: Account[];
  loans: Loan[];
  savingsGoals: SavingsGoal[];

  setExpenses: (expenses: Expense[]) => void;
  setFilterMes: (v: string) => void;
  setFilterFrecuencia: (v: string) => void;
  setFilterFecha: (v: number) => void;
  setFilterAño: (v: number) => void;
  setFilterCategoria: (v: string) => void;
  setInitialCreditDebt: (v: number) => void;
  setCreditDebtMes: (v: string) => void;
  setCreditCutDay: (v: number) => void;
  setCreditPayDay: (v: number) => void;

  addCreditCard: (card: Omit<CreditCard, "id">) => void;
  updateCreditCard: (id: string, patch: Partial<CreditCard>) => void;
  removeCreditCard: (id: string) => void;
  addCardPayment: (cardId: string, amount: number, mes: string, año: number) => void;

  addIncome: (data: Omit<Income, "id">) => void;
  removeIncome: (id: string) => void;
  updateIncome: (id: string, patch: Partial<Omit<Income, "id">>) => void;

  addAccount: (data: Omit<Account, "id">) => void;
  updateAccount: (id: string, patch: Partial<Omit<Account, "id">>) => void;
  removeAccount: (id: string) => void;

  addLoan: (data: Omit<Loan, "id" | "payments" | "status">) => void;
  updateLoan: (id: string, patch: Partial<Omit<Loan, "id" | "payments">>) => void;
  removeLoan: (id: string) => void;
  addLoanPayment: (loanId: string, data: Omit<LoanPayment, "id">) => void;
  removeLoanPayment: (loanId: string, paymentId: string) => void;

  addSavingsGoal: (data: Omit<SavingsGoal, "id" | "deposits" | "status">) => void;
  updateSavingsGoal: (id: string, patch: Partial<Omit<SavingsGoal, "id" | "deposits">>) => void;
  removeSavingsGoal: (id: string) => void;
  addSavingsDeposit: (goalId: string, data: Omit<SavingsDeposit, "id">) => void;
  removeSavingsDeposit: (goalId: string, depositId: string) => void;

  addRecurringExpense: (item: Omit<RecurringExpense, "id" | "cancelledMonths">) => void;
  updateRecurringExpense: (id: string, patch: Partial<Omit<RecurringExpense, "id">>) => void;
  removeRecurringExpense: (id: string) => void;
  toggleCancelMonth: (id: string, mes: string) => void;
  activateMonth: (month: string, year?: number) => void;
  deactivateMonth: (month: string, year?: number) => void;

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
      filterFecha: currentQuincena(),
      filterAño: 0,
      filterCategoria: "Todos",
      initialCreditDebt: 0,
      creditDebtMes: currentMonthName(),
      creditCutDay: 0,
      creditPayDay: 0,
      creditCards: [],
      recurringExpenses: [],
      activatedMonths: [`${currentMonthName()}-${currentYear()}`],
      incomes: [],
      accounts: [],
      loans: [],
      savingsGoals: [],

      setExpenses: (expenses) => set({ expenses }),
      setFilterMes: (filterMes) => set({ filterMes }),
      setFilterFrecuencia: (filterFrecuencia) => set({ filterFrecuencia }),
      setFilterFecha: (filterFecha) => set({ filterFecha }),
      setFilterAño: (filterAño) => set({ filterAño }),
      setFilterCategoria: (filterCategoria) => set({ filterCategoria }),
      setInitialCreditDebt: (initialCreditDebt) => set({ initialCreditDebt }),
      setCreditDebtMes: (creditDebtMes) => set({ creditDebtMes }),
      setCreditCutDay: (creditCutDay) => set({ creditCutDay }),
      setCreditPayDay: (creditPayDay) => set({ creditPayDay }),

      addCreditCard: (card) =>
        set((s) => ({
          creditCards: [...s.creditCards, { ...card, id: randomId() }],
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

      addCardPayment: (cardId, amount, mes, año) =>
        set((s) => ({
          expenses: [
            ...s.expenses,
            {
              id: randomId(),
              mes,
              año,
              gastos: "tarjeta de credito",
              monto: amount,
              metodoPago: "efectivo" as MetodoPago,
              frecuencia: "mes" as Frecuencia,
              fecha: new Date().getDate(),
              fechaMaxima: "",
              estado: "pagado" as Estado,
              selected: false,
              creditCardId: cardId,
            },
          ],
        })),

      addIncome: (data) =>
        set((s) => ({ incomes: [...s.incomes, { ...data, id: randomId() }] })),

      removeIncome: (id) =>
        set((s) => ({ incomes: s.incomes.filter((i) => i.id !== id) })),

      updateIncome: (id, patch) =>
        set((s) => ({
          incomes: s.incomes.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),

      addAccount: (data) =>
        set((s) => ({ accounts: [...s.accounts, { ...data, id: randomId() }] })),

      updateAccount: (id, patch) =>
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),

      removeAccount: (id) =>
        set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) })),

      addLoan: (data) =>
        set((s) => ({
          loans: [...s.loans, { ...data, id: randomId(), payments: [], status: "active" }],
        })),

      updateLoan: (id, patch) =>
        set((s) => ({
          loans: s.loans.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        })),

      removeLoan: (id) =>
        set((s) => ({ loans: s.loans.filter((l) => l.id !== id) })),

      addLoanPayment: (loanId, data) =>
        set((s) => ({
          loans: s.loans.map((l) => {
            if (l.id !== loanId) return l;
            const payments = [...l.payments, { ...data, id: randomId() }];
            const paid = payments.reduce((sum, p) => sum + p.amount, 0) >= l.originalAmount;
            return { ...l, payments, status: paid ? "paid" : "active" };
          }),
        })),

      removeLoanPayment: (loanId, paymentId) =>
        set((s) => ({
          loans: s.loans.map((l) => {
            if (l.id !== loanId) return l;
            const payments = l.payments.filter((p) => p.id !== paymentId);
            const paid = payments.reduce((sum, p) => sum + p.amount, 0) >= l.originalAmount;
            return { ...l, payments, status: paid ? "paid" : "active" };
          }),
        })),

      addSavingsGoal: (data) =>
        set((s) => ({
          savingsGoals: [...s.savingsGoals, { ...data, id: randomId(), deposits: [], status: "active" }],
        })),

      updateSavingsGoal: (id, patch) =>
        set((s) => ({
          savingsGoals: s.savingsGoals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),

      removeSavingsGoal: (id) =>
        set((s) => ({ savingsGoals: s.savingsGoals.filter((g) => g.id !== id) })),

      addSavingsDeposit: (goalId, data) =>
        set((s) => ({
          savingsGoals: s.savingsGoals.map((g) => {
            if (g.id !== goalId) return g;
            const deposits = [...g.deposits, { ...data, id: randomId() }];
            const saved = deposits.reduce((sum, d) => sum + d.amount, 0);
            return { ...g, deposits, status: saved >= g.targetAmount ? "completed" : "active" };
          }),
        })),

      removeSavingsDeposit: (goalId, depositId) =>
        set((s) => ({
          savingsGoals: s.savingsGoals.map((g) => {
            if (g.id !== goalId) return g;
            const deposits = g.deposits.filter((d) => d.id !== depositId);
            const saved = deposits.reduce((sum, d) => sum + d.amount, 0);
            return { ...g, deposits, status: saved >= g.targetAmount ? "completed" : "active" };
          }),
        })),

      addRecurringExpense: (item) =>
        set((s) => ({
          recurringExpenses: [
            ...s.recurringExpenses,
            { ...item, id: randomId(), cancelledMonths: [] },
          ],
        })),

      updateRecurringExpense: (id, patch) =>
        set((s) => ({
          recurringExpenses: s.recurringExpenses.map((r) =>
            r.id === id ? { ...r, ...patch } : r
          ),
        })),

      removeRecurringExpense: (id) =>
        set((s) => ({
          recurringExpenses: s.recurringExpenses.filter((r) => r.id !== id),
        })),

      toggleCancelMonth: (id, mes) =>
        set((s) => ({
          recurringExpenses: s.recurringExpenses.map((r) => {
            if (r.id !== id) return r;
            const already = r.cancelledMonths.includes(mes);
            return {
              ...r,
              cancelledMonths: already
                ? r.cancelledMonths.filter((m) => m !== mes)
                : [...r.cancelledMonths, mes],
            };
          }),
        })),

      activateMonth: (month, year = currentYear()) =>
        set((s) => {
          const key = `${month}-${year}`;
          if (s.activatedMonths.includes(key)) return s;

          const monthIndex = MESES_LIST.indexOf(month);
          const newExpenses: Expense[] = [];
          const recurringUpdates: Record<string, Partial<RecurringExpense>> = {};

          for (const r of s.recurringExpenses) {
            if (r.cancelledMonths.includes(month)) continue;

            // Skip completed installments
            const totalInst = r.totalInstallments;
            const paidInst = r.paidInstallments ?? 0;
            if (totalInst !== undefined && paidInst >= totalInst) continue;

            // Skip if past expiration date (month-level check for monthly type)
            if (r.expirationDate && r.schedulingType !== "interval") {
              const exp = new Date(r.expirationDate + "T12:00:00");
              const monthStart = new Date(year, monthIndex, 1);
              if (monthStart > exp) continue;
            }

            // Determine which days to fire
            let daysToUse: number[] = [];
            if (!r.schedulingType || r.schedulingType === "monthly") {
              daysToUse = r.days;
            } else if (r.schedulingType === "interval" && r.startDate) {
              if (r.intervalDays) {
                daysToUse = getIntervalDaysInMonth(r.startDate, r.intervalDays, year, monthIndex);
                // Filter each occurrence against expiration
                if (r.expirationDate) {
                  const exp = new Date(r.expirationDate + "T12:00:00");
                  daysToUse = daysToUse.filter((d) => new Date(year, monthIndex, d) <= exp);
                }
              } else if (r.intervalMonths) {
                const day = getIntervalMonthDay(r.startDate, r.intervalMonths, year, monthIndex);
                if (day !== null) {
                  if (r.expirationDate) {
                    const exp = new Date(r.expirationDate + "T12:00:00");
                    if (new Date(year, monthIndex, day) <= exp) daysToUse = [day];
                  } else {
                    daysToUse = [day];
                  }
                }
              }
            }

            // Respect remaining installments limit
            const remaining = totalInst !== undefined ? totalInst - paidInst : Infinity;
            let generated = 0;

            for (const day of daysToUse) {
              if (generated >= remaining) break;
              const exists = s.expenses.some(
                (e) => e.mes === month && (e.año ?? year) === year && e.gastos === r.title && e.fecha === day
              );
              if (!exists) {
                newExpenses.push({
                  id: randomId(),
                  mes: month,
                  año: year,
                  gastos: r.title,
                  monto: r.amount,
                  metodoPago: r.metodoPago,
                  frecuencia: "mes",
                  fecha: day,
                  fechaMaxima: "",
                  estado: "no pagado",
                  selected: true,
                  ...(r.creditCardId ? { creditCardId: r.creditCardId } : {}),
                });
                generated++;
              }
            }

            if (generated > 0 && totalInst !== undefined) {
              recurringUpdates[r.id] = { paidInstallments: paidInst + generated };
            }
          }

          return {
            activatedMonths: [...s.activatedMonths, key],
            expenses: [...s.expenses, ...newExpenses],
            recurringExpenses: Object.keys(recurringUpdates).length > 0
              ? s.recurringExpenses.map((r) =>
                  recurringUpdates[r.id] ? { ...r, ...recurringUpdates[r.id] } : r
                )
              : s.recurringExpenses,
          };
        }),

      deactivateMonth: (month, year = currentYear()) =>
        set((s) => ({
          activatedMonths: s.activatedMonths.filter((m) => m !== `${month}-${year}`),
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
        set((s) => {
          const filteredIds = new Set(
            getFilteredExpenses(s.expenses, s.filterMes, s.filterFrecuencia, s.filterFecha, s.filterAño, s.filterCategoria)
              .map((e) => e.id),
          );
          return {
            expenses: s.expenses.map((e) =>
              filteredIds.has(e.id) ? { ...e, selected } : e,
            ),
          };
        }),

      duplicateExpense: (id, targetMeses) => {
        const { expenses } = get();
        const idx = expenses.findIndex((e) => e.id === id);
        if (idx === -1) return;
        const source = expenses[idx];
        if (!source) return;
        const copies: Expense[] = targetMeses.map((mes) => ({
          id: randomId(),
          mes,
          ...(source.año !== undefined ? { año: source.año } : {}),
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
            id: randomId(),
            mes,
            ...(source.año !== undefined ? { año: source.año } : {}),
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
            id: randomId(),
            mes: defaultMes,
            año: currentYear(),
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
            { ...data, año: data.año ?? currentYear(), id: randomId(), selected: true },
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
        const data = buildAppData(
          s.expenses,
          s.initialCreditDebt,
          s.creditDebtMes,
          s.creditCutDay,
          s.creditPayDay,
          s.creditCards,
          s.recurringExpenses,
          planningData,
          s.activatedMonths
        );
        if (s.incomes.length > 0) data.incomes = s.incomes;
        if (s.accounts.length > 0) data.accounts = s.accounts;
        if (s.loans.length > 0) data.loans = s.loans;
        if (s.savingsGoals.length > 0) data.savingsGoals = s.savingsGoals;
        return data;
      },

      loadAppData: (data: AppData) => {
        let creditCards: CreditCard[] = [];
        if (data.creditCards && data.creditCards.length > 0) {
          creditCards = data.creditCards;
        } else if ((data.creditCutDay ?? 0) > 0 || (data.creditPayDay ?? 0) > 0) {
          creditCards = [
            {
              id: randomId(),
              name: "Tarjeta Principal",
              cutDay: data.creditCutDay ?? 0,
              payDay: data.creditPayDay ?? 0,
              initialDebt: data.creditDebt ?? 0,
              debtMes: data.creditDebtMes ?? currentMonthName(),
            },
          ];
        }
        const yr = currentYear();
        // Migrate: add año to expenses that lack it, normalize activatedMonths to "Mes-YYYY" format
        const expenses = (data.expenses ?? []).map((e) =>
          e.año !== undefined ? e : { ...e, año: yr }
        );
        const activatedMonths = (data.activatedMonths ?? [currentMonthName()]).map((m) =>
          /\-\d{4}$/.test(m) ? m : `${m}-${yr}`
        );
        set({
          expenses,
          filterMes: currentMonthName(),
          filterFecha: currentQuincena(),
          filterAño: 0,
          initialCreditDebt: data.creditDebt ?? 0,
          creditDebtMes: data.creditDebtMes ?? currentMonthName(),
          creditCutDay: data.creditCutDay ?? 0,
          creditPayDay: data.creditPayDay ?? 0,
          creditCards,
          recurringExpenses: migrateRecurring(data.recurringExpenses ?? []),
          activatedMonths,
          incomes: data.incomes ?? [],
          accounts: data.accounts ?? [],
          loans: data.loans ?? [],
          savingsGoals: data.savingsGoals ?? [],
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
          filterFecha: currentQuincena(),
          filterAño: 0,
          filterCategoria: "Todos",
          initialCreditDebt: 0,
          creditDebtMes: currentMonthName(),
          creditCutDay: 0,
          creditPayDay: 0,
          creditCards: [],
          recurringExpenses: [],
          activatedMonths: [`${currentMonthName()}-${currentYear()}`],
          incomes: [],
          accounts: [],
          loans: [],
          savingsGoals: [],
        }),

      rehydrate: async () => {
        await useExpensesStore.persist.rehydrate();
      },
    }),
    {
      name: "expenses",
      storage: userScopedStorage,
      onRehydrateStorage: () => (state) => {
        if (state?.recurringExpenses) {
          state.recurringExpenses = migrateRecurring(state.recurringExpenses);
        }
      },
    }
  )
);
