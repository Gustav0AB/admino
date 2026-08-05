import type { Account, AppData, CreditCard, CreditCycleInfo, CreditHistoryEntry, Expense, ExpenseCategory, Income, IncomeCategory } from "./types";

export const CATEGORIES: { value: ExpenseCategory; label: string; color: string }[] = [
  { value: "comida",          label: "Comida",          color: "#F59E0B" },
  { value: "transporte",      label: "Transporte",      color: "#3B82F6" },
  { value: "salud",           label: "Salud",           color: "#EF4444" },
  { value: "entretenimiento", label: "Entretenimiento", color: "#8B5CF6" },
  { value: "servicios",       label: "Servicios",       color: "#06B6D4" },
  { value: "ropa",            label: "Ropa",            color: "#EC4899" },
  { value: "hogar",           label: "Hogar",           color: "#84CC16" },
  { value: "educacion",       label: "Educación",       color: "#F97316" },
  { value: "viajes",          label: "Viajes",          color: "#14B8A6" },
  { value: "credito",         label: "Crédito",         color: "#6366F1" },
  { value: "ahorro",          label: "Ahorro",          color: "#22C55E" },
  { value: "otro",            label: "Otro",            color: "#94A3B8" },
];

export const ACCOUNT_TYPES: { value: import("./types").AccountType; label: string; color: string }[] = [
  { value: "efectivo",  label: "Efectivo",   color: "#84CC16" },
  { value: "debito",    label: "Débito",      color: "#3B82F6" },
  { value: "ahorro",    label: "Ahorro",      color: "#16A34A" },
  { value: "inversion", label: "Inversión",   color: "#8B5CF6" },
];

export function getAccountBalance(account: Account, expenses: Expense[], incomes: Income[]): number {
  const inflow = incomes
    .filter((i) => i.accountId === account.id && i.estado === "recibido")
    .reduce((s, i) => s + i.monto, 0);
  const outflow = expenses
    .filter((e) => e.accountId === account.id && e.estado === "pagado")
    .reduce((s, e) => s + e.monto, 0);
  return account.initialBalance + inflow - outflow;
}

export const INCOME_CATEGORIES: { value: IncomeCategory; label: string; color: string }[] = [
  { value: "sueldo",    label: "Sueldo",     color: "#16A34A" },
  { value: "freelance", label: "Freelance",  color: "#3B82F6" },
  { value: "renta",     label: "Renta",      color: "#F59E0B" },
  { value: "negocio",   label: "Negocio",    color: "#8B5CF6" },
  { value: "bono",      label: "Bono",       color: "#EC4899" },
  { value: "inversion", label: "Inversión",  color: "#14B8A6" },
  { value: "otro",      label: "Otro",       color: "#94A3B8" },
];

export const MESES_LIST = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function currentMonthName(): string {
  return MESES_LIST[new Date().getMonth()] ?? "Enero";
}

export function nextMonthName(): string {
  return MESES_LIST[(new Date().getMonth() + 1) % 12] ?? "Enero";
}

export function currentQuincena(): number {
  return new Date().getDate() <= 15 ? 15 : 30;
}

export function currentYear(): number {
  return new Date().getFullYear();
}

export function randomId(): string {
  return globalThis.crypto.randomUUID();
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0]!;
}

