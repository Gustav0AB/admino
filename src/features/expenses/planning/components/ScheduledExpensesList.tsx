import { useState, type ReactNode } from "react";
import { Badge, Button, Card, Modal, TextField } from "@generic/components";
import { formatMXN } from "../../helpers";
import { usePlanningStore } from "../store";
import type { ScheduledExpense, ScheduledExpenseCategory, ScheduledExpenseStatus } from "../types";

const CATEGORY_LABELS: Record<ScheduledExpenseCategory, string> = {
  mechanic: "Mecánico",
  insurance: "Seguro",
  medical: "Médico",
  utilities: "Servicios",
  subscription: "Suscripción",
  other: "Otro",
};
const CATEGORY_ICONS: Record<ScheduledExpenseCategory, string> = {
  mechanic: "🔧",
  insurance: "🛡",
  medical: "🏥",
  utilities: "💡",
  subscription: "📅",
  other: "📌",
};
const STATUS_LABELS: Record<ScheduledExpenseStatus, string> = {
  pending: "Pendiente",
  done: "Completado",
  cancelled: "Cancelado",
};
const STATUS_COLOR: Record<ScheduledExpenseStatus, "yellow" | "green" | "gray"> = {
  pending: "yellow",
  done: "green",
  cancelled: "gray",
};
const CATEGORIES = Object.keys(CATEGORY_LABELS) as ScheduledExpenseCategory[];

type FormState = {
  title: string;
  scheduledDate: string;
  category: ScheduledExpenseCategory;
  amountKnown: boolean;
  amount: string;
  notes: string;
  status: ScheduledExpenseStatus;
  paymentMethod: "efectivo" | "credito";
};

const blankForm = (): FormState => ({
  title: "",
  scheduledDate: "",
  category: "other",
  amountKnown: false,
  amount: "",
  notes: "",
  status: "pending",
  paymentMethod: "efectivo",
});

