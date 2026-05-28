import type { AppData, CreditCard, CreditCycleInfo, CreditHistoryEntry, Expense } from "./types";

export const MESES_LIST = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function currentMonthName(): string {
  return MESES_LIST[new Date().getMonth()] ?? "Enero";
}

export function currentQuincena(): number {
  return new Date().getDate() <= 15 ? 15 : 30;
}

export function currentYear(): number {
  return new Date().getFullYear();
}

export function getFilteredExpenses(
  expenses: Expense[],
  filterMes: string,
  filterFrecuencia: string,
  filterFecha: number,
  filterAño: number = 0,
): Expense[] {
  return expenses.filter((e) => {
    if (filterMes && filterMes !== "Todos" && e.mes !== filterMes) return false;
    if (filterFrecuencia && filterFrecuencia !== "Todos" && e.frecuencia !== filterFrecuencia) return false;
    if (filterFecha === 15 && !(e.fecha >= 1 && e.fecha <= 15)) return false;
    if (filterFecha === 30 && !(e.fecha >= 16 && e.fecha <= 31)) return false;
    if (filterAño > 0 && (e.año ?? currentYear()) !== filterAño) return false;
    return true;
  });
}

export function getAvailableMeses(expenses: Expense[]): string[] {
  const set = new Set(expenses.map((e) => e.mes));
  return MESES_LIST.filter((m) => set.has(m));
}

export function getAvailableAños(expenses: Expense[]): number[] {
  const set = new Set(expenses.map((e) => e.año ?? currentYear()));
  return Array.from(set).sort((a, b) => b - a);
}

export function getCreditHistory(
  expenses: Expense[],
  initialCreditDebt: number,
  creditDebtMes: string,
  cardId?: string,
): CreditHistoryEntry[] {
  const monthExpenses = expenses.filter((e) => e.mes === creditDebtMes);
  const entries: CreditHistoryEntry[] = [];
  let balance = initialCreditDebt;

  for (const e of monthExpenses) {
    const isPayment = e.gastos.toLowerCase().trim() === "tarjeta de credito";
    const isCharge = e.metodoPago === "credito" && !isPayment;

    if (cardId) {
      if (isCharge && e.creditCardId !== cardId) continue;
      if (isPayment && e.creditCardId && e.creditCardId !== cardId) continue;
    }

    if (isCharge) {
      balance += e.monto;
      entries.push({
        id: e.id,
        description: e.gastos,
        amount: e.monto,
        type: "cargo",
        balance,
        mes: e.mes,
      });
    } else if (isPayment) {
      balance -= e.monto;
      entries.push({
        id: e.id,
        description: e.gastos,
        amount: e.monto,
        type: "pago",
        balance,
        mes: e.mes,
      });
    }
  }

  return entries;
}

export function getCreditHistoryForCard(
  expenses: Expense[],
  card: CreditCard
): CreditHistoryEntry[] {
  return getCreditHistory(expenses, card.initialDebt, card.debtMes, card.id);
}

export function getCurrentCreditBalance(
  history: CreditHistoryEntry[],
  initialCreditDebt: number
): number {
  if (history.length === 0) return initialCreditDebt;
  return history[history.length - 1]?.balance ?? initialCreditDebt;
}

export function getCreditCycleInfo(
  expenses: Expense[],
  initialCreditDebt: number,
  creditCutDay: number,
  creditPayDay: number,
  cardId?: string,
): CreditCycleInfo {
  const today = new Date();
  const currentMonth = MESES_LIST[today.getMonth()] ?? "Enero";
  const dayOfMonth = today.getDate();

  const isCutPassed = creditCutDay > 0 && dayOfMonth > creditCutDay;
  const isPayDayPassed = creditPayDay > 0 && dayOfMonth > creditPayDay;

  let daysUntilPayDay = 0;
  if (creditPayDay > 0 && !isPayDayPassed) {
    daysUntilPayDay = creditPayDay - dayOfMonth;
  }

  const monthExpenses = expenses.filter((e) => e.mes === currentMonth);

  // Always show the statement amount regardless of cycle state
  const frozenDebt = initialCreditDebt;

  const totalPayments = monthExpenses
    .filter((e) => {
      const isPayment = e.gastos.toLowerCase().trim() === "tarjeta de credito";
      if (!isPayment) return false;
      if (cardId) return e.creditCardId === cardId || !e.creditCardId;
      return true;
    })
    .reduce((sum, e) => sum + e.monto, 0);

  const remainingDebt = Math.max(0, frozenDebt - totalPayments);

  const newCharges = monthExpenses
    .filter((e) => {
      if (e.gastos.toLowerCase().trim() === "tarjeta de credito") return false;
      if (e.metodoPago !== "credito") return false;
      if (cardId) return e.creditCardId === cardId;
      return true;
    })
    .reduce((sum, e) => sum + e.monto, 0);

  return {
    currentMonth,
    cutDay: creditCutDay,
    payDay: creditPayDay,
    isCutPassed,
    isPayDayPassed,
    daysUntilPayDay,
    frozenDebt,
    totalPayments,
    remainingDebt,
    newCharges,
  };
}

export function getCreditCycleInfoForCard(
  expenses: Expense[],
  card: CreditCard
): CreditCycleInfo {
  return getCreditCycleInfo(expenses, card.initialDebt, card.cutDay, card.payDay, card.id);
}

export function formatMXN(n: number): string {
  return n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function buildAppData(
  expenses: Expense[],
  creditDebt: number,
  creditDebtMes: string,
  creditCutDay: number,
  creditPayDay: number,
  creditCards?: import("./types").CreditCard[],
  recurringExpenses?: import("./types").RecurringExpense[],
  planningData?: import("./planning/types").PlanningData,
  activatedMonths?: string[]
): AppData {
  const base: AppData = { expenses, creditDebt, creditDebtMes, creditCutDay, creditPayDay };
  if (creditCards && creditCards.length > 0) base.creditCards = creditCards;
  if (recurringExpenses && recurringExpenses.length > 0) base.recurringExpenses = recurringExpenses;
  if (activatedMonths && activatedMonths.length > 0) base.activatedMonths = activatedMonths;
  if (planningData) base.planningData = planningData;
  return base;
}
