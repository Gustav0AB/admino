import { useMemo, useState } from "react";
import { Button, Card, Dropdown, TextField } from "@/shared/ui";
import { useExpensesStore } from "../store";
import { currentMonthName, currentYear, formatMXN, INCOME_CATEGORIES, MESES_LIST } from "../helpers";
import type { Income, IncomeCategory, IncomeEstado, IncomeFrecuencia } from "../types";

const MES_OPTIONS = MESES_LIST.map((month) => ({ label: month, value: month }));
const FECHA_OPTIONS = [
  { label: "Sin fecha", value: "0" },
  ...Array.from({ length: 31 }, (_, index) => ({ label: String(index + 1), value: String(index + 1) })),
];

type IncomeForm = {
  mes: string;
  descripcion: string;
  monto: number;
  fecha: number;
  frecuencia: IncomeFrecuencia;
  estado: IncomeEstado;
  category: IncomeCategory;
  accountId: string;
};

function blankForm(mes: string): IncomeForm {
  return { mes, descripcion: "", monto: 0, fecha: 0, frecuencia: "mes", estado: "pendiente", category: "sueldo", accountId: "" };
}

function incomeToForm(income: Income): IncomeForm {
  return {
    mes: income.mes,
    descripcion: income.descripcion,
    monto: income.monto,
    fecha: income.fecha,
    frecuencia: income.frecuencia,
    estado: income.estado,
    category: income.category,
    accountId: income.accountId ?? "",
  };
}

