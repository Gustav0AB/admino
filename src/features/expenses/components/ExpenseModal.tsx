import { useEffect, useState, type ReactNode } from "react";
import { Button, Dropdown, Modal, TextField } from "@/shared/ui";
import { useExpensesStore } from "../store";
import { CATEGORIES, currentMonthName, MESES_LIST } from "../helpers";
import type { Estado, Expense, ExpenseCategory, Frecuencia, MetodoPago } from "../types";

type FormState = {
  mes: string;
  gastos: string;
  monto: number;
  metodoPago: MetodoPago;
  frecuencia: Frecuencia;
  fecha: number;
  fechaMaxima: string;
  estado: Estado;
  creditCardId: string;
  category: ExpenseCategory | "";
  accountId: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  expense?: Expense;
  onSave: (data: Omit<Expense, "id" | "selected">) => void;
  onDelete?: () => void;
};

const MES_OPTIONS = MESES_LIST.map((month) => ({ label: month, value: month }));
const FECHA_OPTIONS = [
  { label: "Sin fecha", value: "0" },
  ...Array.from({ length: 31 }, (_, index) => ({ label: String(index + 1), value: String(index + 1) })),
];

function blankForm(): FormState {
  return {
    mes: currentMonthName(),
    gastos: "",
    monto: 0,
    metodoPago: "efectivo",
    frecuencia: "mes",
    fecha: 0,
    fechaMaxima: "",
    estado: "no pagado",
    creditCardId: "",
    category: "",
    accountId: "",
  };
}

function expenseToForm(expense: Expense): FormState {
  return {
    mes: expense.mes,
    gastos: expense.gastos,
    monto: expense.monto,
    metodoPago: expense.metodoPago,
    frecuencia: expense.frecuencia,
    fecha: expense.fecha,
    fechaMaxima: expense.fechaMaxima,
    estado: expense.estado,
    creditCardId: expense.creditCardId ?? "",
    category: expense.category ?? "",
    accountId: expense.accountId ?? "",
  };
}

export function ExpenseModal({ open, onClose, expense, onSave, onDelete }: Props) {
  const { creditCards, accounts } = useExpensesStore();
  const isEdit = expense !== undefined;
  const [form, setForm] = useState<FormState>(isEdit ? expenseToForm(expense) : blankForm());
  const [cardError, setCardError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(expense ? expenseToForm(expense) : blankForm());
    setCardError("");
  }, [open, expense]);

  useEffect(() => {
    if (creditCards.length === 0 && form.metodoPago === "credito") patch({ metodoPago: "efectivo", creditCardId: "" });
  }, [creditCards.length, form.metodoPago]);

  function patch(update: Partial<FormState>) {
    setForm((current) => ({ ...current, ...update }));
    if (update.creditCardId) setCardError("");
  }

  function handleSelectCredito() {
    patch({ metodoPago: "credito", creditCardId: form.creditCardId || creditCards[0]?.id || "" });
  }

  function handleSave() {
    if (form.metodoPago === "credito" && !form.creditCardId) {
      setCardError("Debes seleccionar una tarjeta para pagos con crédito");
      return;
    }

    const data: Omit<Expense, "id" | "selected"> = {
      mes: form.mes,
      gastos: form.gastos,
      monto: form.monto,
      metodoPago: form.metodoPago,
      frecuencia: form.frecuencia,
      fecha: form.fecha,
      fechaMaxima: form.fechaMaxima,
      estado: form.estado,
    };
    if (form.creditCardId) data.creditCardId = form.creditCardId;
    if (form.category) data.category = form.category;
    if (form.accountId) data.accountId = form.accountId;
    onSave(data);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar gasto" : "Agregar gasto"}
      footer={
        <div className="flex w-full justify-between gap-3">
          <div>{isEdit && onDelete && <Button variant="danger" size="sm" onClick={onDelete}>Eliminar</Button>}</div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
            <Button size="sm" onClick={handleSave}>Guardar</Button>
          </div>
        </div>
      }
    >
      <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1">
        <TextField label="Descripción" value={form.gastos} onChange={(event) => patch({ gastos: event.target.value })} placeholder="Descripción del gasto" />
        <Dropdown label="Mes" value={form.mes} options={MES_OPTIONS} onChange={(value) => patch({ mes: value })} />
        <TextField label="Monto" type="number" value={form.monto === 0 ? "" : String(form.monto)} onChange={(event) => patch({ monto: Number(event.target.value) || 0 })} placeholder="0" />

        <FormSection label="Método de pago">
          <Chip label="Efectivo" selected={form.metodoPago === "efectivo"} onClick={() => patch({ metodoPago: "efectivo", creditCardId: "" })} />
          <Chip label="Crédito" selected={form.metodoPago === "credito"} onClick={handleSelectCredito} disabled={creditCards.length === 0} />
        </FormSection>

        {form.metodoPago === "credito" && (
          <Dropdown
            label="Tarjeta de crédito *"
            value={form.creditCardId}
            options={creditCards.map((card) => ({ label: card.name, value: card.id }))}
            onChange={(value) => patch({ creditCardId: value })}
            error={cardError}
          />
        )}

        {accounts.length > 0 && form.metodoPago === "efectivo" && (
          <Dropdown
            label="Cuenta de origen (opcional)"
            value={form.accountId}
            options={[{ label: "Sin vincular", value: "" }, ...accounts.map((account) => ({ label: account.name, value: account.id }))]}
            onChange={(value) => patch({ accountId: value })}
          />
        )}

        <FormSection label="Frecuencia">
          <Chip label="Mensual" selected={form.frecuencia === "mes"} onClick={() => patch({ frecuencia: "mes" })} />
          <Chip label="Quincenal" selected={form.frecuencia === "quincenal"} onClick={() => patch({ frecuencia: "quincenal" })} />
          <Chip label="Único" selected={form.frecuencia === "unico"} onClick={() => patch({ frecuencia: "unico" })} />
        </FormSection>

        <Dropdown label="Fecha de cobro" value={String(form.fecha)} options={FECHA_OPTIONS} onChange={(value) => patch({ fecha: Number(value) })} />

        <FormSection label="Estado">
          <Chip label="Pagado" selected={form.estado === "pagado"} onClick={() => patch({ estado: "pagado" })} />
          <Chip label="No pagado" selected={form.estado === "no pagado"} onClick={() => patch({ estado: "no pagado" })} />
          <Chip label="Guardado" selected={form.estado === "guardado"} onClick={() => patch({ estado: "guardado" })} />
          <Chip label="No guardado" selected={form.estado === "no guardado"} onClick={() => patch({ estado: "no guardado" })} />
        </FormSection>

        <FormSection label="Categoría">
          {CATEGORIES.map((category) => (
            <Chip
              key={category.value}
              label={category.label}
              selected={form.category === category.value}
              color={category.color}
              onClick={() => patch({ category: form.category === category.value ? "" : category.value })}
            />
          ))}
        </FormSection>

        <TextField label="Nota" value={form.fechaMaxima} onChange={(event) => patch({ fechaMaxima: event.target.value })} placeholder="Nota opcional" />
      </div>
    </Modal>
  );
}

function FormSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase text-gray-500">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  label,
  selected,
  onClick,
  disabled,
  color,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  color?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="rounded-full border px-3 py-1 text-xs disabled:opacity-40"
      style={{
        borderColor: selected ? (color ?? "#2563EB") : "#E5E7EB",
        backgroundColor: selected ? `${color ?? "#2563EB"}22` : "transparent",
        color: selected ? (color ?? "#2563EB") : "#374151",
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
