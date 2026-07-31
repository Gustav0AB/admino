import { useMemo } from "react";
import { Card } from "@generic/components";
import { useExpensesStore } from "../store";
import { usePlanningStore } from "../planning/store";
import { formatMXN, MESES_LIST } from "../helpers";

const DAYS_AHEAD = 30;

type UpcomingItem = {
  id: string;
  title: string;
  amount: number | null;
  dueDate: Date;
  type: "recurring" | "scheduled" | "credit-card" | "msi";
  tag?: string;
};

function nextOccurrence(day: number, from: Date): Date {
  const date = new Date(from.getFullYear(), from.getMonth(), day);
  return date >= from ? date : new Date(from.getFullYear(), from.getMonth() + 1, day);
}

function withinWindow(date: Date, from: Date, days: number): boolean {
  return date >= from && date <= new Date(from.getTime() + days * 86400000);
}

function formatRelative(date: Date, today: Date): string {
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff <= 6) return `En ${diff} días`;
  return `${date.getDate()} ${MESES_LIST[date.getMonth()] ?? ""}`;
}

function urgencyClass(date: Date, today: Date): string {
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff <= 2) return "border-l-red-500 text-red-600 bg-red-50";
  if (diff <= 7) return "border-l-amber-500 text-amber-600 bg-amber-50";
  return "border-l-green-500 text-green-600 bg-green-50";
}

const TYPE_ICONS: Record<UpcomingItem["type"], string> = {
  recurring: "🔄",
  scheduled: "📅",
  "credit-card": "💳",
  msi: "📦",
};

const TYPE_LABELS: Record<UpcomingItem["type"], string> = {
  recurring: "Recurrente",
  scheduled: "Agendado",
  "credit-card": "Tarjeta",
  msi: "MSI",
};

export function UpcomingTab() {
  const { recurringExpenses, creditCards } = useExpensesStore();
  const { scheduledExpenses, installmentPayments } = usePlanningStore();

  const { items, today } = useMemo(() => {
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const result: UpcomingItem[] = [];

    for (const recurring of recurringExpenses) {
      for (const day of recurring.days) {
        const dueDate = nextOccurrence(day, todayMidnight);
        const dueMonth = MESES_LIST[dueDate.getMonth()] ?? "";
        if (recurring.cancelledMonths.includes(dueMonth) || !withinWindow(dueDate, todayMidnight, DAYS_AHEAD)) continue;
        result.push({
          id: `rec-${recurring.id}-${day}`,
          title: recurring.title,
          amount: recurring.amount,
          dueDate,
          type: "recurring",
          tag: recurring.metodoPago === "credito" ? "crédito" : undefined,
        });
      }
    }

    for (const scheduled of scheduledExpenses) {
      if (scheduled.status !== "pending") continue;
      const dueDate = new Date(`${scheduled.scheduledDate}T00:00:00`);
      if (!withinWindow(dueDate, todayMidnight, DAYS_AHEAD)) continue;
      result.push({
        id: `sched-${scheduled.id}`,
        title: scheduled.title,
        amount: scheduled.amountKnown ? scheduled.amount : null,
        dueDate,
        type: "scheduled",
      });
    }

    for (const card of creditCards) {
      if (!card.payDay) continue;
      const dueDate = nextOccurrence(card.payDay, todayMidnight);
      if (!withinWindow(dueDate, todayMidnight, DAYS_AHEAD)) continue;
      result.push({ id: `cc-${card.id}`, title: `Pago ${card.name}`, amount: null, dueDate, type: "credit-card", tag: card.name });
    }

    const endOfMonth = new Date(todayMidnight.getFullYear(), todayMidnight.getMonth() + 1, 0);
    for (const installment of installmentPayments) {
      if (installment.status !== "active") continue;
      result.push({
        id: `msi-${installment.id}`,
        title: installment.title,
        amount: installment.monthlyAmount,
        dueDate: endOfMonth,
        type: "msi",
        tag: `${installment.paidMonths}/${installment.totalMonths} pagados`,
      });
    }

    return { items: result.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()), today: todayMidnight };
  }, [recurringExpenses, creditCards, scheduledExpenses, installmentPayments]);

  const totalKnown = items.reduce((sum, item) => sum + (item.amount ?? 0), 0);

  return (
    <div className="flex flex-col gap-3 p-4">
      <Card className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Compromisos próximos 30 días</p>
        <p className="mt-1 text-3xl font-extrabold text-gray-900">${formatMXN(totalKnown)}</p>
        <p className="text-xs text-gray-500">{items.length} vencimiento{items.length !== 1 ? "s" : ""}</p>
      </Card>

      {items.length === 0 ? (
        <Card className="text-center text-sm text-gray-500">Sin vencimientos en los próximos 30 días.</Card>
      ) : (
        items.map((item) => (
          <Card key={item.id} padding="sm" className={`border-l-4 ${urgencyClass(item.dueDate, today)}`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{TYPE_ICONS[item.type]}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{item.title}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-primary">{TYPE_LABELS[item.type]}</span>
                  {item.tag && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{item.tag}</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{item.amount != null ? `$${formatMXN(item.amount)}` : "—"}</p>
                <p className="text-xs font-semibold">{formatRelative(item.dueDate, today)}</p>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
