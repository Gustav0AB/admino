import { useState, type ReactNode } from "react";
import { Button, Card, TextField } from "@/shared/ui";
import { useExpensesStore } from "../store";
import { formatMXN } from "../helpers";
import type { SavingsGoal } from "../types";

const GOAL_COLORS = ["#6366F1", "#EC4899", "#F59E0B", "#16A34A", "#3B82F6", "#14B8A6", "#EF4444", "#8B5CF6"];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

type GoalForm = {
  title: string;
  targetAmount: string;
  deadline: string;
  notes: string;
  color: string;
};

const blankForm = (): GoalForm => ({ title: "", targetAmount: "", deadline: "", notes: "", color: GOAL_COLORS[0] ?? "#6366F1" });

export function SavingsTab() {
  const { savingsGoals, addSavingsGoal } = useExpensesStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<GoalForm>(blankForm());
  const active = savingsGoals.filter((goal) => goal.status === "active");
  const completed = savingsGoals.filter((goal) => goal.status === "completed");
  const totalSaved = savingsGoals.reduce((sum, goal) => sum + goal.deposits.reduce((depositSum, deposit) => depositSum + deposit.amount, 0), 0);
  const totalTarget = savingsGoals.filter((goal) => goal.status !== "cancelled").reduce((sum, goal) => sum + goal.targetAmount, 0);
  const pct = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;

  function handleAdd() {
    const target = Number(form.targetAmount) || 0;
    if (!form.title.trim() || target <= 0) return;
    addSavingsGoal({ title: form.title.trim(), targetAmount: target, deadline: form.deadline, notes: form.notes.trim(), color: form.color });
    setForm(blankForm());
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <Card className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total ahorrado</p>
        <p className="text-3xl font-extrabold text-gray-900">${formatMXN(totalSaved)}</p>
        {totalTarget > 0 && (
          <>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
            <p className="mt-1 text-xs text-gray-500">
              ${formatMXN(totalSaved)} de ${formatMXN(totalTarget)} en {savingsGoals.filter((goal) => goal.status !== "cancelled").length} meta{savingsGoals.filter((goal) => goal.status !== "cancelled").length !== 1 ? "s" : ""}
            </p>
          </>
        )}
      </Card>

      {!showForm && <Button variant="ghost" size="sm" className="add-tile" onClick={() => { setShowForm(true); setForm(blankForm()); }}>Nueva meta</Button>}

      {showForm && (
        <Card className="border-primary">
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-gray-900">Nueva meta de ahorro</h2>
            <TextField label="Nombre de la meta" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ej. Viaje, fondo de emergencia" />
            <TextField label="Monto objetivo ($)" type="number" value={form.targetAmount} onChange={(event) => setForm({ ...form, targetAmount: event.target.value })} placeholder="0.00" />
            <TextField label="Fecha límite" type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
            <TextField label="Notas" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-gray-500">Color</span>
              <div className="flex flex-wrap gap-2">
                {GOAL_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-7 w-7 rounded-full ${form.color === color ? "ring-2 ring-offset-2" : ""}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setForm({ ...form, color })}
                    aria-label={`Color ${color}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleAdd}>Agregar meta</Button>
            </div>
          </div>
        </Card>
      )}

      {active.map((goal) => <GoalCard key={goal.id} goal={goal} />)}
      {completed.length > 0 && <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Completadas</p>}
      {completed.map((goal) => <GoalCard key={goal.id} goal={goal} />)}
      {savingsGoals.length === 0 && !showForm && <Card className="border-dashed text-center text-sm text-gray-500">Sin metas de ahorro.<br />Crea una para hacer seguimiento de tu progreso.</Card>}
    </div>
  );
}

function GoalCard({ goal }: { goal: SavingsGoal }) {
  const { removeSavingsGoal, addSavingsDeposit, removeSavingsDeposit } = useExpensesStore();
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [depAmount, setDepAmount] = useState("");
  const [depNotes, setDepNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const saved = goal.deposits.reduce((sum, deposit) => sum + deposit.amount, 0);
  const remaining = Math.max(0, goal.targetAmount - saved);
  const pct = Math.min(100, goal.targetAmount > 0 ? (saved / goal.targetAmount) * 100 : 0);
  const daysLeft = goal.deadline && goal.status === "active"
    ? Math.ceil((new Date(`${goal.deadline}T12:00:00`).getTime() - new Date(`${todayStr()}T12:00:00`).getTime()) / 86400000)
    : null;

  function handleDeposit() {
    const amount = Number(depAmount);
    if (!amount || amount <= 0) return;
    addSavingsDeposit(goal.id, { amount, date: todayStr(), notes: depNotes.trim() });
    setDepAmount("");
    setDepNotes("");
    setShowDepositForm(false);
  }

  return (
    <Card className={`overflow-hidden ${goal.status === "completed" ? "opacity-60" : ""}`} padding="none">
      <div className="flex">
        <div className="w-1.5 shrink-0" style={{ backgroundColor: goal.color }} />
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-gray-900">{goal.title}</p>
              {goal.notes && <p className="text-sm italic text-gray-500">{goal.notes}</p>}
            </div>
            <div className="flex items-center gap-2">
              {goal.status === "completed" ? <span style={{ color: goal.color }} className="text-sm font-bold">Completada</span> : <span style={{ color: goal.color }} className="font-extrabold">${formatMXN(remaining)}</span>}
              {confirmRemove ? (
                <div className="flex gap-2 text-sm">
                  <button type="button" className="font-semibold text-red-600" onClick={() => removeSavingsGoal(goal.id)}>Sí</button>
                  <button type="button" className="text-gray-500" onClick={() => setConfirmRemove(false)}>No</button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(true)}>Eliminar</Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-gray-500"><span>${formatMXN(saved)} ahorrado</span><span>${formatMXN(goal.targetAmount)} meta</span></div>
            <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: `${goal.color}22` }}><div className="h-full" style={{ width: `${pct}%`, backgroundColor: goal.color }} /></div>
            <div className="flex justify-between text-xs">
              <span style={{ color: goal.color }} className="font-bold">{pct.toFixed(0)}%</span>
              {daysLeft !== null && <Deadline daysLeft={daysLeft} />}
            </div>
          </div>

          {goal.status === "active" && (
            <section className="border-t border-gray-100 pt-3">
              {showDepositForm ? (
                <div className="flex flex-col gap-3">
                  <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
                    <TextField type="number" value={depAmount} onChange={(event) => setDepAmount(event.target.value)} placeholder="Monto" autoFocus />
                    <TextField value={depNotes} onChange={(event) => setDepNotes(event.target.value)} placeholder="Nota (opcional)" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setShowDepositForm(false); setDepAmount(""); setDepNotes(""); }}>Cancelar</Button>
                    <Button size="sm" onClick={handleDeposit}>Abonar</Button>
                  </div>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setShowDepositForm(true)}>Registrar abono</Button>
              )}
            </section>
          )}

          {goal.deposits.length > 0 && (
            <HistoryToggle open={showHistory} count={goal.deposits.length} onClick={() => setShowHistory((value) => !value)}>
              {[...goal.deposits].reverse().map((deposit) => (
                <div key={deposit.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-gray-100 py-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">{deposit.date}</p>
                    {deposit.notes && <p className="text-xs text-gray-500">{deposit.notes}</p>}
                  </div>
                  <p style={{ color: goal.color }} className="font-bold">${formatMXN(deposit.amount)}</p>
                  <Button variant="ghost" size="sm" onClick={() => removeSavingsDeposit(goal.id, deposit.id)}>Eliminar</Button>
                </div>
              ))}
            </HistoryToggle>
          )}
        </div>
      </div>
    </Card>
  );
}

function Deadline({ daysLeft }: { daysLeft: number }) {
  if (daysLeft < 0) return <span className="text-red-600">Venció hace {Math.abs(daysLeft)} días</span>;
  if (daysLeft === 0) return <span className="text-gray-500">Vence hoy</span>;
  return <span className="text-gray-500">{daysLeft} días restantes</span>;
}

function HistoryToggle({ open, count, onClick, children }: { open: boolean; count: number; onClick: () => void; children: ReactNode }) {
  return (
    <>
      <button type="button" className="self-start text-xs font-semibold text-primary" onClick={onClick}>
        {open ? "Ocultar abonos" : `${count} abono${count !== 1 ? "s" : ""}`}
      </button>
      {open && <div className="flex flex-col gap-2">{children}</div>}
    </>
  );
}
