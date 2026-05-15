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

export type VacationPlan = {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  notes: string;
  status: VacationStatus;
  days: VacationDay[];
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
};

export type PlanningData = {
  vacations: VacationPlan[];
  scheduledExpenses: ScheduledExpense[];
  savedAt?: string;
};
