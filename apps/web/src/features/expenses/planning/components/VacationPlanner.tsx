import { useState, type ReactNode } from "react";
import { Badge, Button, Card, ChipGroup, Modal, TextField } from "@/shared/ui";
import { useExpensesStore } from "@/features/expenses/store";
import { currentMonthName, formatMXN, MESES_LIST, randomId } from "@/features/expenses/helpers";
import { usePlanningStore } from "../store";
import type { VacationPayment, VacationPlan, VacationStatus, VacationTask } from "../types";

const STATUS_LABELS: Record<VacationStatus, string> = {
  planning: "Planeando",
  confirmed: "Confirmado",
  completed: "Completado",
  cancelled: "Cancelado",
};
const STATUS_COLOR: Record<VacationStatus, "blue" | "green" | "gray" | "red"> = {
  planning: "blue",
  confirmed: "green",
  completed: "gray",
  cancelled: "red",
};
const STATUSES = Object.keys(STATUS_LABELS) as VacationStatus[];

type PlanFormState = {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  notes: string;
  status: VacationStatus;
  persons: string[];
  tasks: VacationTask[];
  payments: VacationPayment[];
  newPerson: string;
  newTask: string;
  newPaymentDescription: string;
  newPaymentAmount: string;
  newPaymentPerPerson: boolean;
  newPaymentTrackInGastos: boolean;
};

type DayFormState = { date: string; activity: string; estimatedCost: string };

const blankPlanForm = (): PlanFormState => ({
  name: "",
  destination: "",
  startDate: "",
  endDate: "",
  notes: "",
  status: "planning",
  persons: [],
  tasks: [],
  payments: [],
  newPerson: "",
  newTask: "",
  newPaymentDescription: "",
  newPaymentAmount: "",
  newPaymentPerPerson: false,
  newPaymentTrackInGastos: true,
});
const blankDayForm = (): DayFormState => ({ date: "", activity: "", estimatedCost: "" });

function calcPaymentTotal(payments: VacationPayment[], personCount: number) {
  return payments.filter((payment) => !payment.done).reduce((sum, payment) => sum + payment.amount * (payment.perPerson ? Math.max(personCount, 1) : 1), 0);
}

