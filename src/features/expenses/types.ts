export type MetodoPago = "efectivo" | "credito";
export type Frecuencia = "mes" | "quincenal" | "unico";
export type Estado = "pagado" | "no pagado" | "guardado" | "no guardado";

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
  planningData?: import("./planning/types").PlanningData;
};
