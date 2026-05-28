export type MetodoPago = "efectivo" | "credito";
export type Frecuencia = "mes" | "quincenal" | "unico";
export type Estado = "pagado" | "no pagado" | "guardado" | "no guardado";
export type RecurringCategory = "basico" | "servicio";

export type RecurringExpense = {
  id: string;
  title: string;
  amount: number;
  days: number[];            // one or more days of month 1–31
  category: RecurringCategory;
  metodoPago: MetodoPago;
  creditCardId?: string;
  cancelledMonths: string[]; // e.g. ["Enero", "Marzo"] — skipped those months
};

export type CreditCard = {
  id: string;
  name: string;
  cutDay: number;
  payDay: number;
  initialDebt: number;
  debtMes: string;
};

export type Expense = {
  id: string;
  mes: string;
  año?: number;
  gastos: string;
  monto: number;
  metodoPago: MetodoPago;
  frecuencia: Frecuencia;
  fecha: number;
  fechaMaxima: string;
  estado: Estado;
  selected: boolean;
  creditCardId?: string;
};

export type CreditHistoryEntry = {
  id: string;
  description: string;
  amount: number;
  type: "cargo" | "pago";
  balance: number;
  mes: string;
};

export type CreditCycleInfo = {
  currentMonth: string;
  cutDay: number;
  payDay: number;
  isCutPassed: boolean;
  isPayDayPassed: boolean;
  daysUntilPayDay: number;
  frozenDebt: number;
  totalPayments: number;
  remainingDebt: number;
  newCharges: number;
};

export type AppData = {
  expenses: Expense[];
  creditDebt: number;
  creditDebtMes?: string;
  creditCutDay?: number;
  creditPayDay?: number;
  savedAt?: string;
  creditCards?: CreditCard[];
  initialCreditDebt?: number;
  recurringExpenses?: RecurringExpense[];
  activatedMonths?: string[];
  planningData?: import("./planning/types").PlanningData;
};
