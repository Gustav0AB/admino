import { useMemo, useState, type ReactNode } from "react";
import { Card, Dropdown } from "@/shared/ui";
import { usePlanningStore } from "@/features/expenses/planning/store";
import { useExpensesStore } from "../store";
import {
  CATEGORIES,
  currentMonthName,
  currentYear,
  formatMXN,
  getAccountBalance,
  getAvailableAños,
  getAvailableMeses,
  getCreditHistoryForCard,
  getCurrentCreditBalance,
  MESES_LIST,
} from "../helpers";

export function ResumenTab() {
  const { expenses, creditCards, recurringExpenses, incomes, accounts } = useExpensesStore();
  const { scheduledExpenses, vacations, installmentPayments } = usePlanningStore();
  const [selectedMes, setSelectedMes] = useState(currentMonthName());
  const [selectedAño, setSelectedAño] = useState(currentYear());
  const availableMeses = useMemo(() => getAvailableMeses(expenses), [expenses]);
  const availableAños = useMemo(() => getAvailableAños(expenses), [expenses]);

  const filtered = useMemo(() => {
    let result = selectedMes === "__all__" ? expenses : expenses.filter((expense) => expense.mes === selectedMes);
    if (selectedAño > 0) result = result.filter((expense) => (expense.año ?? currentYear()) === selectedAño);
    return result;
  }, [expenses, selectedMes, selectedAño]);

  const stats = useMemo(() => {
    const cash = filtered.filter((expense) => expense.metodoPago !== "credito");
    const pagado = cash.filter((expense) => expense.estado === "pagado").reduce((sum, expense) => sum + expense.monto, 0);
    const sinPagar = cash.filter((expense) => expense.estado === "no pagado" || expense.estado === "no guardado").reduce((sum, expense) => sum + expense.monto, 0);
    return {
      pagado,
      sinPagar,
      credito: filtered.filter((expense) => expense.metodoPago === "credito").reduce((sum, expense) => sum + expense.monto, 0),
      efectivo: cash.filter((expense) => expense.metodoPago === "efectivo").reduce((sum, expense) => sum + expense.monto, 0),
      total: cash.reduce((sum, expense) => sum + expense.monto, 0),
    };
  }, [filtered]);

  const incomeStats = useMemo(() => {
    const items = incomes.filter((income) => {
      if (selectedMes !== "__all__" && income.mes !== selectedMes) return false;
      if (selectedAño > 0 && (income.año ?? currentYear()) !== selectedAño) return false;
      return true;
    });
    const recibido = items.filter((income) => income.estado === "recibido").reduce((sum, income) => sum + income.monto, 0);
    const pendiente = items.filter((income) => income.estado === "pendiente").reduce((sum, income) => sum + income.monto, 0);
    return { recibido, pendiente, total: recibido + pendiente };
  }, [incomes, selectedMes, selectedAño]);

  const accountBalances = useMemo(() => accounts.map((account) => ({ account, balance: getAccountBalance(account, expenses, incomes) })), [accounts, expenses, incomes]);
  const cardBalances = useMemo(() => creditCards.map((card) => {
    const history = getCreditHistoryForCard(expenses, card);
    const balance = getCurrentCreditBalance(history, card.initialDebt);
    const monthTotal = expenses.filter((expense) => expense.creditCardId === card.id && (selectedMes === "__all__" || expense.mes === selectedMes)).reduce((sum, expense) => sum + expense.monto, 0);
    return { card, balance, monthTotal };
  }), [creditCards, expenses, selectedMes]);

  const byCategory = useMemo(() => CATEGORIES.map((category) => {
    const items = filtered.filter((expense) => expense.category === category.value && expense.metodoPago !== "credito");
    return items.length ? { ...category, total: items.reduce((sum, expense) => sum + expense.monto, 0), count: items.length } : null;
  }).filter(Boolean) as { value: string; label: string; color: string; total: number; count: number }[], [filtered]);

  const byMonth = useMemo(() => {
    if (selectedMes !== "__all__") return [];
    return MESES_LIST.map((mes) => {
      const items = expenses.filter((expense) => expense.mes === mes && expense.metodoPago !== "credito");
      if (!items.length) return null;
      return {
        mes,
        total: items.reduce((sum, expense) => sum + expense.monto, 0),
        pagado: items.filter((expense) => expense.estado === "pagado").reduce((sum, expense) => sum + expense.monto, 0),
        sinPagar: items.filter((expense) => expense.estado !== "pagado").reduce((sum, expense) => sum + expense.monto, 0),
      };
    }).filter(Boolean) as { mes: string; total: number; pagado: number; sinPagar: number }[];
  }, [expenses, selectedMes]);

  const recurringTotal = recurringExpenses
    .filter((item) => selectedMes === "__all__" || !item.cancelledMonths.includes(selectedMes))
    .reduce((sum, item) => sum + item.amount * item.days.length, 0);
  const scheduledPending = scheduledExpenses.filter((item) => item.status === "pending" && item.amountKnown);
  const scheduledTotal = scheduledPending.reduce((sum, item) => sum + item.amount, 0);
  const vacationsActive = vacations.filter((vacation) => vacation.status !== "cancelled");
  const vacationsTotal = vacationsActive.reduce((sum, vacation) => sum + getVacationBudget(vacation), 0);
  const upcomingItems = getUpcomingItems({ recurringExpenses, scheduledExpenses, creditCards, installmentPayments });
  const upcomingTotal = upcomingItems.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const totalAccountBalance = accountBalances.reduce((sum, item) => sum + item.balance, 0);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap gap-3">
        <Dropdown value={String(selectedAño)} options={[{ label: "Todos los años", value: "0" }, ...availableAños.map((year) => ({ label: String(year), value: String(year) }))]} onChange={(value) => setSelectedAño(Number(value))} />
        <Dropdown value={selectedMes} options={[{ label: "Todos los meses", value: "__all__" }, ...MESES_LIST.filter((month) => availableMeses.includes(month)).map((month) => ({ label: month, value: month }))]} onChange={setSelectedMes} />
      </div>

      {upcomingItems.length > 0 && (
        <Section title={`Próximos 30 días · $${formatMXN(upcomingTotal)}`}>
          {upcomingItems.map((item) => <InfoRow key={item.id} label={`${item.type} ${item.title} · ${item.dueDate.getDate()} ${MESES_LIST[item.dueDate.getMonth()]}`} value={item.amount != null ? `$${formatMXN(item.amount)}` : "—"} color={item.urgency} />)}
        </Section>
      )}

      {accountBalances.length > 0 && (
        <Section title="Cuentas">
          <InfoRow label="Saldo total" value={`$${formatMXN(totalAccountBalance)}`} strong color={totalAccountBalance >= 0 ? "#16A34A" : "#EF4444"} />
          {accountBalances.map(({ account, balance }) => <InfoRow key={account.id} label={account.name} value={`$${formatMXN(balance)}`} color={balance >= 0 ? "#16A34A" : "#EF4444"} dot={account.color} />)}
        </Section>
      )}

      {incomeStats.total > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Ingresos" value={incomeStats.recibido} color="#16A34A" />
          <StatCard label="Gastos" value={stats.total} color="#EF4444" />
          <StatCard label="Balance" value={incomeStats.recibido - stats.total} color={incomeStats.recibido - stats.total >= 0 ? "#16A34A" : "#EF4444"} />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total" value={stats.total} color="#2563EB" />
        <StatCard label="Pagado" value={stats.pagado} color="#16A34A" />
        <StatCard label="Sin pagar" value={stats.sinPagar} color="#EF4444" />
        <StatCard label="Crédito" value={stats.credito} color="#2563EB" />
        <StatCard label="Efectivo" value={stats.efectivo} color="#111827" />
        <StatCard label="Registros" value={filtered.length} isCount color="#6B7280" />
      </div>

      {recurringExpenses.length > 0 && (
        <Section title="Fijos">
          <InfoRow label={`${recurringExpenses.filter((item) => selectedMes === "__all__" || !item.cancelledMonths.includes(selectedMes)).length} activos`} value={`$${formatMXN(recurringTotal)}`} strong />
          {selectedMes !== "__all__" && recurringExpenses.filter((item) => !item.cancelledMonths.includes(selectedMes)).map((item) => (
            <InfoRow key={item.id} label={`${item.title} · ${item.days.length === 1 ? `día ${item.days[0]}` : `días ${[...item.days].sort((a, b) => a - b).join(", ")}`}`} value={item.days.length > 1 ? `$${formatMXN(item.amount)} ×${item.days.length}` : `$${formatMXN(item.amount)}`} muted />
          ))}
        </Section>
      )}

      {cardBalances.length > 0 && (
        <Section title="Tarjetas de crédito">
          {cardBalances.map(({ card, balance, monthTotal }) => (
            <div key={card.id}>
              <InfoRow label={card.name} value={`$${formatMXN(balance)}`} strong />
              {monthTotal > 0 && <InfoRow label={`Cargos ${selectedMes === "__all__" ? "total" : selectedMes}`} value={`$${formatMXN(monthTotal)}`} muted />}
            </div>
          ))}
        </Section>
      )}

      {scheduledPending.length > 0 && (
        <Section title="Programados pendientes">
          <InfoRow label={`${scheduledPending.length} agendados`} value={`$${formatMXN(scheduledTotal)}`} strong />
          {scheduledPending.slice(0, 5).map((item) => <InfoRow key={item.id} label={`${item.title} · ${item.scheduledDate}`} value={`$${formatMXN(item.amount)}`} muted />)}
        </Section>
      )}

      {vacationsActive.length > 0 && (
        <Section title="Vacaciones">
          <InfoRow label={`${vacationsActive.length} planes`} value={`$${formatMXN(vacationsTotal)}`} strong />
          {vacationsActive.map((vacation) => <InfoRow key={vacation.id} label={vacation.name} value={`$${formatMXN(getVacationBudget(vacation))}`} muted />)}
        </Section>
      )}

      {byCategory.length > 0 && (
        <Section title="Por categoría">
          {byCategory.map((category) => <InfoRow key={category.value} label={`${category.label} · ${category.count}`} value={`$${formatMXN(category.total)}`} color={category.color} dot={category.color} />)}
        </Section>
      )}

      {byMonth.length > 0 && (
        <Section title="Desglose por mes">
          {byMonth.map((month) => <InfoRow key={month.mes} label={month.mes} value={`$${formatMXN(month.total)}`} strong />)}
        </Section>
      )}
    </div>
  );
}

