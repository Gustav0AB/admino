import { useMemo } from "react";
import { Card } from "@/shared/ui";
import { useExpensesStore } from "../store";
import { formatMXN, getFilteredExpenses } from "../helpers";
import { usePlanningStore } from "@/features/expenses/planning/store";

export function SummaryPanel() {
  const { expenses, filterMes, filterFrecuencia, filterFecha, filterAño, filterCategoria } = useExpensesStore();
  const { scheduledExpenses, vacations } = usePlanningStore();

  const filtered = useMemo(
    () => getFilteredExpenses(expenses, filterMes, filterFrecuencia, filterFecha, filterAño, filterCategoria),
    [expenses, filterMes, filterFrecuencia, filterFecha, filterAño, filterCategoria],
  );

  const selected = filtered.filter((expense) => expense.selected);

  const { pagado, sinPagar, credito, totalFiltrado } = useMemo(() => {
    const gastos = filtered.filter((expense) => expense.metodoPago !== "credito");
    const pag = gastos.filter((expense) => expense.estado === "pagado").reduce((sum, expense) => sum + expense.monto, 0);
    const sin = gastos.filter((expense) => expense.estado === "no pagado" || expense.estado === "no guardado").reduce((sum, expense) => sum + expense.monto, 0);
    const cred = filtered.filter((expense) => expense.metodoPago === "credito").reduce((sum, expense) => sum + expense.monto, 0);
    return { pagado: pag, sinPagar: sin, credito: cred, totalFiltrado: gastos.reduce((sum, expense) => sum + expense.monto, 0) };
  }, [filtered]);

  const upcomingTotal = useMemo(
    () => scheduledExpenses.filter((expense) => expense.amountKnown && expense.status !== "cancelled").reduce((sum, expense) => sum + expense.amount, 0),
    [scheduledExpenses],
  );

  const vacationsTotal = useMemo(
    () => vacations.filter((vacation) => vacation.status !== "cancelled" && (vacation.budget ?? 0) > 0).reduce((sum, vacation) => sum + (vacation.budget ?? 0), 0),
    [vacations],
  );

  return (
    <Card className="flex flex-col gap-2">
      <h2 className="mb-1 text-sm font-bold text-gray-900">Resumen</h2>
      <Row label="Pagados" value={`$${formatMXN(pagado)}`} />
      <Row label="Sin pagar" value={`$${formatMXN(sinPagar)}`} />
      <Row label="Crédito" value={`$${formatMXN(credito)}`} valueClassName="text-primary" />
      <hr className="border-gray-200" />
      <Row label="Total filtrado" value={`$${formatMXN(totalFiltrado)}`} strong />
      <hr className="border-gray-200" />
      <Row label="Programados" value={`$${formatMXN(upcomingTotal)}`} muted />
      <Row label="Vacaciones" value={`$${formatMXN(vacationsTotal)}`} muted />
      <p className="mt-1 text-xs text-gray-500">{filtered.length} registros · {selected.length} seleccionados</p>
    </Card>
  );
}

function Row({ label, value, strong, muted, valueClassName = "" }: { label: string; value: string; strong?: boolean; muted?: boolean; valueClassName?: string }) {
  return (
    <div className={`flex justify-between gap-4 ${muted ? "text-xs" : "text-sm"}`}>
      <span className={`${strong ? "font-semibold" : ""} text-gray-500`}>{label}</span>
      <span className={`${strong ? "font-bold" : "font-medium"} ${muted ? "text-gray-500" : "text-gray-900"} ${valueClassName}`}>{value}</span>
    </div>
  );
}
