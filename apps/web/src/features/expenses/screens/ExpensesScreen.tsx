import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ListPlus,
  Pencil,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { Badge, Button, Card, Dropdown, Modal, TextField } from "@/shared/ui";
import { useAuthStore } from "@/shared/store/authStore";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";
import { usePlanningStore } from "@/features/expenses/planning/store";
import { expensesApi } from "../api";
import {
  currentMonthName,
  currentQuincena,
  currentYear,
  formatMXN,
  getBillingPeriodCharges,
  getCreditHistory,
  getCreditHistoryForCard,
  getCurrentCreditBalance,
  MESES_LIST,
} from "../helpers";
import { useExpensesStore } from "../store";
import type {
  AppData,
  Expense,
  Frecuencia,
  MetodoPago,
  RecurringExpense,
} from "../types";

const DEBOUNCE_MS = 1500;
const YEAR_OPTIONS = Array.from(
  { length: 5 },
  (_, index) => currentYear() - 2 + index,
).map((year) => ({ label: String(year), value: String(year) }));
const MONTH_OPTIONS = MESES_LIST.map((month) => ({
  label: month,
  value: month,
}));
const QUINCENA_OPTIONS = [
  { label: "1-15", value: "15" },
  { label: "16-31", value: "30" },
];
const METODO_OPTIONS = [
  { label: "Todos", value: "todos" },
  { label: "Efectivo", value: "efectivo" },
  { label: "Crédito", value: "credito" },
];
const FRECUENCIA_OPTIONS = [
  { label: "Mensual", value: "mes" },
  { label: "Único", value: "unico" },
  { label: "Meses 3/10", value: "meses" },
];

type SyncStatus = "idle" | "saving" | "saved" | "error";

const syncConfig: Record<
  Exclude<SyncStatus, "idle">,
  { label: string; className: string }
> = {
  saving: { label: "Guardando...", className: "bg-amber-50 text-amber-800" },
  saved: { label: "Guardado", className: "bg-green-50 text-green-800" },
  error: { label: "Error al guardar", className: "bg-red-50 text-red-800" },
};

