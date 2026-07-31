import { useEffect, useState } from "react";
import { Button, Card, Dropdown, TextField } from "@generic/components";
import { usePlanningStore } from "@/features/expenses/planning/store";
import { useExpensesStore } from "../store";
import { currentMonthName, currentYear, formatMXN, MESES_LIST } from "../helpers";
import type { RecurringCategory, RecurringExpense, RecurringSchedulingType } from "../types";
import type { InstallmentPayment, ScheduledExpense, ScheduledExpenseCategory } from "@/features/expenses/planning/types";

const SUB_TABS = ["Básicos", "Servicios", "Agendados", "Pagos a meses", "Simulación"] as const;
type SubTab = (typeof SUB_TABS)[number];
type IntervalUnit = "days" | "months";

const MONTH_OPTIONS = MESES_LIST.map((month) => ({ label: month, value: month }));
const DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => ({ label: String(index + 1), value: String(index + 1) }));
const CATEGORY_OPTIONS: { label: string; value: ScheduledExpenseCategory }[] = [
  { label: "Mecánico", value: "mechanic" },
  { label: "Seguro", value: "insurance" },
  { label: "Médico", value: "medical" },
  { label: "Servicios", value: "utilities" },
  { label: "Suscripción", value: "subscription" },
  { label: "Otro", value: "other" },
];

type RecurringForm = {
  title: string;
  amount: string;
  schedulingType: RecurringSchedulingType;
  days: number[];
  intervalUnit: IntervalUnit;
  intervalValue: string;
  startDate: string;
  expirationDate: string;
  metodoPago: "efectivo" | "credito";
  creditCardId: string;
  totalInstallments: string;
  paidInstallments: string;
};

const blankRecurring = (): RecurringForm => ({
  title: "",
  amount: "",
  schedulingType: "monthly",
  days: [],
  intervalUnit: "days",
  intervalValue: "",
  startDate: "",
  expirationDate: "",
  metodoPago: "efectivo",
  creditCardId: "",
  totalInstallments: "",
  paidInstallments: "0",
});

function recurringToForm(item: RecurringExpense): RecurringForm {
  return {
    title: item.title,
    amount: String(item.amount),
    schedulingType: item.schedulingType ?? "monthly",
    days: item.days,
    intervalUnit: item.intervalMonths ? "months" : "days",
    intervalValue: String(item.intervalDays ?? item.intervalMonths ?? ""),
    startDate: item.startDate ?? "",
    expirationDate: item.expirationDate ?? "",
    metodoPago: item.metodoPago,
    creditCardId: item.creditCardId ?? "",
    totalInstallments: String(item.totalInstallments ?? ""),
    paidInstallments: String(item.paidInstallments ?? 0),
  };
}

