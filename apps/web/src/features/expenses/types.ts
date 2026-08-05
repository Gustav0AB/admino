export type MetodoPago = "efectivo" | "credito";
export type Frecuencia = "mes" | "quincenal" | "unico";
export type Estado = "pagado" | "no pagado" | "guardado" | "no guardado";
export type RecurringCategory = "basico" | "servicio";

export type ExpenseCategory =
  | "comida"
  | "transporte"
  | "salud"
  | "entretenimiento"
  | "servicios"
  | "ropa"
  | "hogar"
  | "educacion"
  | "viajes"
  | "credito"
  | "ahorro"
  | "otro";

export type RecurringSchedulingType = "monthly" | "interval";

export type RecurringExpense = {
  id: string;
  title: string;
  amount: number;
  days: number[];
  category: RecurringCategory;
  metodoPago: MetodoPago;
  creditCardId?: string;
  cancelledMonths: string[];
  schedulingType?: RecurringSchedulingType;
  intervalDays?: number;
  intervalMonths?: number;
  startDate?: string;
  expirationDate?: string;
  totalInstallments?: number;
  paidInstallments?: number;
};

export type CreditCard = {
  id: string;
  name: string;
  cutDay: number;
  payDay: number;
  initialDebt: number;
  debtMes: string;
  debtAño?: number;
  creditLimit?: number;
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
  category?: ExpenseCategory;
  accountId?: string;
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

export type AccountType = "efectivo" | "debito" | "ahorro" | "inversion";

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  color: string;
  initialBalance: number;
  balanceDate?: string;
};

export type IncomeCategory = "sueldo" | "freelance" | "renta" | "negocio" | "bono" | "inversion" | "otro";
export type IncomeEstado = "recibido" | "pendiente";
export type IncomeFrecuencia = "mes" | "quincenal" | "unico";

export type Income = {
  id: string;
  mes: string;
  año?: number;
  descripcion: string;
  monto: number;
  fecha: number;
  frecuencia: IncomeFrecuencia;
  estado: IncomeEstado;
  category: IncomeCategory;
  accountId?: string;
};

export type SavingsDeposit = {
  id: string;
  amount: number;
  date: string;
  notes: string;
};

export type SavingsGoal = {
  id: string;
  title: string;
  targetAmount: number;
  deadline: string;
  notes: string;
  color: string;
  status: "active" | "completed" | "cancelled";
  deposits: SavingsDeposit[];
};

export type LoanDirection = "borrowed" | "lent";

export type LoanPayment = {
  id: string;
  amount: number;
  date: string;
  notes: string;
};

export type Loan = {
  id: string;
  title: string;
  person: string;
  direction: LoanDirection;
  originalAmount: number;
  startDate: string;
  dueDate: string;
  notes: string;
  payments: LoanPayment[];
  status: "active" | "paid";
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
  incomes?: Income[];
  accounts?: Account[];
  loans?: Loan[];
  savingsGoals?: SavingsGoal[];
};