function SyncIndicator({ status }: { status: SyncStatus }) {
  if (status === "idle") return null;
  const cfg = syncConfig[status];
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-semibold ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

export function ExpensesScreen() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [year, setYear] = useState(String(currentYear()));
  const [month, setMonth] = useState(currentMonthName());
  const [quincena, setQuincena] = useState(String(currentQuincena()));
  const [metodo, setMetodo] = useState("todos");
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [simulatedAmount, setSimulatedAmount] = useState("");
  const userId = useAuthStore((s) => s.user?.id);

  const {
    expenses,
    creditCards,
    recurringExpenses,
    incomes,
    accounts,
    initialCreditDebt,
    creditDebtMes,
    creditCutDay,
    creditPayDay,
    activatedMonths,
    addExpenseFromModal,
    updateExpenseFromModal,
    removeExpense,
    addRecurringExpense,
    activateMonth,
    getAppData,
    loadAppData,
  } = useExpensesStore();
  const {
    scheduledExpenses,
    vacations,
    installmentPayments,
    updateScheduledExpense,
  } = usePlanningStore();
  const { isConnected } = useNetworkStatus();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);
  const hasPendingSync = useRef(false);
  const skipNextAutoSave = useRef(false);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!userId) return;
    expensesApi
      .get()
      .then((res) => {
        const appData = res.data as AppData;
        if (appData && Array.isArray(appData.expenses)) {
          skipNextAutoSave.current = true;
          loadAppData(appData);
        }
      })
      .catch((err) => console.error("[Finanzas] Error al cargar:", err))
      .finally(() => {
        initialLoadDone.current = true;
      });
  }, [loadAppData, userId]);

  useEffect(() => {
    if (!initialLoadDone.current) return;
    if (skipNextAutoSave.current) {
      skipNextAutoSave.current = false;
      return;
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setSyncStatus("saving");
    debounceTimer.current = setTimeout(() => {
      expensesApi
        .put(getAppData())
        .then(() => setSyncStatus("saved"))
        .catch(() => {
          setSyncStatus("error");
          hasPendingSync.current = true;
        });
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [
    expenses,
    creditCards,
    recurringExpenses,
    incomes,
    accounts,
    scheduledExpenses,
    vacations,
    installmentPayments,
    initialCreditDebt,
    creditCutDay,
    creditPayDay,
    getAppData,
  ]);

  useEffect(() => {
    if (!isConnected || !hasPendingSync.current) return;
    hasPendingSync.current = false;
    setSyncStatus("saving");
    expensesApi
      .put(getAppData())
      .then(() => setSyncStatus("saved"))
      .catch(() => {
        hasPendingSync.current = true;
        setSyncStatus("error");
      });
  }, [getAppData, isConnected]);

  useEffect(() => {
    if (!initialLoadDone.current) return;
    if (activatedMonths.includes(`${month}-${year}`)) return;
    activateMonth(month, Number(year));
  }, [activatedMonths, activateMonth, month, year]);

  const filteredExpenses = useMemo(() => {
    const selectedYear = Number(year);
    const selectedQuincena = Number(quincena);
    const selectedToday = new Date().getDate();
    const isSelectedCurrentPeriod =
      selectedYear === currentYear() && month === currentMonthName();
    const dueOrder = (expense: Expense) => {
      const day = expense.fecha || 99;
      return isSelectedCurrentPeriod &&
        expense.estado !== "pagado" &&
        day < selectedToday
        ? day + 100
        : day;
    };
    return expenses
      .filter((expense) => {
        if ((expense.año ?? currentYear()) !== selectedYear) return false;
        if (expense.mes !== month) return false;
        if (
          selectedQuincena === 15 &&
          !(expense.fecha >= 1 && expense.fecha <= 15)
        )
          return false;
        if (
          selectedQuincena === 30 &&
          !(expense.fecha >= 16 && expense.fecha <= 31)
        )
          return false;
        if (metodo !== "todos" && expense.metodoPago !== metodo) return false;
        return true;
      })
      .sort(
        (a, b) =>
          Number(a.estado === "pagado") - Number(b.estado === "pagado") ||
          dueOrder(a) - dueOrder(b) ||
          a.gastos.localeCompare(b.gastos),
      );
  }, [expenses, metodo, month, quincena, year]);

  const unpaid = filteredExpenses.filter(
    (expense) => expense.estado !== "pagado",
  );
  const totalPorPagar = unpaid
    .filter((expense) => expense.metodoPago === "efectivo")
    .reduce((sum, expense) => sum + expense.monto, 0);
  const totalCreditoPorPagar = unpaid
    .filter((expense) => expense.metodoPago === "credito")
    .reduce((sum, expense) => sum + expense.monto, 0);
  const now = new Date();
  const today = now.getDate();
  const todayIso = localDateIso(now);
  const isCurrentPeriod =
    Number(year) === currentYear() && month === currentMonthName();
  const dueSoon = isCurrentPeriod
    ? unpaid.filter(
        (expense) => expense.fecha >= today && expense.fecha <= today + 3,
      )
    : [];
  const upcomingScheduled = scheduledExpenses
    .filter((expense) => expense.status === "pending")
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    .slice(0, 6);
  const totalDeuda =
    creditCards.length > 0
      ? creditCards.reduce(
          (sum, card) =>
            sum +
            getCurrentCreditBalance(
              getCreditHistoryForCard(expenses, card),
              card.initialDebt,
            ),
          0,
        )
      : getCurrentCreditBalance(
          getCreditHistory(expenses, initialCreditDebt, creditDebtMes),
          initialCreditDebt,
        );
  const billingTotal = creditCards.reduce(
    (sum, card) =>
      sum +
      getBillingPeriodCharges(
        expenses,
        card.id,
        month,
        card.cutDay,
        Number(year),
      ).reduce((cardSum, expense) => cardSum + expense.monto, 0),
    0,
  );
  const simulatedTotal =
    totalPorPagar + totalCreditoPorPagar + (Number(simulatedAmount) || 0);

  function togglePaid(expense: Expense) {
    updateExpenseFromModal(expense.id, {
      mes: expense.mes,
      año: expense.año,
      gastos: expense.gastos,
      monto: expense.monto,
      metodoPago: expense.metodoPago,
      frecuencia: expense.frecuencia,
      fecha: expense.fecha,
      fechaMaxima: expense.fechaMaxima,
      estado: expense.estado === "pagado" ? "no pagado" : "pagado",
      ...(expense.creditCardId ? { creditCardId: expense.creditCardId } : {}),
      ...(expense.category ? { category: expense.category } : {}),
      ...(expense.accountId ? { accountId: expense.accountId } : {}),
    });
  }

  function startExpenseHold(expense: Expense) {
    longPressTriggered.current = false;
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setEditingExpense(expense);
    }, 550);
  }

  function clearExpenseHold() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
  }

  function openEditExpense(expense: Expense) {
    clearExpenseHold();
    longPressTriggered.current = true;
    setEditingExpense(expense);
  }

  function handleExpenseClick(expense: Expense) {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    togglePaid(expense);
  }

  function completeScheduledExpense(
    expense: (typeof scheduledExpenses)[number],
  ) {
    if (expense.amountKnown && expense.amount > 0) {
      const date = new Date(`${expense.scheduledDate}T12:00:00`);
      addExpenseFromModal({
        mes: MESES_LIST[date.getMonth()] ?? currentMonthName(),
        año: date.getFullYear(),
        gastos: expense.title,
        monto: expense.amount,
        metodoPago: expense.paymentMethod ?? "efectivo",
        frecuencia: "unico",
        fecha: date.getDate(),
        fechaMaxima: "",
        estado: "pagado",
      });
    }
    updateScheduledExpense(expense.id, { status: "done" });
  }

  return (
    <div className="page feature-page">
      <header className="feature-header">
        <h1 className="page-title">Finanzas</h1>
        <div className="flex items-center gap-2">
          <SyncIndicator status={syncStatus} />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => activateMonth(month, Number(year), true)}
          >
            <RefreshCw className="h-4 w-4" /> Generar fijos
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setSimulationOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" /> Simulación
          </Button>
          <Button size="sm" onClick={() => setExpenseModalOpen(true)}>
            <ListPlus className="h-4 w-4" /> Agregar
          </Button>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-4">
        <Dropdown
          label="Año"
          value={year}
          options={YEAR_OPTIONS}
          onChange={setYear}
        />
        <Dropdown
          label="Mes"
          value={month}
          options={MONTH_OPTIONS}
          onChange={setMonth}
        />
        <Dropdown
          label="Quincena"
          value={quincena}
          options={QUINCENA_OPTIONS}
          onChange={setQuincena}
        />
        <Dropdown
          label="Pago"
          value={metodo}
          options={METODO_OPTIONS}
          onChange={setMetodo}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Total de deuda" value={totalDeuda} />
        <Metric label="Gastos por pagar" value={totalPorPagar} />
        <Metric label="Crédito por pagar" value={totalCreditoPorPagar} />
        <Metric label="Al corte" value={billingTotal} />
      </div>

      <div className="grid   lg:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
        <Card padding="none">
          <div className="divide-y divide-gray-100">
            {filteredExpenses.length === 0 ? (
              <p className="p-6 text-sm text-gray-500">
                Sin gastos para estos filtros.
              </p>
            ) : (
              filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  role="button"
                  tabIndex={0}
                  className="flex w-full cursor-pointer select-none items-center gap-3 p-4 text-left hover:bg-gray-50"
                  onPointerDown={() => startExpenseHold(expense)}
                  onPointerUp={clearExpenseHold}
                  onPointerCancel={clearExpenseHold}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    openEditExpense(expense);
                  }}
                  onClick={() => handleExpenseClick(expense)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ")
                      handleExpenseClick(expense);
                  }}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border ${expense.estado === "pagado" ? "border-green-600 bg-green-600 text-white" : "border-gray-300"}`}
                  >
                    {expense.estado === "pagado" && (
                      <Check className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-sm font-semibold text-gray-900 ${expense.estado === "pagado" ? "line-through text-gray-400" : ""}`}
                    >
                      {expense.gastos || "Sin descripción"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {expense.fecha ? `Día ${expense.fecha}` : "Sin fecha"}{" "}
                      {expense.fechaMaxima ? `· ${expense.fechaMaxima}` : ""}
                      {isCurrentPeriod &&
                      expense.estado !== "pagado" &&
                      expense.fecha === today
                        ? " · vence hoy"
                        : ""}
                      {isCurrentPeriod &&
                      expense.estado !== "pagado" &&
                      expense.fecha > today &&
                      expense.fecha <= today + 3
                        ? " · próximo"
                        : ""}
                    </span>
                  </span>
                  <Badge
                    color={
                      expense.metodoPago === "credito" ? "purple" : "green"
                    }
                  >
                    {expense.metodoPago}
                  </Badge>
                  <span
                    className={`w-28 text-right text-sm font-semibold ${expense.estado === "pagado" ? "text-gray-400 line-through" : "text-gray-900"}`}
                  >
                    ${formatMXN(expense.monto)}
                  </span>
                  <button
                    type="button"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    aria-label={`Editar ${expense.gastos || "gasto"}`}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      openEditExpense(expense);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>

        <aside className="space-y-4">
          <Card padding="none">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-bold text-gray-900">
                Notificaciones
              </h2>
            </div>
            <div className="p-4 text-sm text-gray-600">
              {dueSoon.length > 0
                ? `${dueSoon.length} pago${dueSoon.length === 1 ? "" : "s"} vence${dueSoon.length === 1 ? "" : "n"} en los próximos 3 días.`
                : "Sin pagos próximos."}
            </div>
          </Card>

          <Card padding="none">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-bold text-gray-900">Programados</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {upcomingScheduled.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">Sin programados.</p>
              ) : (
                upcomingScheduled.map((expense) => (
                  <button
                    key={expense.id}
                    type="button"
                    className="flex w-full items-start gap-3 p-4 text-left hover:bg-gray-50"
                    onClick={() => completeScheduledExpense(expense)}
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-gray-300" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-gray-900">
                        {expense.title}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {expense.scheduledDate}
                        {expense.scheduledDate < todayIso ? " · vencido" : ""}
                        {expense.notes ? ` · ${expense.notes}` : ""}
                      </span>
                      <span className="mt-1 block text-sm font-semibold text-gray-900">
                        {expense.amountKnown
                          ? `$${formatMXN(expense.amount)}`
                          : "Sin monto"}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </Card>
        </aside>
      </div>

      <AddExpenseModal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        month={month}
        year={Number(year)}
        addExpense={(expense) => addExpenseFromModal(expense)}
        addRecurring={addRecurringExpense}
      />
      <AddExpenseModal
        open={editingExpense !== null}
        onClose={() => setEditingExpense(null)}
        month={editingExpense?.mes ?? month}
        year={editingExpense?.año ?? Number(year)}
        expense={editingExpense}
        addExpense={(expense) => addExpenseFromModal(expense)}
        updateExpense={updateExpenseFromModal}
        deleteExpense={removeExpense}
        addRecurring={addRecurringExpense}
      />

      <Modal
        open={simulationOpen}
        onClose={() => setSimulationOpen(false)}
        title="Simulación"
      >
        <div className="flex flex-col  ">
          <TextField
            label="Gasto simulado"
            type="number"
            value={simulatedAmount}
            onChange={(event) => setSimulatedAmount(event.target.value)}
            placeholder="0"
          />
          <Metric label="Total simulado por pagar" value={simulatedTotal} />
          <SimpleDataList
            title="Recurrentes"
            rows={recurringExpenses.map(
              (item) =>
                `${item.title} · $${formatMXN(item.amount)} · ${item.metodoPago}${item.totalInstallments ? ` · ${item.paidInstallments ?? 0}/${item.totalInstallments}` : ""}`,
            )}
          />
          <SimpleDataList
            title="Meses"
            rows={installmentPayments.map(
              (item) =>
                `${item.title} · $${formatMXN(item.monthlyAmount)} · ${item.paidMonths}/${item.totalMonths}`,
            )}
          />
        </div>
      </Modal>
    </div>
  );
}

function localDateIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card padding="sm">
      <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900">
        ${formatMXN(value)}
      </p>
    </Card>
  );
}