export function FijosTab() {
  const [subTab, setSubTab] = useState<SubTab>("Básicos");
  const [selectedMes, setSelectedMes] = useState(currentMonthName());
  const [selectedAño, setSelectedAño] = useState(currentYear());
  const { activatedMonths, activateMonth, deactivateMonth } = useExpensesStore();
  const thisYear = currentYear();
  const currentMes = currentMonthName();
  const isCurrent = selectedMes === currentMes && selectedAño === thisYear;
  const activationKey = `${selectedMes}-${selectedAño}`;
  const isActivated = isCurrent || activatedMonths.includes(activationKey);

  useEffect(() => {
    if (new Date().getDate() < 25) return;
    const nextMonth = MESES_LIST[(new Date().getMonth() + 1) % 12] ?? "Enero";
    activateMonth(nextMonth, new Date().getMonth() === 11 ? thisYear + 1 : thisYear);
  }, [activateMonth, thisYear]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="tabs">
        {SUB_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`tab ${subTab === tab ? "tab-active" : ""}`}
            onClick={() => setSubTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {(subTab === "Básicos" || subTab === "Servicios") && (
        <div className="flex flex-wrap items-end gap-3">
          <Dropdown value={String(selectedAño)} options={[thisYear - 1, thisYear, thisYear + 1].map((year) => ({ label: String(year), value: String(year) }))} onChange={(value) => setSelectedAño(Number(value))} />
          <Dropdown value={selectedMes} options={MONTH_OPTIONS} onChange={setSelectedMes} />
          {!isCurrent && (
            <Button variant={isActivated ? "secondary" : "ghost"} size="sm" onClick={() => isActivated ? deactivateMonth(selectedMes, selectedAño) : activateMonth(selectedMes, selectedAño)}>
              {isActivated ? "✓ gastos aplicados" : "+ aplicar a gastos"}
            </Button>
          )}
        </div>
      )}

      {subTab === "Básicos" && <RecurringList category="basico" selectedMes={selectedMes} />}
      {subTab === "Servicios" && <RecurringList category="servicio" selectedMes={selectedMes} />}
      {subTab === "Agendados" && <AgendadosList />}
      {subTab === "Pagos a meses" && <PagosMesesTab />}
      {subTab === "Simulación" && <SimulacionTab />}
    </div>
  );
}

function RecurringList({ category, selectedMes }: { category: RecurringCategory; selectedMes: string }) {
  const { recurringExpenses, creditCards, addRecurringExpense, updateRecurringExpense, removeRecurringExpense, toggleCancelMonth, addExpenseFromModal } = useExpensesStore();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<RecurringForm>(blankRecurring());
  const items = recurringExpenses.filter((item) => item.category === category);
  const cardOptions = [{ label: "Seleccionar tarjeta", value: "" }, ...creditCards.map((card) => ({ label: card.name, value: card.id }))];

  function patch(update: Partial<RecurringForm>) {
    setForm((current) => ({ ...current, ...update }));
  }

  function startEdit(item: RecurringExpense) {
    setEditId(item.id);
    setForm(recurringToForm(item));
    setShowForm(true);
  }

  function save() {
    const amount = Number(form.amount) || 0;
    if (!form.title.trim() || amount <= 0) return;
    if (form.schedulingType === "monthly" && form.days.length === 0) return;
    if (form.schedulingType === "interval" && (!form.intervalValue || !form.startDate)) return;
    if (form.metodoPago === "credito" && !form.creditCardId) return;

    const intervalValue = Number(form.intervalValue) || 0;
    const totalInstallments = Number(form.totalInstallments) || undefined;
    const data: Omit<RecurringExpense, "id" | "cancelledMonths"> = {
      title: form.title.trim(),
      amount,
      days: form.schedulingType === "monthly" ? form.days : [],
      category,
      metodoPago: form.metodoPago,
      schedulingType: form.schedulingType,
      ...(form.metodoPago === "credito" ? { creditCardId: form.creditCardId } : {}),
      ...(form.schedulingType === "interval" ? {
        startDate: form.startDate,
        ...(form.intervalUnit === "days" ? { intervalDays: intervalValue } : { intervalMonths: intervalValue }),
        ...(form.expirationDate ? { expirationDate: form.expirationDate } : {}),
      } : {}),
      ...(totalInstallments ? { totalInstallments, paidInstallments: Number(form.paidInstallments) || 0 } : {}),
    };

    if (editId) updateRecurringExpense(editId, data);
    else {
      addRecurringExpense(data);
      if (form.schedulingType === "monthly") {
        for (const day of form.days) {
          addExpenseFromModal({ mes: selectedMes, gastos: form.title.trim(), monto: amount, metodoPago: form.metodoPago, frecuencia: "mes", fecha: day, fechaMaxima: "", estado: "no pagado", ...(form.creditCardId ? { creditCardId: form.creditCardId } : {}) });
        }
      }
    }
    setShowForm(false);
    setEditId(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {!showForm && <Button variant="ghost" size="sm" onClick={() => { setEditId(null); setForm(blankRecurring()); setShowForm(true); }}>+ Agregar</Button>}
      {showForm && (
        <Card className="border-primary">
          <div className="flex flex-col gap-3">
            <TextField label="Nombre" value={form.title} onChange={(event) => patch({ title: event.target.value })} />
            <TextField label="Monto" type="number" value={form.amount} onChange={(event) => patch({ amount: event.target.value })} />
            <ChipRow
              options={[{ label: "Días del mes", value: "monthly" }, { label: "Por intervalo", value: "interval" }]}
              value={form.schedulingType}
              onChange={(value) => patch({ schedulingType: value as RecurringSchedulingType })}
            />
            {form.schedulingType === "monthly" ? (
              <div className="flex flex-col gap-2">
                <Dropdown value="" placeholder="Agregar día" options={DAY_OPTIONS.filter((day) => !form.days.includes(Number(day.value)))} onChange={(value) => patch({ days: [...form.days, Number(value)].sort((a, b) => a - b) })} />
                <div className="flex flex-wrap gap-2">
                  {form.days.map((day) => <Chip key={day} label={`${day} ×`} selected onClick={() => patch({ days: form.days.filter((item) => item !== day) })} />)}
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <ChipRow options={[{ label: "Cada N días", value: "days" }, { label: "Cada N meses", value: "months" }]} value={form.intervalUnit} onChange={(value) => patch({ intervalUnit: value as IntervalUnit })} />
                <TextField label="Intervalo" type="number" value={form.intervalValue} onChange={(event) => patch({ intervalValue: event.target.value })} />
                <TextField label="Inicio" type="date" value={form.startDate} onChange={(event) => patch({ startDate: event.target.value })} />
                <TextField label="Expira" type="date" value={form.expirationDate} onChange={(event) => patch({ expirationDate: event.target.value })} />
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <ChipRow options={[{ label: "Efectivo", value: "efectivo" }, { label: "Crédito", value: "credito" }]} value={form.metodoPago} onChange={(value) => patch({ metodoPago: value as "efectivo" | "credito", creditCardId: value === "efectivo" ? "" : form.creditCardId || creditCards[0]?.id || "" })} />
              {form.metodoPago === "credito" && <Dropdown value={form.creditCardId} options={cardOptions} onChange={(value) => patch({ creditCardId: value })} />}
              <TextField label="Total cuotas opcional" type="number" value={form.totalInstallments} onChange={(event) => patch({ totalInstallments: event.target.value })} />
              <TextField label="Cuotas pagadas" type="number" value={form.paidInstallments} onChange={(event) => patch({ paidInstallments: event.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button size="sm" onClick={save}>Guardar</Button>
            </div>
          </div>
        </Card>
      )}
      {items.length === 0 && !showForm && <Card className="text-center text-sm text-gray-500">Sin {category === "basico" ? "básicos" : "servicios"} registrados.</Card>}
      {items.map((item) => {
        const cancelled = item.cancelledMonths.includes(selectedMes);
        const completed = item.totalInstallments !== undefined && (item.paidInstallments ?? 0) >= item.totalInstallments;
        return (
          <Card key={item.id} className={cancelled || completed ? "opacity-60" : ""}>
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`font-bold text-gray-900 ${cancelled || completed ? "line-through" : ""}`}>{item.title}</p>
                  <p className="text-sm text-gray-500">{scheduleLabel(item)} · {item.metodoPago}</p>
                  {item.totalInstallments !== undefined && <p className="text-xs text-gray-500">{item.paidInstallments ?? 0}/{item.totalInstallments} cuotas</p>}
                </div>
                <p className="font-bold text-primary">${formatMXN(item.amount)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!completed && <Button variant="ghost" size="sm" onClick={() => toggleCancelMonth(item.id, selectedMes)}>{cancelled ? "Activar" : "Cancelar mes"}</Button>}
                <Button variant="ghost" size="sm" onClick={() => startEdit(item)}>Editar</Button>
                <Button variant="danger" size="sm" onClick={() => removeRecurringExpense(item.id)}>Eliminar</Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function AgendadosList() {
  const { scheduledExpenses, addScheduledExpense, updateScheduledExpense, removeScheduledExpense } = usePlanningStore();
  const { addExpenseFromModal } = useExpensesStore();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", amount: "", amountKnown: true, scheduledDate: "", category: "other" as ScheduledExpenseCategory, notes: "" });
  const pending = scheduledExpenses.filter((item) => item.status === "pending");
  const done = scheduledExpenses.filter((item) => item.status !== "pending");

  function save() {
    if (!form.title.trim() || !form.scheduledDate) return;
    const amount = Number(form.amount) || 0;
    const payload: Omit<ScheduledExpense, "id"> = { title: form.title.trim(), scheduledDate: form.scheduledDate, category: form.category, amountKnown: form.amountKnown, amount, notes: form.notes, status: "pending" };
    if (editId) updateScheduledExpense(editId, payload);
    else {
      addScheduledExpense(payload);
      if (form.amountKnown && amount > 0) addExpenseFromModal({ mes: MESES_LIST[new Date(`${form.scheduledDate}T12:00:00`).getMonth()] ?? currentMonthName(), gastos: form.title.trim(), monto: amount, metodoPago: "efectivo", frecuencia: "unico", fecha: new Date(`${form.scheduledDate}T12:00:00`).getDate(), fechaMaxima: "", estado: "no pagado" });
    }
    setShowForm(false);
    setEditId(null);
  }

  return (
    <SimpleList
      showForm={showForm}
      setShowForm={setShowForm}
      empty="Sin gastos agendados."
      form={<>
        <TextField label="Descripción" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        <TextField label="Fecha" type="date" value={form.scheduledDate} onChange={(event) => setForm({ ...form, scheduledDate: event.target.value })} />
        <Dropdown label="Categoría" value={form.category} options={CATEGORY_OPTIONS} onChange={(value) => setForm({ ...form, category: value as ScheduledExpenseCategory })} />
        <ChipRow options={[{ label: "Monto conocido", value: "yes" }, { label: "Por definir", value: "no" }]} value={form.amountKnown ? "yes" : "no"} onChange={(value) => setForm({ ...form, amountKnown: value === "yes" })} />
        {form.amountKnown && <TextField label="Monto" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />}
        <TextField label="Notas" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
        <Actions onCancel={() => setShowForm(false)} onSave={save} />
      </>}
    >
      {pending.map((item) => <ScheduledCard key={item.id} item={item} onEdit={() => { setEditId(item.id); setForm({ title: item.title, amount: String(item.amount), amountKnown: item.amountKnown, scheduledDate: item.scheduledDate, category: item.category, notes: item.notes }); setShowForm(true); }} onDone={() => updateScheduledExpense(item.id, { status: "done" })} onRemove={() => removeScheduledExpense(item.id)} />)}
      {done.length > 0 && <p className="text-xs font-semibold uppercase text-gray-500">Completados / Cancelados</p>}
      {done.map((item) => <ScheduledCard key={item.id} item={item} done onDone={() => updateScheduledExpense(item.id, { status: "pending" })} onRemove={() => removeScheduledExpense(item.id)} />)}
    </SimpleList>
  );
}

function PagosMesesTab() {
  const { installmentPayments, addInstallment, updateInstallment, removeInstallment } = usePlanningStore();
  const { addExpenseFromModal, creditCards } = useExpensesStore();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", monthlyAmount: "", totalMonths: "", paidMonths: "0", notes: "", creditCardId: "" });
  const active = installmentPayments.filter((item) => item.status === "active");
  const completed = installmentPayments.filter((item) => item.status === "completed");

  function save() {
    const monthlyAmount = Number(form.monthlyAmount) || 0;
    const totalMonths = Number(form.totalMonths) || 0;
    const paidMonths = Math.min(Number(form.paidMonths) || 0, totalMonths);
    if (!form.title.trim() || monthlyAmount <= 0 || totalMonths <= 0) return;
    const payload: Omit<InstallmentPayment, "id"> = { title: form.title.trim(), monthlyAmount, totalMonths, paidMonths, notes: form.notes, status: paidMonths >= totalMonths ? "completed" : "active", ...(form.creditCardId ? { creditCardId: form.creditCardId } : {}) };
    if (editId) updateInstallment(editId, payload);
    else addInstallment(payload);
    setShowForm(false);
    setEditId(null);
  }

  function payMonth(item: InstallmentPayment) {
    const paidMonths = item.paidMonths + 1;
    updateInstallment(item.id, { paidMonths, status: paidMonths >= item.totalMonths ? "completed" : "active" });
    addExpenseFromModal({ mes: currentMonthName(), gastos: item.title, monto: item.monthlyAmount, metodoPago: item.creditCardId ? "credito" : "efectivo", frecuencia: "mes", fecha: new Date().getDate(), fechaMaxima: "", estado: "pagado", ...(item.creditCardId ? { creditCardId: item.creditCardId } : {}) });
  }

  return (
    <SimpleList
      showForm={showForm}
      setShowForm={setShowForm}
      empty="Sin pagos a meses registrados."
      form={<>
        <TextField label="Nombre" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        <div className="grid gap-3 sm:grid-cols-3">
          <TextField label="Mensualidad" type="number" value={form.monthlyAmount} onChange={(event) => setForm({ ...form, monthlyAmount: event.target.value })} />
          <TextField label="Total meses" type="number" value={form.totalMonths} onChange={(event) => setForm({ ...form, totalMonths: event.target.value })} />
          <TextField label="Ya pagados" type="number" value={form.paidMonths} onChange={(event) => setForm({ ...form, paidMonths: event.target.value })} />
        </div>
        <TextField label="Notas" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
        {creditCards.length > 0 && <Dropdown label="Tarjeta" value={form.creditCardId} options={[{ label: "Sin tarjeta", value: "" }, ...creditCards.map((card) => ({ label: card.name, value: card.id }))]} onChange={(value) => setForm({ ...form, creditCardId: value })} />}
        <Actions onCancel={() => setShowForm(false)} onSave={save} />
      </>}
    >
      {active.map((item) => <InstallmentCard key={item.id} item={item} onPay={() => payMonth(item)} onEdit={() => { setEditId(item.id); setForm({ title: item.title, monthlyAmount: String(item.monthlyAmount), totalMonths: String(item.totalMonths), paidMonths: String(item.paidMonths), notes: item.notes, creditCardId: item.creditCardId ?? "" }); setShowForm(true); }} onRemove={() => removeInstallment(item.id)} />)}
      {completed.length > 0 && <p className="text-xs font-semibold uppercase text-gray-500">Terminados</p>}
      {completed.map((item) => <InstallmentCard key={item.id} item={item} done onRemove={() => removeInstallment(item.id)} />)}
    </SimpleList>
  );
}

function SimulacionTab() {
  const { recurringExpenses } = useExpensesStore();
  const { installmentPayments } = usePlanningStore();
  const [simType, setSimType] = useState<"meses" | "unico">("meses");
  const [form, setForm] = useState({ description: "", totalAmount: "", months: "" });
  const total = Number(form.totalAmount) || 0;
  const months = Number(form.months) || 0;
  const monthly = simType === "meses" && months > 0 ? total / months : total;
  const current = recurringExpenses.reduce((sum, item) => sum + item.amount, 0) + installmentPayments.filter((item) => item.status === "active").reduce((sum, item) => sum + item.monthlyAmount, 0);

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-900">¿Qué quieres simular?</p>
          <ChipRow options={[{ label: "A meses", value: "meses" }, { label: "Pago único", value: "unico" }]} value={simType} onChange={(value) => setSimType(value as "meses" | "unico")} />
          <TextField label="Compra" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <TextField label={simType === "meses" ? "Precio total" : "Monto"} type="number" value={form.totalAmount} onChange={(event) => setForm({ ...form, totalAmount: event.target.value })} />
          {simType === "meses" && <TextField label="Número de meses" type="number" value={form.months} onChange={(event) => setForm({ ...form, months: event.target.value })} />}
          <Button variant="ghost" size="sm" onClick={() => setForm({ description: "", totalAmount: "", months: "" })}>Limpiar</Button>
        </div>
      </Card>
      {total > 0 && (simType === "unico" || months > 0) && (
        <Card>
          <div className="flex flex-col gap-2 text-sm">
            <InfoRow label={form.description || "Compra simulada"} value={simType === "meses" ? `$${formatMXN(monthly)}/mes` : `$${formatMXN(total)}`} strong />
            <InfoRow label="Gastos fijos actuales" value={`$${formatMXN(current)}/mes`} />
            <InfoRow label="Con esta compra" value={`$${formatMXN(current + monthly)}${simType === "meses" ? "/mes" : ""}`} strong />
          </div>
        </Card>
      )}
    </div>
  );
}

function SimpleList({ showForm, setShowForm, form, empty, children }: { showForm: boolean; setShowForm: (value: boolean) => void; form: React.ReactNode; empty: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.some(Boolean) : Boolean(children);
  return (
    <div className="flex flex-col gap-3">
      {showForm ? <Card className="border-primary"><div className="flex flex-col gap-3">{form}</div></Card> : <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>+ Agregar</Button>}
      {!hasChildren && !showForm ? <Card className="text-center text-sm text-gray-500">{empty}</Card> : children}
    </div>
  );
}

function ScheduledCard({ item, done, onEdit, onDone, onRemove }: { item: ScheduledExpense; done?: boolean; onEdit?: () => void; onDone: () => void; onRemove: () => void }) {
  return (
    <Card className={done ? "opacity-60" : ""}>
      <div className="flex flex-col gap-3">
        <InfoRow label={`${item.title} · ${item.scheduledDate}`} value={item.amountKnown ? `$${formatMXN(item.amount)}` : "Por definir"} strong={!done} />
        {item.notes && <p className="text-sm text-gray-500">{item.notes}</p>}
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={onDone}>{done ? "Reactivar" : "Marcar hecho"}</Button>
          {onEdit && <Button variant="ghost" size="sm" onClick={onEdit}>Editar</Button>}
          <Button variant="danger" size="sm" onClick={onRemove}>Eliminar</Button>
        </div>
      </div>
    </Card>
  );
}

function InstallmentCard({ item, done, onPay, onEdit, onRemove }: { item: InstallmentPayment; done?: boolean; onPay?: () => void; onEdit?: () => void; onRemove: () => void }) {
  const pct = item.totalMonths > 0 ? Math.round((item.paidMonths / item.totalMonths) * 100) : 0;
  return (
    <Card className={done ? "opacity-60" : ""}>
      <div className="flex flex-col gap-3">
        <InfoRow label={`${item.title} · ${item.paidMonths}/${item.totalMonths} meses`} value={`$${formatMXN(item.monthlyAmount)}/mes`} strong={!done} />
        <div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
        {item.notes && <p className="text-sm text-gray-500">{item.notes}</p>}
        <div className="flex flex-wrap gap-2">
          {onPay && <Button variant="ghost" size="sm" onClick={onPay}>Pagar mes</Button>}
          {onEdit && <Button variant="ghost" size="sm" onClick={onEdit}>Editar</Button>}
          <Button variant="danger" size="sm" onClick={onRemove}>Eliminar</Button>
        </div>
      </div>
    </Card>
  );
}

function Actions({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return <div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button><Button size="sm" onClick={onSave}>Guardar</Button></div>;
}

function ChipRow({ options, value, onChange }: { options: { label: string; value: string }[]; value: string; onChange: (value: string) => void }) {
  return <div className="flex flex-wrap gap-2">{options.map((option) => <Chip key={option.value} label={option.label} selected={value === option.value} onClick={() => onChange(option.value)} />)}</div>;
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return <button type="button" className={`rounded-full border px-3 py-1 text-xs ${selected ? "border-primary bg-blue-50 text-primary" : "border-gray-200 text-gray-700"}`} onClick={onClick}>{label}</button>;
}

function InfoRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="flex items-center justify-between gap-3"><span className={`${strong ? "font-semibold text-gray-900" : "text-gray-500"}`}>{label}</span><span className={`${strong ? "font-bold text-primary" : "text-gray-700"}`}>{value}</span></div>;
}

function scheduleLabel(item: RecurringExpense) {
  if (item.schedulingType === "interval") {
    if (item.intervalDays) return `Cada ${item.intervalDays} días desde ${item.startDate}`;
    if (item.intervalMonths) return `Cada ${item.intervalMonths} meses desde ${item.startDate}`;
    return "Por intervalo";
  }
  return item.days.length === 1 ? `Día ${item.days[0]}` : `Días ${[...item.days].sort((a, b) => a - b).join(", ")}`;
}