export function getFilteredExpenses(
  expenses: Expense[],
  filterMes: string,
  filterFrecuencia: string,
  filterFecha: number,
  filterAño: number = 0,
  filterCategoria: string = "Todos",
): Expense[] {
  return expenses.filter((e) => {
    if (filterMes && filterMes !== "Todos" && e.mes !== filterMes) return false;
    if (filterFrecuencia && filterFrecuencia !== "Todos" && e.frecuencia !== filterFrecuencia) return false;
    if (filterFecha === 15 && !(e.fecha >= 1 && e.fecha <= 15)) return false;
    if (filterFecha === 30 && !(e.fecha >= 16 && e.fecha <= 31)) return false;
    if (filterAño > 0 && (e.año ?? currentYear()) !== filterAño) return false;
    if (filterCategoria && filterCategoria !== "Todos" && (e.category ?? "otro") !== filterCategoria) return false;
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
  creditDebtAño?: number,
): CreditHistoryEntry[] {
  const debtMesIdx = MESES_LIST.indexOf(creditDebtMes);
  const debtAño = creditDebtAño ?? currentYear();

  // Include all expenses from debtMes/debtAño onwards, sorted chronologically
  const relevant = expenses
    .filter((e) => {
      if (cardId) {
        const isPayment = e.gastos.toLowerCase().trim() === "tarjeta de credito";
        const isCharge = e.metodoPago === "credito" && !isPayment;
        if (isCharge && e.creditCardId !== cardId) return false;
        if (isPayment && e.creditCardId && e.creditCardId !== cardId) return false;
      }
      const eAño = e.año ?? currentYear();
      const eMesIdx = MESES_LIST.indexOf(e.mes);
      if (eAño !== debtAño) return eAño > debtAño;
      return eMesIdx >= debtMesIdx;
    })
    .sort((a, b) => {
      const aAño = a.año ?? currentYear();
      const bAño = b.año ?? currentYear();
      if (aAño !== bAño) return aAño - bAño;
      const aIdx = MESES_LIST.indexOf(a.mes);
      const bIdx = MESES_LIST.indexOf(b.mes);
      if (aIdx !== bIdx) return aIdx - bIdx;
      return a.fecha - b.fecha;
    });

  const entries: CreditHistoryEntry[] = [];
  let balance = initialCreditDebt;

  for (const e of relevant) {
    const isPayment = e.gastos.toLowerCase().trim() === "tarjeta de credito";
    const isCharge = e.metodoPago === "credito" && !isPayment;

    if (isCharge) {
      balance += e.monto;
      entries.push({ id: e.id, description: e.gastos, amount: e.monto, type: "cargo", balance, mes: e.mes });
    } else if (isPayment) {
      balance -= e.monto;
      entries.push({ id: e.id, description: e.gastos, amount: e.monto, type: "pago", balance, mes: e.mes });
    }
  }

  return entries;
}

export function getCreditHistoryForCard(
  expenses: Expense[],
  card: CreditCard
): CreditHistoryEntry[] {
  return getCreditHistory(expenses, card.initialDebt, card.debtMes, card.id, card.debtAño);
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
  creditDebtMes?: string,
  creditDebtAño?: number,
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

  const frozenDebt = initialCreditDebt;

  // Payments: count from debtMes/debtAño onwards so a payment made in the statement
  // month (not necessarily this calendar month) is correctly subtracted
  const debtMesIdx = creditDebtMes ? MESES_LIST.indexOf(creditDebtMes) : -1;
  const debtAño = creditDebtAño ?? currentYear();

  const isAfterDebt = (e: Expense) => {
    if (debtMesIdx < 0) return e.mes === currentMonth;
    const eAño = e.año ?? currentYear();
    const eMesIdx = MESES_LIST.indexOf(e.mes);
    if (eAño !== debtAño) return eAño > debtAño;
    return eMesIdx >= debtMesIdx;
  };

  const totalPayments = expenses
    .filter((e) => {
      const isPayment = e.gastos.toLowerCase().trim() === "tarjeta de credito";
      if (!isPayment) return false;
      if (cardId) { if (e.creditCardId && e.creditCardId !== cardId) return false; }
      return isAfterDebt(e);
    })
    .reduce((sum, e) => sum + e.monto, 0);

  const remainingDebt = Math.max(0, frozenDebt - totalPayments);

  // newCharges: only post-cut charges in the current month (open cycle, not part of frozen statement)
  const newCharges = expenses
    .filter((e) => {
      if (e.mes !== currentMonth) return false;
      if (e.gastos.toLowerCase().trim() === "tarjeta de credito") return false;
      if (e.metodoPago !== "credito") return false;
      if (creditCutDay > 0 && e.fecha <= creditCutDay) return false;
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
  return getCreditCycleInfo(
    expenses, card.initialDebt, card.cutDay, card.payDay,
    card.id, card.debtMes, card.debtAño,
  );
}

export function getMSIPendingForCard(
  installments: import("./planning/types").InstallmentPayment[],
  cardId: string
): { count: number; monthlyTotal: number; totalPending: number } {
  const active = installments.filter(
    (ip) => ip.creditCardId === cardId && ip.status === "active"
  );
  return {
    count: active.length,
    monthlyTotal: active.reduce((s, ip) => s + ip.monthlyAmount, 0),
    totalPending: active.reduce((s, ip) => s + ip.monthlyAmount * (ip.totalMonths - ip.paidMonths), 0),
  };
}

/**
 * Returns which days in the given month (year, monthIndex 0-11) an interval-by-days
 * recurring expense fires, given its anchor startDate and intervalDays.
 */
export function getIntervalDaysInMonth(
  startDate: string,
  intervalDays: number,
  year: number,
  monthIndex: number,
): number[] {
  if (intervalDays <= 0) return [];
  const start = new Date(startDate + "T12:00:00");
  const firstOfMonth = new Date(year, monthIndex, 1);
  const lastOfMonth = new Date(year, monthIndex + 1, 0);

  const diffMs = firstOfMonth.getTime() - start.getTime();
  const diffDays = Math.ceil(diffMs / 86400000);
  const periodsToSkip = diffDays <= 0 ? 0 : Math.ceil(diffDays / intervalDays);

  const days: number[] = [];
  let current = new Date(start.getTime() + periodsToSkip * intervalDays * 86400000);
  while (current <= lastOfMonth) {
    if (current >= firstOfMonth) days.push(current.getDate());
    current = new Date(current.getTime() + intervalDays * 86400000);
  }
  return days;
}

/**
 * Returns the day-of-month the expense fires if the given month matches the
 * interval-by-months schedule (startDate + N * intervalMonths), or null if it doesn't.
 */
export function getIntervalMonthDay(
  startDate: string,
  intervalMonths: number,
  year: number,
  monthIndex: number,
): number | null {
  if (intervalMonths <= 0) return null;
  const start = new Date(startDate + "T12:00:00");
  const totalMonthsDiff = (year - start.getFullYear()) * 12 + (monthIndex - start.getMonth());
  if (totalMonthsDiff < 0 || totalMonthsDiff % intervalMonths !== 0) return null;
  return start.getDate();
}

export function isCardPayment(e: { gastos: string }): boolean {
  return e.gastos.toLowerCase().trim() === "tarjeta de credito";
}

export type BillingCycleStatus = "cerrado" | "en_curso" | "no_en_curso";

export function getBillingCycleStatus(selectedMes: string, cutDay: number): BillingCycleStatus {
  const today = new Date();
  const todayIdx = today.getMonth();
  const todayDay = today.getDate();
  const selIdx = MESES_LIST.indexOf(selectedMes);
  if (selIdx < 0) return "no_en_curso";
  if (selIdx < todayIdx) return "cerrado";
  if (selIdx === todayIdx) return cutDay > 0 && todayDay > cutDay ? "cerrado" : "en_curso";
  if (selIdx === todayIdx + 1) return "en_curso";
  return "no_en_curso";
}

export function getBillingPeriodCharges(
  expenses: Expense[],
  cardId: string,
  selectedMes: string,
  cutDay: number,
  selectedAño: number,
): Expense[] {
  const selIdx = MESES_LIST.indexOf(selectedMes);
  if (selIdx < 0) return [];
  if (cutDay <= 0) {
    return expenses.filter(
      (e) =>
        e.creditCardId === cardId &&
        e.metodoPago === "credito" &&
        e.mes === selectedMes &&
        (e.año ?? currentYear()) === selectedAño,
    );
  }
  const prevIdx = (selIdx - 1 + 12) % 12;
  const prevMonth = MESES_LIST[prevIdx]!;
  const prevAño = selIdx === 0 ? selectedAño - 1 : selectedAño;
  return expenses.filter((e) => {
    if (e.creditCardId !== cardId || e.metodoPago !== "credito") return false;
    const eAño = e.año ?? currentYear();
    if (e.mes === prevMonth && eAño === prevAño && e.fecha > cutDay) return true;
    if (e.mes === selectedMes && eAño === selectedAño && e.fecha <= cutDay) return true;
    return false;
  });
}

export function getBillingPeriodLabel(selectedMes: string, cutDay: number): string {
  if (cutDay <= 0) return selectedMes;
  const selIdx = MESES_LIST.indexOf(selectedMes);
  if (selIdx < 0) return selectedMes;
  const prevMonth = MESES_LIST[(selIdx - 1 + 12) % 12]!;
  return `${prevMonth.slice(0, 3)} ${cutDay + 1} – ${selectedMes.slice(0, 3)} ${cutDay}`;
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
