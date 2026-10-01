export type VacationStatus = "planning" | "confirmed" | "completed" | "cancelled";

export type ScheduledExpenseCategory =
  | "mechanic"
  | "insurance"
  | "medical"
  | "utilities"
  | "subscription"
  | "other";

export type ScheduledExpenseStatus = "pending" | "done" | "cancelled";

export type VacationDay = {
  id: string;
  date: string;
  activity: string;
  estimatedCost: number;
};

export type VacationTask = {
  id: string;
  task: string;
  done: boolean;
};

export type VacationPayment = {
  id: string;
  description: string;
  amount: number;
  perPerson: boolean;
  done: boolean;
  trackInGastos: boolean;
};

export type VacationPlan = {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget?: number;
  notes: string;
  status: VacationStatus;
  days: VacationDay[];
  persons: string[];
  tasks: VacationTask[];
  payments: VacationPayment[];
};

export type ScheduledExpense = {
  id: string;
  title: string;
  scheduledDate: string;
  time?: string;
  category: ScheduledExpenseCategory;
  amountKnown: boolean;
  amount: number;
  notes: string;
  status: ScheduledExpenseStatus;
  paymentMethod?: "efectivo" | "credito";
};

export type InstallmentPayment = {
  id: string;
  title: string;
  monthlyAmount: number;
  totalMonths: number;
  paidMonths: number;
  notes: string;
  creditCardId?: string;
  status: "active" | "completed";
};

export type PlanningData = {
  vacations: VacationPlan[];
  scheduledExpenses: ScheduledExpense[];
  installmentPayments?: InstallmentPayment[];
  savedAt?: string;
};
