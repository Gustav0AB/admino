import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ListPlus, SlidersHorizontal } from "lucide-react";
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
import type { AppData, Expense, Frecuencia, MetodoPago, RecurringExpense } from "../types";

const DEBOUNCE_MS = 1500;
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, index) => currentYear() - 2 + index).map((year) => ({ label: String(year), value: String(year) }));
const MONTH_OPTIONS = MESES_LIST.map((month) => ({ label: month, value: month }));
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

const syncConfig: Record<Exclude<SyncStatus, "idle">, { label: string; className: string }> = {
  saving: { label: "Guardando...", className: "bg-amber-50 text-amber-800" },
  saved: { label: "Guardado", className: "bg-green-50 text-green-800" },
  error: { label: "Error al guardar", className: "bg-red-50 text-red-800" },
};

function SyncIndicator({ status }: { status: SyncStatus }) {
  if (status === "idle") return null;
  const cfg = syncConfig[status];
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${cfg.className}`}>{cfg.label}</span>;
}

export function ExpensesScreen() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [year, setYear] = useState(String(currentYear()));
  const [month, setMonth] = useState(currentMonthName());
  const [quincena, setQuincena] = useState(String(currentQuincena()));
  const [metodo, setMetodo] = useState("todos");
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
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
    addExpenseFromModal,
    updateExpenseFromModal,
    addRecurringExpense,
    getAppData,
    loadAppData,
  } = useExpensesStore();
  const { scheduledExpenses, vacations, installmentPayments } = usePlanningStore();
  const { isConnected } = useNetworkStatus();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      expensesApi.put(getAppData())
        .then(() => setSyncStatus("saved"))
        .catch(() => {
          setSyncStatus("error");
          hasPendingSync.current = true;
        });
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [expenses, creditCards, recurringExpenses, incomes, accounts, scheduledExpenses, vacations, installmentPayments, initialCreditDebt, creditCutDay, creditPayDay, getAppData]);

  useEffect(() => {
    if (!isConnected || !hasPendingSync.current) return;
    hasPendingSync.current = false;
    setSyncStatus("saving");
    expensesApi.put(getAppData())
      .then(() => setSyncStatus("saved"))
      .catch(() => {
        hasPendingSync.current = true;
        setSyncStatus("error");
      });
  }, [getAppData, isConnected]);

  const filteredExpenses = useMemo(() => {
    const selectedYear = Number(year);
    const selectedQuincena = Number(quincena);
    return expenses
      .filter((expense) => {
        if ((expense.año ?? currentYear()) !== selectedYear) return false;
        if (expense.mes !== month) return false;
        if (selectedQuincena === 15 && !(expense.fecha >= 1 && expense.fecha <= 15)) return false;
        if (selectedQuincena === 30 && !(expense.fecha >= 16 && expense.fecha <= 31)) return false;
        if (metodo !== "todos" && expense.metodoPago !== metodo) return false;
        return true;
      })
      .sort((a, b) => Number(a.estado === "pagado") - Number(b.estado === "pagado") || a.fecha - b.fecha || a.gastos.localeCompare(b.gastos));
  }, [expenses, metodo, month, quincena, year]);

  const unpaid = filteredExpenses.filter((expense) => expense.estado !== "pagado");
  const totalPorPagar = unpaid.filter((expense) => expense.metodoPago === "efectivo").reduce((sum, expense) => sum + expense.monto, 0);
  const totalCreditoPorPagar = unpaid.filter((expense) => expense.metodoPago === "credito").reduce((sum, expense) => sum + expense.monto, 0);
  const totalDeuda = creditCards.length > 0
    ? creditCards.reduce((sum, card) => sum + getCurrentCreditBalance(getCreditHistoryForCard(expenses, card), card.initialDebt), 0)
    : getCurrentCreditBalance(getCreditHistory(expenses, initialCreditDebt, creditDebtMes), initialCreditDebt);
  const billingTotal = creditCards.reduce(
    (sum, card) => sum + getBillingPeriodCharges(expenses, card.id, month, card.cutDay, Number(year)).reduce((cardSum, expense) => cardSum + expense.monto, 0),
    0
  );
  const simulatedTotal = totalPorPagar + totalCreditoPorPagar + (Number(simulatedAmount) || 0);

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

  return (
    <div className="page feature-page">
      <header className="feature-header">
        <h1 className="page-title">Finanzas</h1>
        <div className="flex items-center gap-2">
          <SyncIndicator status={syncStatus} />
          <Button size="sm" variant="secondary" onClick={() => setSimulationOpen(true)}><SlidersHorizontal className="h-4 w-4" /> Simulación</Button>
          <Button size="sm" onClick={() => setExpenseModalOpen(true)}><ListPlus className="h-4 w-4" /> Agregar</Button>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-4">
        <Dropdown label="Año" value={year} options={YEAR_OPTIONS} onChange={setYear} />
        <Dropdown label="Mes" value={month} options={MONTH_OPTIONS} onChange={setMonth} />
        <Dropdown label="Quincena" value={quincena} options={QUINCENA_OPTIONS} onChange={setQuincena} />
        <Dropdown label="Pago" value={metodo} options={METODO_OPTIONS} onChange={setMetodo} />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Total de deuda" value={totalDeuda} />
        <Metric label="Gastos por pagar" value={totalPorPagar} />
        <Metric label="Crédito por pagar" value={totalCreditoPorPagar} />
        <Metric label="Al corte" value={billingTotal} />
      </div>

      <Card padding="none">
        <div className="divide-y divide-gray-100">
          {filteredExpenses.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">Sin gastos para estos filtros.</p>
          ) : filteredExpenses.map((expense) => (
            <button key={expense.id} type="button" className="flex w-full items-center gap-3 p-4 text-left hover:bg-gray-50" onClick={() => togglePaid(expense)}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border ${expense.estado === "pagado" ? "border-green-600 bg-green-600 text-white" : "border-gray-300"}`}>
                {expense.estado === "pagado" && <Check className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-sm font-semibold text-gray-900 ${expense.estado === "pagado" ? "line-through text-gray-400" : ""}`}>{expense.gastos || "Sin descripción"}</span>
                <span className="text-xs text-gray-500">{expense.fecha ? `Día ${expense.fecha}` : "Sin fecha"} {expense.fechaMaxima ? `· ${expense.fechaMaxima}` : ""}</span>
              </span>
              <Badge color={expense.metodoPago === "credito" ? "purple" : "green"}>{expense.metodoPago}</Badge>
              <span className={`w-28 text-right text-sm font-semibold ${expense.estado === "pagado" ? "text-gray-400 line-through" : "text-gray-900"}`}>${formatMXN(expense.monto)}</span>
            </button>
          ))}
        </div>
      </Card>

      <AddExpenseModal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        month={month}
        year={Number(year)}
        addExpense={(expense) => addExpenseFromModal(expense)}
        addRecurring={addRecurringExpense}
      />

      <Modal open={simulationOpen} onClose={() => setSimulationOpen(false)} title="Simulación">
        <div className="flex flex-col gap-4">
          <TextField label="Gasto simulado" type="number" value={simulatedAmount} onChange={(event) => setSimulatedAmount(event.target.value)} placeholder="0" />
          <Metric label="Total simulado por pagar" value={simulatedTotal} />
          <SimpleDataList title="Recurrentes" rows={recurringExpenses.map((item) => `${item.title} · $${formatMXN(item.amount)} · ${item.metodoPago}${item.totalInstallments ? ` · ${item.paidInstallments ?? 0}/${item.totalInstallments}` : ""}`)} />
          <SimpleDataList title="Meses" rows={installmentPayments.map((item) => `${item.title} · $${formatMXN(item.monthlyAmount)} · ${item.paidMonths}/${item.totalMonths}`)} />
        </div>
      </Modal>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <Card padding="sm"><p className="text-xs font-semibold uppercase text-gray-500">{label}</p><p className="mt-1 text-xl font-bold text-gray-900">${formatMXN(value)}</p></Card>;
}

function SimpleDataList({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-gray-900">{title}</h3>
      {rows.length === 0 ? <p className="text-sm text-gray-500">Sin datos.</p> : rows.map((row) => <p key={row} className="border-t border-gray-100 py-2 text-sm text-gray-700">{row}</p>)}
    </div>
  );
}

function AddExpenseModal({
  open,
  onClose,
  month,
  year,
  addExpense,
  addRecurring,
}: {
  open: boolean;
  onClose: () => void;
  month: string;
  year: number;
  addExpense: (expense: Omit<Expense, "id" | "selected">) => void;
  addRecurring: (item: Omit<RecurringExpense, "id" | "cancelledMonths">) => void;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
  const [frecuencia, setFrecuencia] = useState<Frecuencia | "meses">("unico");
  const [installments, setInstallments] = useState("3");
  const [day, setDay] = useState(String(new Date().getDate()));

  function save() {
    const monto = Number(amount) || 0;
    const fecha = Math.max(0, Math.min(31, Number(day) || 0));
    const title = description.trim();
    if (!title || monto <= 0) return;

    addExpense({
      mes: month,
      año: year,
      gastos: title,
      monto,
      metodoPago: metodo,
      frecuencia: frecuencia === "meses" ? "mes" : frecuencia,
      fecha,
      fechaMaxima: "",
      estado: "no pagado",
    });
    if (frecuencia === "mes" || frecuencia === "meses") {
      addRecurring({
        title,
        amount: monto,
        days: [fecha || 1],
        category: "servicio",
        metodoPago: metodo,
        ...(frecuencia === "meses" ? { totalInstallments: Number(installments) || 1, paidInstallments: 1 } : {}),
      });
    }
    setDescription("");
    setAmount("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Agregar gasto" footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={save}>Guardar</Button></>}>
      <div className="flex flex-col gap-4">
        <TextField label="Descripción" value={description} onChange={(event) => setDescription(event.target.value)} />
        <TextField label="Monto" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} />
        <Dropdown<MetodoPago> label="Tipo" value={metodo} options={METODO_OPTIONS.filter((option) => option.value !== "todos") as { label: string; value: MetodoPago }[]} onChange={setMetodo} />
        <Dropdown label="Frecuencia" value={frecuencia} options={FRECUENCIA_OPTIONS} onChange={(value) => setFrecuencia(value as Frecuencia | "meses")} />
        {frecuencia === "meses" && <TextField label="Meses" type="number" min={1} value={installments} onChange={(event) => setInstallments(event.target.value)} />}
        <TextField label="Fecha límite de pago" type="number" min={1} max={31} value={day} onChange={(event) => setDay(event.target.value)} />
      </div>
    </Modal>
  );
}