export function ScheduledExpensesList() {
  const { scheduledExpenses, addScheduledExpense, updateScheduledExpense, removeScheduledExpense } = usePlanningStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(blankForm());
  const sorted = [...scheduledExpenses].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  const totalKnown = scheduledExpenses.filter((item) => item.amountKnown && item.status !== "cancelled").reduce((sum, item) => sum + item.amount, 0);
  const unknownCount = scheduledExpenses.filter((item) => !item.amountKnown && item.status !== "cancelled").length;

  function openAdd() {
    setEditingId(null);
    setForm(blankForm());
    setModalOpen(true);
  }

  function openEdit(expense: ScheduledExpense) {
    setEditingId(expense.id);
    setForm({
      title: expense.title,
      scheduledDate: expense.scheduledDate,
      category: expense.category,
      amountKnown: expense.amountKnown,
      amount: expense.amount > 0 ? String(expense.amount) : "",
      notes: expense.notes,
      status: expense.status,
      paymentMethod: expense.paymentMethod ?? "efectivo",
    });
    setModalOpen(true);
  }

  function handleSave() {
    if (!form.title.trim() || !form.scheduledDate.trim()) return;
    const payload = {
      title: form.title.trim(),
      scheduledDate: form.scheduledDate,
      category: form.category,
      amountKnown: form.amountKnown,
      amount: form.amountKnown ? Number(form.amount) || 0 : 0,
      notes: form.notes.trim(),
      status: form.status,
      paymentMethod: form.paymentMethod,
    };
    if (editingId) updateScheduledExpense(editingId, payload);
    else addScheduledExpense(payload);
    setModalOpen(false);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Summary value={`$${formatMXN(totalKnown)}`} label="Total conocido" />
        <Summary value={String(unknownCount)} label="Monto por definir" />
        <Summary value={String(scheduledExpenses.length)} label="Total programados" />
      </div>

      <Button size="sm" onClick={openAdd}>+ Agregar gasto</Button>

      {sorted.length === 0 ? (
        <Card className="border-dashed text-center">
          <p className="text-4xl">📋</p>
          <p className="font-semibold text-gray-700">No hay gastos programados aún</p>
          <p className="text-sm text-gray-400">Agrega citas al mecánico, pagos de seguro y más</p>
        </Card>
      ) : (
        sorted.map((expense) => (
          <Card key={expense.id} className={`cursor-pointer ${expense.status !== "pending" ? "opacity-60" : ""}`} onClick={() => openEdit(expense)}>
            <div className="grid gap-3 sm:grid-cols-[36px_1fr_auto] sm:items-center">
              <span className="text-2xl">{CATEGORY_ICONS[expense.category]}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`truncate font-semibold text-gray-900 ${expense.status === "done" ? "line-through" : ""}`}>{expense.title}</p>
                  <Badge color={STATUS_COLOR[expense.status]}>{STATUS_LABELS[expense.status]}</Badge>
                </div>
                <p className="text-xs text-gray-500">{CATEGORY_LABELS[expense.category]} · {expense.scheduledDate}</p>
                {expense.notes && <p className="truncate text-xs text-gray-400">{expense.notes}</p>}
              </div>
              <p className="font-bold text-gray-900">{expense.amountKnown ? `$${formatMXN(expense.amount)}` : "Por definir"}</p>
            </div>
          </Card>
        ))
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar gasto" : "Agregar gasto programado"}
        footer={
          <div className="flex w-full justify-between gap-3">
            <div>{editingId && <Button variant="danger" size="sm" onClick={() => { removeScheduledExpense(editingId); setModalOpen(false); }}>Eliminar</Button>}</div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleSave}>{editingId ? "Guardar" : "Agregar"}</Button>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <TextField label="Título *" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ej: Cita al mecánico" />
          <TextField label="Fecha programada *" type="date" value={form.scheduledDate} onChange={(event) => setForm({ ...form, scheduledDate: event.target.value })} />
          <Field label="Categoría">
            <ChipRow options={CATEGORIES.map((category) => ({ label: `${CATEGORY_ICONS[category]} ${CATEGORY_LABELS[category]}`, value: category }))} value={form.category} onChange={(value) => setForm({ ...form, category: value as ScheduledExpenseCategory })} />
          </Field>
          <Field label="¿Sabes cuánto costará?">
            <ChipRow options={[{ label: "Monto conocido", value: "yes" }, { label: "Por definir", value: "no" }]} value={form.amountKnown ? "yes" : "no"} onChange={(value) => setForm({ ...form, amountKnown: value === "yes" })} />
          </Field>
          {form.amountKnown && <TextField label="Monto ($)" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0.00" />}
          <Field label="Método de pago">
            <ChipRow options={[{ label: "Efectivo", value: "efectivo" }, { label: "Tarjeta de crédito", value: "credito" }]} value={form.paymentMethod} onChange={(value) => setForm({ ...form, paymentMethod: value as "efectivo" | "credito" })} />
          </Field>
          <Field label="Estado">
            <ChipRow options={(Object.keys(STATUS_LABELS) as ScheduledExpenseStatus[]).map((status) => ({ label: STATUS_LABELS[status], value: status }))} value={form.status} onChange={(value) => setForm({ ...form, status: value as ScheduledExpenseStatus })} />
          </Field>
          <TextField label="Notas" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Notas opcionales" />
        </div>
      </Modal>
    </div>
  );
}

function Summary({ value, label }: { value: string; label: string }) {
  return <Card className="text-center"><p className="font-bold text-gray-900">{value}</p><p className="text-xs text-gray-500">{label}</p></Card>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="flex flex-col gap-2"><span className="text-sm font-medium text-gray-700">{label}</span>{children}</div>;
}

function ChipRow({ options, value, onChange }: { options: { label: string; value: string }[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button key={option.value} type="button" className={`rounded-full border px-3 py-1 text-xs ${value === option.value ? "border-primary bg-blue-50 text-primary" : "border-gray-200 text-gray-700"}`} onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}
