import type { AppData, CreditCard, CreditCycleInfo, CreditHistoryEntry, Expense } from "./types";

export const MESES_LIST = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function currentMonthName(): string {
  return MESES_LIST[new Date().getMonth()] ?? "Enero";
}

export function getFilteredExpenses(
  expenses: Expense[],
  filterMes: string,
  filterFrecuencia: string,
  filterFecha: number
): Expense[] {
  return expenses.filter((e) => {
    if (filterMes && filterMes !== "Todos" && e.mes !== filterMes) return false;
    if (filterFrecuencia && filterFrecuencia !== "Todos" && e.frecuencia !== filterFrecuencia) return false;
    if (filterFecha === 15 && !(e.fecha >= 1 && e.fecha <= 15)) return false;
    if (filterFecha === 30 && !(e.fecha >= 16 && e.fecha <= 31)) return false;
    return true;
  });
}

export function getAvailableMeses(expenses: Expense[]): string[] {
  const set = new Set(expenses.map((e) => e.mes));
  return MESES_LIST.filter((m) => set.has(m));
}

export function getCreditHistory(
  expenses: Expense[],
  initialCreditDebt: number,
  creditDebtMes: string
): CreditHistoryEntry[] {
  const monthExpenses = expenses.filter((e) => e.mes === creditDebtMes);
  const entries: CreditHistoryEntry[] = [];
  let balance = initialCreditDebt;

  for (const e of monthExpenses) {
    const isPayment = e.gastos.toLowerCase().trim() === "tarjeta de credito";
    const isCharge = e.metodoPago === "credito" && !isPayment;

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
  return getCreditHistory(expenses, card.initialDebt, card.debtMes);
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
  creditPayDay: number
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

  const frozenDebt = isCutPassed ? initialCreditDebt : 0;

  const totalPayments = monthExpenses
    .filter((e) => e.gastos.toLowerCase().trim() === "tarjeta de credito")
    .reduce((sum, e) => sum + e.monto, 0);

  const remainingDebt = Math.max(0, frozenDebt - totalPayments);

  const newCharges = monthExpenses
    .filter((e) => e.metodoPago === "credito" && e.gastos.toLowerCase().trim() !== "tarjeta de credito")
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
  return getCreditCycleInfo(expenses, card.initialDebt, card.cutDay, card.payDay);
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
  creditCards?: import("./types").CreditCard[]
): AppData {
  const base: AppData = { expenses, creditDebt, creditDebtMes, creditCutDay, creditPayDay };
  if (creditCards && creditCards.length > 0) {
    base.creditCards = creditCards;
  }
  return base;
}
