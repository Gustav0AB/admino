import { useMemo, useState } from "react";
import { Button, Card, ConfirmModal, Dropdown } from "@/shared/ui";
import { useExpensesStore } from "../store";
import { formatMXN, getFilteredExpenses, MESES_LIST } from "../helpers";
import { ExpenseModal } from "./ExpenseModal";
import { ExpenseRow } from "./ExpenseRow";
import { UpcomingSection } from "./UpcomingSection";
import type { Estado, Expense } from "../types";

const ESTADO_OPTIONS: { label: string; value: Estado }[] = [
  { label: "Pagado", value: "pagado" },
  { label: "No pagado", value: "no pagado" },
  { label: "Guardado", value: "guardado" },
  { label: "No guardado", value: "no guardado" },
];

type SectionData = { title: string; data: Expense[]; total: number };

export function ExpenseList() {
  const {
    expenses,
    filterMes,
    filterFrecuencia,
    filterFecha,
    filterAño,
    filterCategoria,
    selectAll,
    bulkAddExpenses,
    bulkUpdateEstado,
    bulkDuplicateExpenses,
    duplicateExpense,
    removeExpense,
    addExpenseFromModal,
    updateExpenseFromModal,
  } = useExpensesStore();

  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkEstado, setBulkEstado] = useState<Estado>("pagado");
  const [bulkMeses, setBulkMeses] = useState<string[]>([]);
  const [showBulkDup, setShowBulkDup] = useState(false);
  const [dense, setDense] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteConfirmExpense, setDeleteConfirmExpense] = useState<Expense | null>(null);

  const filtered = useMemo(
    () => getFilteredExpenses(expenses, filterMes, filterFrecuencia, filterFecha, filterAño, filterCategoria),
    [expenses, filterMes, filterFrecuencia, filterFecha, filterAño, filterCategoria],
  );
  const selected = filtered.filter((expense) => expense.selected);
  const allSelected = filtered.length > 0 && selected.length === filtered.length;

  const groupedSections = useMemo<SectionData[]>(() => {
    if (filterMes !== "Todos") return [{ title: "", data: filtered, total: 0 }];
    const map = new Map<string, Expense[]>();
    for (const expense of filtered) map.set(expense.mes, [...(map.get(expense.mes) ?? []), expense]);
    return MESES_LIST.filter((month) => map.has(month)).map((month) => {
      const data = map.get(month) ?? [];
      return {
        title: month,
        data,
        total: data.filter((expense) => expense.metodoPago !== "credito").reduce((sum, expense) => sum + expense.monto, 0),
      };
    });
  }, [filtered, filterMes]);

  const statusBarData = useMemo(() => {
    const gastos = filtered.filter((expense) => expense.metodoPago !== "credito");
    const pagado = gastos.filter((expense) => expense.estado === "pagado").reduce((sum, expense) => sum + expense.monto, 0);
    const sinPagar = gastos.filter((expense) => expense.estado === "no pagado" || expense.estado === "no guardado").reduce((sum, expense) => sum + expense.monto, 0);
    const guardado = gastos.filter((expense) => expense.estado === "guardado").reduce((sum, expense) => sum + expense.monto, 0);
    return { pagado, sinPagar, guardado, total: pagado + sinPagar + guardado };
  }, [filtered]);

  function handleBulkAdd() {
    const mes = filterMes !== "Todos" ? filterMes : (MESES_LIST[new Date().getMonth()] ?? "Enero");
    bulkAddExpenses(bulkText, mes);
    setBulkText("");
    setShowBulkAdd(false);
  }

  function toggleBulkMes(mes: string) {
    setBulkMeses((current) => current.includes(mes) ? current.filter((item) => item !== mes) : [...current, mes]);
  }

  function makeRowProps(expense: Expense) {
    return {
      expense,
      dense,
      onEdit: () => { setEditingExpense(expense); setEditModalOpen(true); },
      onClone: () => duplicateExpense(expense.id, [expense.mes]),
      onDelete: () => setDeleteConfirmExpense(expense),
    };
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <ExpenseModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={(data) => {
          addExpenseFromModal(data);
          setAddModalOpen(false);
        }}
      />
      <ExpenseModal
        open={editModalOpen}
        {...(editingExpense ? { expense: editingExpense } : {})}
        onClose={() => setEditModalOpen(false)}
        onSave={(data) => {
          if (editingExpense) updateExpenseFromModal(editingExpense.id, data);
          setEditModalOpen(false);
        }}
        onDelete={() => {
          setDeleteConfirmExpense(editingExpense);
          setEditModalOpen(false);
        }}
      />
      <ConfirmModal
        open={deleteConfirmExpense !== null}
        title="¿Eliminar gasto?"
        message="Esto eliminará el registro permanentemente."
        cancelText="Cancelar"
        confirmText="Eliminar"
        onClose={() => setDeleteConfirmExpense(null)}
        onConfirm={async () => {
          if (deleteConfirmExpense) removeExpense(deleteConfirmExpense.id);
        }}
      />

      <Card padding="sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`h-5 w-5 rounded border text-xs ${allSelected ? "border-primary bg-primary text-white" : "border-gray-300"}`}
              onClick={() => selectAll(!allSelected)}
              aria-label="Seleccionar todos"
            >
              {allSelected ? "✓" : ""}
            </button>
            <Button size="sm" onClick={() => setAddModalOpen(true)}>Agregar</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowBulkAdd((value) => !value)}>Múltiple</Button>
            <Button variant="ghost" size="sm" onClick={() => setDense((value) => !value)}>{dense ? "Vista cómoda" : "Vista compacta"}</Button>
          </div>

          {selected.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-500">{selected.length} seleccionados</span>
              <Dropdown options={ESTADO_OPTIONS} value={bulkEstado} onChange={(value) => setBulkEstado(value as Estado)} />
              <Button variant="secondary" size="sm" onClick={() => bulkUpdateEstado(bulkEstado)}>Aplicar</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowBulkDup(true)}>Duplicar</Button>
            </div>
          )}
        </div>
      </Card>

      {showBulkAdd && (
        <Card>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-500">Formato: Renta, 8500, 30, efectivo (una por línea)</p>
            <textarea
              className="min-h-24 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              value={bulkText}
              onChange={(event) => setBulkText(event.target.value)}
              placeholder={"Renta, 8500, 30, efectivo\nGroceries, 2000, 15, credito"}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setShowBulkAdd(false); setBulkText(""); }}>Cancelar</Button>
              <Button size="sm" onClick={handleBulkAdd}>Agregar</Button>
            </div>
          </div>
        </Card>
      )}

      {showBulkDup && (
        <Card>
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-900">Duplicar {selected.length} filas a:</p>
            <div className="flex flex-wrap gap-2">
              {MESES_LIST.map((mes) => {
                const active = bulkMeses.includes(mes);
                return (
                  <button
                    key={mes}
                    type="button"
                    className={`rounded-md border px-3 py-1 text-xs ${active ? "border-primary bg-blue-50 text-primary" : "border-gray-200 text-gray-700"}`}
                    onClick={() => toggleBulkMes(mes)}
                  >
                    {mes.slice(0, 3)}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setShowBulkDup(false); setBulkMeses([]); }}>Cancelar</Button>
              <Button
                size="sm"
                onClick={() => {
                  if (bulkMeses.length > 0) bulkDuplicateExpenses(bulkMeses);
                  setShowBulkDup(false);
                  setBulkMeses([]);
                }}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {statusBarData.total > 0 && <StatusBar data={statusBarData} />}
      <UpcomingSection />

      {groupedSections.length === 0 ? (
        <Card className="text-center text-sm text-gray-500">Sin gastos para los filtros actuales.</Card>
      ) : (
        groupedSections.map((section) => (
          <div key={section.title || "filtered"} className="flex flex-col gap-2">
            {section.title && (
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                <span className="font-semibold text-gray-900">{section.title}</span>
                <span className="text-gray-500">${formatMXN(section.total)}</span>
              </div>
            )}
            {section.data.map((expense) => <ExpenseRow key={expense.id} {...makeRowProps(expense)} />)}
          </div>
        ))
      )}
    </div>
  );
}

function StatusBar({ data }: { data: { pagado: number; sinPagar: number; guardado: number; total: number } }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="bg-green-600" style={{ flex: data.pagado || 0 }} />
        <div className="bg-yellow-600" style={{ flex: data.sinPagar || 0 }} />
        <div className="bg-blue-600" style={{ flex: data.guardado || 0 }} />
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="text-green-600">Pag. ${formatMXN(data.pagado)}</span>
        <span className="text-yellow-600">S/P ${formatMXN(data.sinPagar)}</span>
        <span className="text-blue-600">Grd. ${formatMXN(data.guardado)}</span>
      </div>
    </div>
  );
}