function StatCard({ label, value, color, isCount }: { label: string; value: number; color: string; isCount?: boolean }) {
  return (
    <Card>
      <p className="text-xl font-bold" style={{ color }}>{isCount ? value : `$${formatMXN(value)}`}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        {children}
      </div>
    </Card>
  );
}

function InfoRow({ label, value, color, strong, muted, dot }: { label: string; value: string; color?: string; strong?: boolean; muted?: boolean; dot?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5 text-sm">
      <span className={`${strong ? "font-semibold" : ""} ${muted ? "text-gray-500" : "text-gray-900"} min-w-0 truncate`}>
        {dot && <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />}
        {label}
      </span>
      <span className={`${strong ? "font-bold" : "font-medium"} shrink-0`} style={{ color }}>{value}</span>
    </div>
  );
}

function getVacationBudget(vacation: { budget?: number; payments?: { amount: number; perPerson: boolean }[]; persons?: string[] }) {
  if (!vacation.payments?.length) return vacation.budget ?? 0;
  const people = Math.max(vacation.persons?.length ?? 0, 1);
  return vacation.payments.reduce((sum, payment) => sum + payment.amount * (payment.perPerson ? people : 1), 0);
}

function getUpcomingItems({
  recurringExpenses,
  scheduledExpenses,
  creditCards,
  installmentPayments,
}: {
  recurringExpenses: ReturnType<typeof useExpensesStore.getState>["recurringExpenses"];
  scheduledExpenses: ReturnType<typeof usePlanningStore.getState>["scheduledExpenses"];
  creditCards: ReturnType<typeof useExpensesStore.getState>["creditCards"];
  installmentPayments: ReturnType<typeof usePlanningStore.getState>["installmentPayments"];
}) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const limit = new Date(start.getTime() + 30 * 86400000);
  const nextOcc = (day: number) => {
    const date = new Date(start.getFullYear(), start.getMonth(), day);
    return date >= start ? date : new Date(start.getFullYear(), start.getMonth() + 1, day);
  };
  const urgency = (date: Date) => {
    const diff = Math.round((date.getTime() - start.getTime()) / 86400000);
    return diff <= 2 ? "#EF4444" : diff <= 7 ? "#F59E0B" : "#16A34A";
  };
  const items: { id: string; title: string; amount: number | null; dueDate: Date; type: string; urgency: string }[] = [];

  for (const item of recurringExpenses) for (const day of item.days) {
    const dueDate = nextOcc(day);
    if (dueDate > limit || item.cancelledMonths.includes(MESES_LIST[dueDate.getMonth()] ?? "")) continue;
    items.push({ id: `rec-${item.id}-${day}`, title: item.title, amount: item.amount, dueDate, type: "🔄", urgency: urgency(dueDate) });
  }
  for (const item of scheduledExpenses) {
    if (item.status !== "pending") continue;
    const dueDate = new Date(`${item.scheduledDate}T00:00:00`);
    if (dueDate < start || dueDate > limit) continue;
    items.push({ id: `sched-${item.id}`, title: item.title, amount: item.amountKnown ? item.amount : null, dueDate, type: "📅", urgency: urgency(dueDate) });
  }
  for (const card of creditCards) {
    if (!card.payDay) continue;
    const dueDate = nextOcc(card.payDay);
    if (dueDate <= limit) items.push({ id: `cc-${card.id}`, title: `Pago ${card.name}`, amount: null, dueDate, type: "💳", urgency: urgency(dueDate) });
  }
  for (const item of installmentPayments) {
    if (item.status !== "active") continue;
    const dueDate = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    items.push({ id: `msi-${item.id}`, title: item.title, amount: item.monthlyAmount, dueDate, type: "📦", urgency: urgency(dueDate) });
  }
  return items.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}