export function VacationPlanner() {
  const { vacations, addVacation, updateVacation, removeVacation, addVacationDay, removeVacationDay } = usePlanningStore();
  const { addExpenseFromModal } = useExpensesStore();
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<PlanFormState>(blankPlanForm());
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [dayTargetVacationId, setDayTargetVacationId] = useState<string | null>(null);
  const [dayForm, setDayForm] = useState<DayFormState>(blankDayForm());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalBudget = vacations.filter((item) => item.status !== "cancelled").reduce((sum, item) => sum + item.payments.reduce((s, payment) => s + payment.amount * (payment.perPerson ? Math.max(item.persons.length, 1) : 1), 0), 0);
  const totalPending = vacations.filter((item) => item.status !== "cancelled").reduce((sum, item) => sum + calcPaymentTotal(item.payments, item.persons.length), 0);

  function openAddPlan() {
    setEditingPlanId(null);
    setPlanForm(blankPlanForm());
    setPlanModalOpen(true);
  }

  function openEditPlan(plan: VacationPlan) {
    setEditingPlanId(plan.id);
    setPlanForm({
      name: plan.name,
      destination: plan.destination,
      startDate: plan.startDate,
      endDate: plan.endDate,
      notes: plan.notes,
      status: plan.status,
      persons: plan.persons,
      tasks: plan.tasks,
      payments: plan.payments,
      newPerson: "",
      newTask: "",
      newPaymentDescription: "",
      newPaymentAmount: "",
      newPaymentPerPerson: false,
      newPaymentTrackInGastos: true,
    });
    setPlanModalOpen(true);
  }

  function handleSavePlan() {
    if (!planForm.name.trim()) return;
    const payload: Omit<VacationPlan, "id" | "days"> = {
      name: planForm.name.trim(),
      destination: planForm.destination.trim(),
      startDate: planForm.startDate,
      endDate: planForm.endDate,
      notes: planForm.notes.trim(),
      status: planForm.status,
      persons: planForm.persons,
      tasks: planForm.tasks,
      payments: planForm.payments,
    };
    const prevStatus = editingPlanId ? vacations.find((item) => item.id === editingPlanId)?.status : undefined;
    if (editingPlanId) updateVacation(editingPlanId, payload);
    else addVacation(payload);
    if (planForm.status === "confirmed" && prevStatus !== "confirmed") pushDonePaymentsToGastos(planForm, addExpenseFromModal);
    setPlanModalOpen(false);
  }

  function handleSaveDay() {
    if (!dayTargetVacationId || !dayForm.activity.trim()) return;
    addVacationDay(dayTargetVacationId, { date: dayForm.date, activity: dayForm.activity.trim(), estimatedCost: Number(dayForm.estimatedCost) || 0 });
    setDayModalOpen(false);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Summary value={String(vacations.length)} label="Viajes" />
        <Summary value={`$${formatMXN(totalBudget)}`} label="Presupuesto" />
        <Summary value={`$${formatMXN(totalPending)}`} label="Por pagar" />
      </div>

      <Button size="sm" onClick={openAddPlan}>Agregar viaje</Button>

      {vacations.length === 0 ? (
        <Card className="border-dashed text-center">
          <p className="font-semibold text-gray-700">No hay viajes planeados</p>
          <p className="text-sm text-gray-400">Agrega tus próximas vacaciones y lleva el control de tareas y pagos</p>
        </Card>
      ) : (
        vacations.map((plan) => {
          const isExpanded = expandedId === plan.id;
          const personCount = plan.persons.length;
          const pending = calcPaymentTotal(plan.payments, personCount);
          const paid = plan.payments.filter((payment) => payment.done).reduce((sum, payment) => sum + payment.amount * (payment.perPerson ? Math.max(personCount, 1) : 1), 0);
          const tasksDone = plan.tasks.filter((task) => task.done).length;
          return (
            <Card key={plan.id}>
              <div className="flex flex-col gap-3">
                <button type="button" className="flex items-start justify-between gap-3 text-left" onClick={() => setExpandedId(isExpanded ? null : plan.id)}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-bold text-gray-900">{plan.name}</p>
                      <Badge color={STATUS_COLOR[plan.status]}>{STATUS_LABELS[plan.status]}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      {plan.destination ? plan.destination : "Sin destino"}
                      {plan.startDate && plan.endDate ? ` · ${plan.startDate} → ${plan.endDate}${calcDays(plan.startDate, plan.endDate) ? ` (${calcDays(plan.startDate, plan.endDate)} días)` : ""}` : ""}
                      {personCount > 0 ? ` · ${personCount} persona${personCount !== 1 ? "s" : ""}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-gray-500">
                    {pending > 0 && <p className="font-bold text-gray-900">${formatMXN(pending)}</p>}
                    {plan.tasks.length > 0 && <p>{tasksDone}/{plan.tasks.length}</p>}
                    <p>{isExpanded ? "Ocultar" : "Ver"}</p>
                  </div>
                </button>

                {isExpanded && (
                  <div className="flex flex-col gap-4 border-t border-gray-100 pt-3">
                    {plan.notes && <p className="text-sm italic text-gray-500">{plan.notes}</p>}
                    {personCount > 0 && <Tags title={`Personas (${personCount})`} values={plan.persons} />}
                    {plan.tasks.length > 0 && (
                      <Section title={`Por hacer ${tasksDone}/${plan.tasks.length}`}>
                        {plan.tasks.map((task) => (
                          <CheckRow key={task.id} checked={task.done} label={task.task} onClick={() => updateVacation(plan.id, { tasks: plan.tasks.map((item) => item.id === task.id ? { ...item, done: !item.done } : item) })} />
                        ))}
                      </Section>
                    )}
                    {plan.payments.length > 0 && (
                      <Section title={`Por pagar · pagado $${formatMXN(paid)}`}>
                        {plan.payments.map((payment) => {
                          const total = payment.amount * (payment.perPerson ? Math.max(personCount, 1) : 1);
                          return (
                            <CheckRow
                              key={payment.id}
                              checked={payment.done}
                              label={`${payment.description}${payment.perPerson ? ` · $${formatMXN(payment.amount)} × ${personCount}` : ""}${payment.trackInGastos === false ? " · solo plan" : ""}`}
                              value={`$${formatMXN(total)}`}
                              onClick={() => {
                                const markingDone = !payment.done;
                                updateVacation(plan.id, { payments: plan.payments.map((item) => item.id === payment.id ? { ...item, done: !item.done } : item) });
                                if (markingDone && plan.status === "confirmed" && payment.trackInGastos !== false) pushPaymentToGastos(plan, payment, addExpenseFromModal);
                              }}
                            />
                          );
                        })}
                        <InfoRow label="Pendiente" value={`$${formatMXN(pending)}`} strong />
                      </Section>
                    )}
                    <Section title="Actividades del viaje">
                      <Button variant="ghost" size="sm" onClick={() => { setDayTargetVacationId(plan.id); setDayForm(blankDayForm()); setDayModalOpen(true); }}>Día</Button>
                      {plan.days.length === 0 ? <p className="text-sm text-gray-400">Sin actividades.</p> : plan.days.map((day) => (
                        <div key={day.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-gray-100 py-2 text-sm">
                          <div>
                            <p className="font-medium text-gray-900">{day.activity}</p>
                            {day.date && <p className="text-xs text-gray-500">{day.date}</p>}
                          </div>
                          {day.estimatedCost > 0 && <p className="font-semibold text-gray-900">${formatMXN(day.estimatedCost)}</p>}
                          <Button variant="ghost" size="sm" onClick={() => removeVacationDay(plan.id, day.id)}>Eliminar</Button>
                        </div>
                      ))}
                    </Section>
                    <div className="flex justify-end"><Button variant="secondary" size="sm" onClick={() => openEditPlan(plan)}>Editar viaje</Button></div>
                  </div>
                )}
              </div>
            </Card>
          );
        })
      )}

      <Modal
        open={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        title={editingPlanId ? "Editar viaje" : "Nuevo viaje"}
        footer={
          <div className="flex w-full justify-between gap-3">
            <div>{editingPlanId && <Button variant="danger" size="sm" onClick={() => { removeVacation(editingPlanId); setPlanModalOpen(false); }}>Eliminar</Button>}</div>
            <div className="flex gap-2"><Button variant="ghost" size="sm" onClick={() => setPlanModalOpen(false)}>Cancelar</Button><Button size="sm" onClick={handleSavePlan}>{editingPlanId ? "Guardar" : "Agregar"}</Button></div>
          </div>
        }
      >
        <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1">
          <TextField label="Nombre del viaje *" value={planForm.name} onChange={(event) => setPlanForm({ ...planForm, name: event.target.value })} placeholder="Ej: Cancún 2025" />
          <TextField label="Destino" value={planForm.destination} onChange={(event) => setPlanForm({ ...planForm, destination: event.target.value })} placeholder="Ciudad o país" />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Fecha inicio" type="date" value={planForm.startDate} onChange={(event) => setPlanForm({ ...planForm, startDate: event.target.value })} />
            <TextField label="Fecha fin" type="date" value={planForm.endDate} onChange={(event) => setPlanForm({ ...planForm, endDate: event.target.value })} />
          </div>
          <Field label="Estado"><ChipGroup options={STATUSES.map((status) => ({ label: STATUS_LABELS[status], value: status }))} value={planForm.status} onChange={(value) => setPlanForm({ ...planForm, status: value })} /></Field>
          <FormList title="Personas" value={planForm.newPerson} placeholder="Nombre" onValue={(value) => setPlanForm({ ...planForm, newPerson: value })} onAdd={() => addPerson(planForm, setPlanForm)}>
            {planForm.persons.map((person) => <Tag key={person} onRemove={() => setPlanForm({ ...planForm, persons: planForm.persons.filter((item) => item !== person) })}>{person}</Tag>)}
          </FormList>
          <FormList title="Por hacer" value={planForm.newTask} placeholder="Ej: Reservar hotel" onValue={(value) => setPlanForm({ ...planForm, newTask: value })} onAdd={() => addTask(planForm, setPlanForm)}>
            {planForm.tasks.map((task) => <EditCheckRow key={task.id} checked={task.done} label={task.task} onToggle={() => setPlanForm({ ...planForm, tasks: planForm.tasks.map((item) => item.id === task.id ? { ...item, done: !item.done } : item) })} onRemove={() => setPlanForm({ ...planForm, tasks: planForm.tasks.filter((item) => item.id !== task.id) })} />)}
          </FormList>
          <Field label="Por pagar">
            <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
              <TextField value={planForm.newPaymentDescription} onChange={(event) => setPlanForm({ ...planForm, newPaymentDescription: event.target.value })} placeholder="Ej: Boletos de avión" />
              <TextField type="number" value={planForm.newPaymentAmount} onChange={(event) => setPlanForm({ ...planForm, newPaymentAmount: event.target.value })} placeholder="$0" />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip selected={planForm.newPaymentPerPerson} onClick={() => setPlanForm({ ...planForm, newPaymentPerPerson: !planForm.newPaymentPerPerson })}>Por persona</Chip>
              <Chip selected={planForm.newPaymentTrackInGastos} onClick={() => setPlanForm({ ...planForm, newPaymentTrackInGastos: !planForm.newPaymentTrackInGastos })}>{planForm.newPaymentTrackInGastos ? "En gastos" : "Solo planeación"}</Chip>
              <Button variant="ghost" size="sm" onClick={() => addPayment(planForm, setPlanForm)}>Agregar</Button>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {planForm.payments.map((payment) => <EditCheckRow key={payment.id} checked={payment.done} label={`${payment.description} · $${formatMXN(payment.amount)}`} onToggle={() => setPlanForm({ ...planForm, payments: planForm.payments.map((item) => item.id === payment.id ? { ...item, done: !item.done } : item) })} onRemove={() => setPlanForm({ ...planForm, payments: planForm.payments.filter((item) => item.id !== payment.id) })} />)}
            </div>
          </Field>
          <TextField label="Notas" value={planForm.notes} onChange={(event) => setPlanForm({ ...planForm, notes: event.target.value })} placeholder="Notas, ideas, requisitos..." />
        </div>
      </Modal>

      <Modal
        open={dayModalOpen}
        onClose={() => setDayModalOpen(false)}
        title="Agregar actividad"
        footer={<><Button variant="ghost" size="sm" onClick={() => setDayModalOpen(false)}>Cancelar</Button><Button size="sm" onClick={handleSaveDay}>Agregar</Button></>}
      >
        <div className="flex flex-col gap-4">
          <TextField label="Actividad *" value={dayForm.activity} onChange={(event) => setDayForm({ ...dayForm, activity: event.target.value })} />
          <TextField label="Fecha" type="date" value={dayForm.date} onChange={(event) => setDayForm({ ...dayForm, date: event.target.value })} />
          <TextField label="Costo estimado ($)" type="number" value={dayForm.estimatedCost} onChange={(event) => setDayForm({ ...dayForm, estimatedCost: event.target.value })} />
        </div>
      </Modal>
    </div>
  );
}

function pushDonePaymentsToGastos(form: PlanFormState, addExpenseFromModal: ReturnType<typeof useExpensesStore.getState>["addExpenseFromModal"]) {
  for (const payment of form.payments) {
    if (payment.done && payment.trackInGastos !== false) pushPaymentToGastos({ startDate: form.startDate, persons: form.persons } as VacationPlan, payment, addExpenseFromModal);
  }
}

function pushPaymentToGastos(plan: VacationPlan, payment: VacationPayment, addExpenseFromModal: ReturnType<typeof useExpensesStore.getState>["addExpenseFromModal"]) {
  const date = plan.startDate ? new Date(`${plan.startDate}T12:00:00`) : new Date();
  addExpenseFromModal({
    mes: MESES_LIST[date.getMonth()] ?? currentMonthName(),
    gastos: payment.description,
    monto: payment.amount * (payment.perPerson ? Math.max(plan.persons.length, 1) : 1),
    metodoPago: "efectivo",
    frecuencia: "unico",
    fecha: date.getDate(),
    fechaMaxima: "",
    estado: "pagado",
  });
}

function addPerson(form: PlanFormState, setForm: (form: PlanFormState) => void) {
  const person = form.newPerson.trim();
  if (!person || form.persons.includes(person)) return;
  setForm({ ...form, persons: [...form.persons, person], newPerson: "" });
}

function addTask(form: PlanFormState, setForm: (form: PlanFormState) => void) {
  const task = form.newTask.trim();
  if (!task) return;
  setForm({ ...form, tasks: [...form.tasks, { id: randomId(), task, done: false }], newTask: "" });
}

function addPayment(form: PlanFormState, setForm: (form: PlanFormState) => void) {
  const description = form.newPaymentDescription.trim();
  if (!description) return;
  setForm({
    ...form,
    payments: [...form.payments, { id: randomId(), description, amount: Number(form.newPaymentAmount) || 0, perPerson: form.newPaymentPerPerson, done: false, trackInGastos: form.newPaymentTrackInGastos }],
    newPaymentDescription: "",
    newPaymentAmount: "",
    newPaymentPerPerson: false,
    newPaymentTrackInGastos: true,
  });
}

function calcDays(start: string, end: string) {
  const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
  return Number.isFinite(diff) && diff > 0 ? diff : null;
}

function Summary({ value, label }: { value: string; label: string }) {
  return <Card className="text-center"><p className="font-bold text-gray-900">{value}</p><p className="text-xs text-gray-500">{label}</p></Card>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="flex flex-col gap-2"><h3 className="text-sm font-semibold text-gray-900">{title}</h3>{children}</section>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="flex flex-col gap-2"><span className="text-sm font-medium text-gray-700">{label}</span>{children}</div>;
}

function InfoRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="flex justify-between gap-2 text-sm"><span className="text-gray-600">{label}</span><span className={strong ? "font-bold text-gray-900" : "font-medium text-gray-900"}>{value}</span></div>;
}

function Tags({ title, values }: { title: string; values: string[] }) {
  return <Section title={title}><div className="flex flex-wrap gap-2">{values.map((value) => <span key={value} className="rounded-full border border-gray-200 px-2 py-1 text-xs text-gray-700">{value}</span>)}</div></Section>;
}

function CheckRow({ checked, label, value, onClick }: { checked: boolean; label: string; value?: string; onClick: () => void }) {
  return (
    <button type="button" className="grid grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-gray-100 py-2 text-left text-sm" onClick={onClick}>
      <span className={`flex h-5 w-5 items-center justify-center rounded border ${checked ? "border-primary bg-primary text-white" : "border-gray-300"}`}>{checked ? "✓" : ""}</span>
      <span className={checked ? "text-gray-400 line-through" : "text-gray-900"}>{label}</span>
      {value && <span className={checked ? "text-gray-400" : "font-semibold text-gray-900"}>{value}</span>}
    </button>
  );
}

function EditCheckRow({ checked, label, onToggle, onRemove }: { checked: boolean; label: string; onToggle: () => void; onRemove: () => void }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-sm">
      <button type="button" className={`flex h-5 w-5 items-center justify-center rounded border ${checked ? "border-primary bg-primary text-white" : "border-gray-300"}`} onClick={onToggle}>{checked ? "✓" : ""}</button>
      <span className={checked ? "text-gray-400 line-through" : "text-gray-900"}>{label}</span>
      <Button variant="ghost" size="sm" onClick={onRemove}>Eliminar</Button>
    </div>
  );
}

function FormList({ title, value, placeholder, onValue, onAdd, children }: { title: string; value: string; placeholder: string; onValue: (value: string) => void; onAdd: () => void; children: ReactNode }) {
  return (
    <Field label={title}>
      <div className="flex gap-2"><TextField value={value} onChange={(event) => onValue(event.target.value)} placeholder={placeholder} /><Button variant="ghost" size="sm" onClick={onAdd}>Agregar</Button></div>
      <div className="flex flex-col gap-2">{children}</div>
    </Field>
  );
}

function Tag({ children, onRemove }: { children: ReactNode; onRemove: () => void }) {
  return <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-2 py-1 text-xs text-gray-700">{children}<button type="button" onClick={onRemove}>Eliminar</button></span>;
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" className={`rounded-full border px-3 py-1 text-xs ${selected ? "border-primary bg-blue-50 text-primary" : "border-gray-200 text-gray-700"}`} onClick={onClick}>{children}</button>;
}
