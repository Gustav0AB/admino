import { Badge, Button, Card } from "@/shared/ui";
import type { ReactNode } from "react";
import { useExpensesStore } from "../store";
import { formatMXN } from "../helpers";
import type { Expense } from "../types";

type Props = {
  expense: Expense;
  dense?: boolean;
  onEdit: () => void;
  onClone: () => void;
  onDelete: () => void;
};

export function ExpenseRow({ expense, dense, onEdit, onClone, onDelete }: Props) {
  const { toggleSelected } = useExpensesStore();
  const isCredito = expense.metodoPago === "credito";
  const isPagado = expense.estado === "pagado";
  const isTarjeta = expense.gastos.toLowerCase().trim() === "tarjeta de credito";
  const fechaRange = expense.fecha >= 1 && expense.fecha <= 15 ? "1-15" : expense.fecha >= 16 && expense.fecha <= 31 ? "16-31" : null;
  const estadoColor = expense.estado === "pagado" ? "green" : expense.estado === "guardado" ? "blue" : "yellow";
  const metodoLabel = isCredito ? "Crédito" : "Efectivo";
  const frecuenciaLabel = expense.frecuencia === "mes" ? "Mensual" : expense.frecuencia === "quincenal" ? "Quincenal" : "Único";

  return (
    <Card
      padding={dense ? "sm" : "md"}
      className={[
        "cursor-pointer transition",
        isTarjeta ? "bg-purple-50" : expense.selected ? "bg-blue-50" : isCredito ? "bg-indigo-50" : isPagado ? "bg-green-50" : "",
      ].join(" ")}
      onClick={onEdit}
    >
      <div className="grid gap-3 md:grid-cols-[32px_1fr_2fr_1fr_1fr_1fr_70px_1fr_1fr_72px] md:items-center">
        <button
          type="button"
          className={`h-5 w-5 rounded border text-xs ${expense.selected ? "border-primary bg-primary text-white" : "border-gray-300"}`}
          onClick={(event) => { event.stopPropagation(); toggleSelected(expense.id); }}
          aria-label="Seleccionar gasto"
        >
          {expense.selected ? "✓" : ""}
        </button>

        <Cell label="Mes">{expense.mes}</Cell>
        <Cell label="Descripción" strong>{expense.gastos || "—"}</Cell>
        <Cell label="Monto" align="right">${formatMXN(expense.monto)}</Cell>
        <Cell label="Método"><Badge color={isCredito ? "blue" : "green"}>{metodoLabel}</Badge></Cell>
        <Cell label="Frecuencia" muted>{frecuenciaLabel}</Cell>
        <Cell label="Fecha">{expense.fecha > 0 ? expense.fecha : "—"}{fechaRange ? <span className="ml-1 text-[10px] text-gray-400">({fechaRange})</span> : null}</Cell>
        <Cell label="Nota" muted>{expense.fechaMaxima || "—"}</Cell>
        <Cell label="Estado"><Badge color={estadoColor}>{expense.estado}</Badge></Cell>

        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); onClone(); }}>⧉</Button>
          <Button size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); onDelete(); }}>✕</Button>
        </div>
      </div>
    </Card>
  );
}

function Cell({
  label,
  children,
  strong,
  muted,
  align,
}: {
  label: string;
  children: ReactNode;
  strong?: boolean;
  muted?: boolean;
  align?: "right";
}) {
  return (
    <div className={align === "right" ? "text-left md:text-right" : ""}>
      <p className="text-[10px] font-semibold uppercase text-gray-400 md:hidden">{label}</p>
      <div className={`${strong ? "font-semibold" : ""} ${muted ? "text-gray-500" : "text-gray-900"} truncate text-sm`}>
        {children}
      </div>
    </div>
  );
}