export function IncomesTab() {
  const { incomes, accounts, addIncome, removeIncome, updateIncome } = useExpensesStore();
  const [selectedMes, setSelectedMes] = useState(currentMonthName());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<IncomeForm>(blankForm(currentMonthName()));

  function patch(update: Partial<IncomeForm>) {
    setForm((current) => ({ ...current, ...update }));
  }

  function openAdd() {
    setEditingId(null);
    setForm(blankForm(selectedMes));
    setShowForm(true);
  }

  function openEdit(income: Income) {
    setEditingId(income.id);
    setForm(incomeToForm(income));
    setShowForm(true);
  }

  function handleSave() {
    if (!form.descripcion.trim() || form.monto <= 0) return;
    const { accountId, ...rest } = form;
    const data: Omit<Income, "id"> = { ...rest, año: currentYear(), ...(accountId ? { accountId } : {}) };
    if (editingId) updateIncome(editingId, data);
    else addIncome(data);
    setShowForm(false);
    setEditingId(null);
  }

  const filtered = useMemo(() => incomes.filter((income) => income.mes === selectedMes), [incomes, selectedMes]);
  const totalRecibido = filtered.filter((income) => income.estado === "recibido").reduce((sum, income) => sum + income.monto, 0);
  const totalPendiente = filtered.filter((income) => income.estado === "pendiente").reduce((sum, income) => sum + income.monto, 0);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <Dropdown value={selectedMes} options={MES_OPTIONS} onChange={setSelectedMes} />
        <Button size="sm" onClick={openAdd}>+ Ingreso</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Recibido" value={totalRecibido} className="text-green-600" />
        <SummaryCard label="Pendiente" value={totalPendiente} className="text-gray-500" />
        <SummaryCard label={`Total ${selectedMes}`} value={totalRecibido + totalPendiente} className="text-primary" />
      </div>

      {showForm && (
        <Card className="border-primary">
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-bold text-gray-900">{editingId ? "Editar ingreso" : "Nuevo ingreso"}</h2>
            <TextField label="Descripción" value={form.descripcion} onChange={(event) => patch({ descripcion: event.target.value })} placeholder="Ej. Sueldo quincena" />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Monto ($)" type="number" value={form.monto === 0 ? "" : String(form.monto)} onChange={(event) => patch({ monto: Number(event.target.value) || 0 })} placeholder="0" />
              <Dropdown label="Mes" value={form.mes} options={MES_OPTIONS} onChange={(value) => patch({ mes: value })} />
              <Dropdown label="Fecha" value={String(form.fecha)} options={FECHA_OPTIONS} onChange={(value) => patch({ fecha: Number(value) })} />
              <ChipGroup
                label="Frecuencia"
                options={[
                  { label: "Mensual", value: "mes" },
                  { label: "Quincenal", value: "quincenal" },
                  { label: "Único", value: "unico" },
                ]}
                value={form.frecuencia}
                onChange={(value) => patch({ frecuencia: value as IncomeFrecuencia })}
              />
            </div>
            <ChipGroup
              label="Estado"
              options={[
                { label: "Recibido", value: "recibido" },
                { label: "Pendiente", value: "pendiente" },
              ]}
              value={form.estado}
              onChange={(value) => patch({ estado: value as IncomeEstado })}
            />
            <ChipGroup
              label="Categoría"
              options={INCOME_CATEGORIES.map((category) => ({ label: category.label, value: category.value }))}
              value={form.category}
              onChange={(value) => patch({ category: value as IncomeCategory })}
            />
            {accounts.length > 0 && (
              <Dropdown
                label="Cuenta destino (opcional)"
                value={form.accountId}
                options={[{ label: "Sin vincular", value: "" }, ...accounts.map((account) => ({ label: account.name, value: account.id }))]}
                onChange={(value) => patch({ accountId: value })}
              />
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancelar</Button>
              <Button size="sm" onClick={handleSave}>Guardar</Button>
            </div>
          </div>
        </Card>
      )}

      {filtered.length === 0 && !showForm && (
        <Card className="border-dashed text-center text-sm text-gray-500">
          Sin ingresos en {selectedMes}.<br />Agrega uno con el botón de arriba.
        </Card>
      )}

      {filtered.map((income) => (
        <IncomeRow
          key={income.id}
          income={income}
          onEdit={() => openEdit(income)}
          onRemove={() => removeIncome(income.id)}
          onToggleEstado={() => updateIncome(income.id, { estado: income.estado === "recibido" ? "pendiente" : "recibido" })}
        />
      ))}
    </div>
  );
}

function SummaryCard({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <Card className="text-center">
      <p className={`text-lg font-extrabold ${className}`}>${formatMXN(value)}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </Card>
  );
}

function IncomeRow({ income, onEdit, onRemove, onToggleEstado }: { income: Income; onEdit: () => void; onRemove: () => void; onToggleEstado: () => void }) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const category = INCOME_CATEGORIES.find((item) => item.value === income.category);
  const isRecibido = income.estado === "recibido";

  return (
    <Card padding="sm">
      <div className="flex items-center gap-3">
        <button type="button" className={`h-4 w-4 rounded-full ${isRecibido ? "bg-green-600" : "bg-gray-300"}`} onClick={onToggleEstado} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{income.descripcion}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {category && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{category.label}</span>}
            {income.fecha > 0 && <span className="text-xs text-gray-500">día {income.fecha}</span>}
            <span className={`text-xs ${isRecibido ? "text-green-600" : "text-gray-500"}`}>{isRecibido ? "Recibido" : "Pendiente"}</span>
          </div>
        </div>
        <p className="font-bold text-green-600">+${formatMXN(income.monto)}</p>
        <Button size="sm" variant="ghost" onClick={onEdit}>✎</Button>
        {confirmRemove ? (
          <div className="flex gap-2 text-sm">
            <button type="button" className="font-semibold text-red-600" onClick={onRemove}>Sí</button>
            <button type="button" className="text-gray-500" onClick={() => setConfirmRemove(false)}>No</button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setConfirmRemove(true)}>✕</Button>
        )}
      </div>
    </Card>
  );
}

function ChipGroup({ label, options, value, onChange }: { label: string; options: { label: string; value: string }[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-gray-500">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`rounded-full border px-3 py-1 text-xs ${value === option.value ? "border-primary bg-blue-50 text-primary" : "border-gray-200 text-gray-700"}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