function SimpleDataList({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-gray-900">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">Sin datos.</p>
      ) : (
        rows.map((row) => (
          <p
            key={row}
            className="border-t border-gray-100 py-2 text-sm text-gray-700"
          >
            {row}
          </p>
        ))
      )}
    </div>
  );
}

function AddExpenseModal({
  open,
  onClose,
  month,
  year,
  expense,
  addExpense,
  updateExpense,
  deleteExpense,
  addRecurring,
}: {
  open: boolean;
  onClose: () => void;
  month: string;
  year: number;
  expense?: Expense | null;
  addExpense: (expense: Omit<Expense, "id" | "selected">) => void;
  updateExpense?: (
    id: string,
    expense: Omit<Expense, "id" | "selected">,
  ) => void;
  deleteExpense?: (id: string) => void;
  addRecurring: (
    item: Omit<RecurringExpense, "id" | "cancelledMonths">,
  ) => void;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
  const [frecuencia, setFrecuencia] = useState<Frecuencia | "meses">("unico");
  const [installments, setInstallments] = useState("3");
  const [day, setDay] = useState(String(new Date().getDate()));

  useEffect(() => {
    if (!open) return;
    setDescription(expense?.gastos ?? "");
    setAmount(expense ? String(expense.monto) : "");
    setMetodo(expense?.metodoPago ?? "efectivo");
    setFrecuencia(expense?.frecuencia ?? "unico");
    setInstallments("3");
    setDay(String(expense?.fecha || new Date().getDate()));
  }, [expense, open]);

  function save() {
    const monto = Number(amount) || 0;
    const fecha = Math.max(0, Math.min(31, Number(day) || 0));
    const title = description.trim();
    if (!title || monto <= 0) return;

    const data: Omit<Expense, "id" | "selected"> = {
      mes: expense?.mes ?? month,
      año: expense?.año ?? year,
      gastos: title,
      monto,
      metodoPago: metodo,
      frecuencia: frecuencia === "meses" ? "mes" : frecuencia,
      fecha,
      fechaMaxima: expense?.fechaMaxima ?? "",
      estado: expense?.estado ?? "no pagado",
      ...(expense?.creditCardId ? { creditCardId: expense.creditCardId } : {}),
      ...(expense?.category ? { category: expense.category } : {}),
      ...(expense?.accountId ? { accountId: expense.accountId } : {}),
    };

    if (expense && updateExpense) {
      updateExpense(expense.id, data);
    } else {
      addExpense(data);
    }
    if (!expense && (frecuencia === "mes" || frecuencia === "meses")) {
      addRecurring({
        title,
        amount: monto,
        days: [fecha || 1],
        category: "servicio",
        metodoPago: metodo,
        ...(frecuencia === "meses"
          ? {
              totalInstallments: Number(installments) || 1,
              paidInstallments: 1,
            }
          : {}),
      });
    }
    setDescription("");
    setAmount("");
    onClose();
  }

  function remove() {
    if (!expense || !deleteExpense) return;
    deleteExpense(expense.id);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={expense ? "Editar gasto" : "Agregar gasto"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          {expense && (
            <Button variant="danger" onClick={remove}>
              Eliminar
            </Button>
          )}
          <Button onClick={save}>
            {expense ? "Guardar cambios" : "Guardar"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col  ">
        <TextField
          label="Descripción"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <TextField
          label="Monto"
          type="number"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <Dropdown<MetodoPago>
          label="Tipo"
          value={metodo}
          options={
            METODO_OPTIONS.filter((option) => option.value !== "todos") as {
              label: string;
              value: MetodoPago;
            }[]
          }
          onChange={setMetodo}
        />
        <Dropdown
          label="Frecuencia"
          value={frecuencia}
          options={FRECUENCIA_OPTIONS}
          onChange={(value) => setFrecuencia(value as Frecuencia | "meses")}
        />
        {frecuencia === "meses" && (
          <TextField
            label="Meses"
            type="number"
            min={1}
            value={installments}
            onChange={(event) => setInstallments(event.target.value)}
          />
        )}
        <TextField
          label="Fecha límite de pago"
          type="number"
          min={1}
          max={31}
          value={day}
          onChange={(event) => setDay(event.target.value)}
        />
      </div>
    </Modal>
  );
}
