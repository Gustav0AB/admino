import { usePlanningStore } from "@/features/expenses/planning/store";
import type { ScheduledExpenseCategory } from "@/features/expenses/planning/types";
import { formatMXN } from "../helpers";

const CATEGORY_ICON: Record<ScheduledExpenseCategory, string> = {
  mechanic: "🔧",
  insurance: "🛡",
  medical: "🏥",
  utilities: "💡",
  subscription: "📅",
  other: "📌",
};

export function UpcomingSection() {
  const { scheduledExpenses, vacations } = usePlanningStore();
  const activeScheduled = scheduledExpenses.filter((expense) => expense.status !== "cancelled").sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  const activeVacations = vacations.filter((vacation) => vacation.status !== "cancelled" && (vacation.budget ?? 0) > 0);

  if (activeScheduled.length === 0 && activeVacations.length === 0) return null;

  const total =
    activeScheduled.filter((expense) => expense.amountKnown).reduce((sum, expense) => sum + expense.amount, 0) +
    activeVacations.reduce((sum, vacation) => sum + (vacation.budget ?? 0), 0);

  return (
    <details className="mt-3 rounded-lg border border-gray-200 bg-white" open>
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-900">Próximos programados</summary>
      <div className="divide-y divide-gray-100 px-4 pb-3">
        {activeScheduled.map((expense) => (
          <div key={expense.id} className="flex items-center gap-3 py-2">
            <span className="w-6 text-center">{CATEGORY_ICON[expense.category]}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-gray-900">{expense.title}</p>
              {(expense.scheduledDate || expense.time) && <p className="text-xs text-gray-500">{expense.scheduledDate}{expense.time ? ` ${expense.time}` : ""}</p>}
            </div>
            <p className="text-sm font-medium text-gray-900">{expense.amountKnown ? `$${formatMXN(expense.amount)}` : "Por definir"}</p>
          </div>
        ))}
        {activeVacations.map((vacation) => (
          <div key={vacation.id} className="flex items-center gap-3 py-2">
            <span className="w-6 text-center">✈️</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-gray-900">{vacation.name}</p>
              {(vacation.startDate || vacation.endDate) && <p className="text-xs text-gray-500">{vacation.startDate}{vacation.endDate ? ` – ${vacation.endDate}` : ""}</p>}
            </div>
            <p className="text-sm font-medium text-gray-900">${formatMXN(vacation.budget ?? 0)}</p>
          </div>
        ))}
        <div className="flex justify-between pt-3 text-sm font-bold text-gray-900">
          <span>Total estimado</span>
          <span>${formatMXN(total)}</span>
        </div>
      </div>
    </details>
  );
}
