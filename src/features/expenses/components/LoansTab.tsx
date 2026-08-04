import { useState } from "react";
import { Button, Card, TextField } from "@/shared/ui";
import { useExpensesStore } from "../store";
import { formatMXN } from "../helpers";
import type { Loan } from "../types";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

type AddLoanForm = {
  title: string;
  person: string;
  direction: "borrowed" | "lent";
  originalAmount: string;
  startDate: string;
  dueDate: string;
  notes: string;
};

const blankForm = (): AddLoanForm => ({ title: "", person: "", direction: "borrowed", originalAmount: "", startDate: todayStr(), dueDate: "", notes: "" });

export function LoansTab() {
  const { loans, addLoan } = useExpensesStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddLoanForm>(blankForm());
  const borrowed = loans.filter((loan) => loan.direction === "borrowed");
  const lent = loans.filter((loan) => loan.direction === "lent");
  const totalBorrowed = borrowed.filter((loan) => loan.status === "active").reduce((sum, loan) => sum + remaining(loan), 0);
  const totalLent = lent.filter((loan) => loan.status === "active").reduce((sum, loan) => sum + remaining(loan), 0);

  function handleAdd() {
    const amount = Number(form.originalAmount) || 0;
    if (!form.title.trim() || !form.person.trim() || amount <= 0) return;
    addLoan({
      title: form.title.trim(),
      person: form.person.trim(),
      direction: form.direction,
      originalAmount: amount,
      startDate: form.startDate,
      dueDate: form.dueDate,
      notes: form.notes.trim(),
    });
    setForm(blankForm());
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryCard label="Debo" value={totalBorrowed} count={borrowed.filter((loan) => loan.status === "active").length} color="red" />
        <SummaryCard label="Me deben" value={totalLent} count={lent.filter((loan) => loan.status === "active").length} color="green" />
      </div>

      {!showForm && <Button variant="ghost" size="sm" className="add-tile" onClick={() => { setShowForm(true); setForm(blankForm()); }}>+ Nuevo préstamo</Button>}

      {showForm && (
        <Card className="border-primary">
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-gray-900">Nuevo préstamo</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              <Chip selected={form.direction === "borrowed"} color="red" onClick={() => setForm({ ...form, direction: "borrowed" })}>📤 Yo debo</Chip>
              <Chip selected={form.direction === "lent"} color="green" onClick={() => setForm({ ...form, direction: "lent" })}>📥 Me deben</Chip>
            </div>
            <TextField label="Descripción" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ej. Préstamo para renta" />
            <TextField label={form.direction === "borrowed" ? "Prestamista" : "Deudor"} value={form.person} onChange={(event) => setForm({ ...form, person: event.target.value })} placeholder="Nombre" />
            <TextField label="Monto ($)" type="number" value={form.originalAmount} onChange={(event) => setForm({ ...form, originalAmount: event.target.value })} placeholder="0.00" />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Fecha inicio" type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
              <TextField label="Fecha límite" type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
            </div>
            <TextField label="Notas" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleAdd}>Agregar</Button>
            </div>
          </div>
        </Card>
      )}

      {borrowed.length > 0 && <Section title="📤 Yo debo" color="red" loans={borrowed} />}
      {lent.length > 0 && <Section title="📥 Me deben" color="green" loans={lent} />}
      {loans.length === 0 && !showForm && <Card className="border-dashed text-center text-sm text-gray-500">Sin préstamos registrados.<br />Agrega uno para hacer seguimiento.</Card>}
    </div>
  );
}

function remaining(loan: Loan) {
  return Math.max(0, loan.originalAmount - loan.payments.reduce((sum, payment) => sum + payment.amount, 0));
}

function Section({ title, color, loans }: { title: string; color: "red" | "green"; loans: Loan[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className={`text-sm font-extrabold uppercase tracking-wide ${color === "red" ? "text-red-600" : "text-green-600"}`}>{title}</h3>
      {loans.map((loan) => <LoanCard key={loan.id} loan={loan} color={color} />)}
    </section>
  );
}

function LoanCard({ loan, color }: { loan: Loan; color: "red" | "green" }) {
  const { removeLoan, addLoanPayment, removeLoanPayment } = useExpensesStore();
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const paid = loan.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const rem = remaining(loan);
  const pct = Math.min(100, loan.originalAmount > 0 ? (paid / loan.originalAmount) * 100 : 0);
  const mainColor = color === "red" ? "text-red-600" : "text-green-600";
  const barColor = color === "red" ? "bg-red-500" : "bg-green-500";

  function handlePay() {
    const amount = Number(payAmount);
    if (!amount || amount <= 0) return;
    addLoanPayment(loan.id, { amount, date: todayStr(), notes: payNotes.trim() });
    setPayAmount("");
    setPayNotes("");
    setShowPayForm(false);
  }

  return (
    <Card className={loan.status === "paid" ? "opacity-60" : ""}>
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold text-gray-900">{loan.title}</p>
            <p className="text-xs text-gray-500">{loan.person}</p>
          </div>
          <div className="flex items-center gap-2">
            {loan.status === "paid" ? <span className={mainColor}>✓ Liquidado</span> : <span className={`font-extrabold ${mainColor}`}>${formatMXN(rem)}</span>}
            {confirmRemove ? (
              <div className="flex gap-2 text-sm">
                <button type="button" className="font-semibold text-red-600" onClick={() => removeLoan(loan.id)}>Sí</button>
                <button type="button" className="text-gray-500" onClick={() => setConfirmRemove(false)}>No</button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(true)}>✕</Button>
            )}
          </div>
        </div>

        {loan.status !== "paid" && (
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-gray-500"><span>${formatMXN(paid)} pagado</span><span>${formatMXN(loan.originalAmount)} total</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} /></div>
            <p className={`text-right text-xs font-bold ${mainColor}`}>{pct.toFixed(0)}% pagado</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          {loan.startDate && <span>Inicio: {loan.startDate}</span>}
          {loan.dueDate && <span className={loan.dueDate < todayStr() && loan.status === "active" ? "text-red-600" : ""}>Vence: {loan.dueDate}</span>}
        </div>
        {loan.notes && <p className="text-sm italic text-gray-500">{loan.notes}</p>}

        {loan.status === "active" && (
          <div className="border-t border-gray-100 pt-3">
            {showPayForm ? (
              <div className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
                  <TextField type="number" value={payAmount} onChange={(event) => setPayAmount(event.target.value)} placeholder={String(rem)} autoFocus />
                  <TextField value={payNotes} onChange={(event) => setPayNotes(event.target.value)} placeholder="Nota (opcional)" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setShowPayForm(false); setPayAmount(""); setPayNotes(""); }}>Cancelar</Button>
                  <Button size="sm" onClick={handlePay}>Registrar abono</Button>
                </div>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => { setShowPayForm(true); setPayAmount(String(rem)); }}>+ Registrar abono</Button>
            )}
          </div>
        )}

        {loan.payments.length > 0 && (
          <>
            <button type="button" className="self-start text-xs font-semibold text-primary" onClick={() => setShowHistory((value) => !value)}>
              {showHistory ? "▲ Ocultar abonos" : `▼ ${loan.payments.length} abono${loan.payments.length !== 1 ? "s" : ""}`}
            </button>
            {showHistory && (
              <div className="flex flex-col gap-2">
                {loan.payments.map((payment) => (
                  <div key={payment.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-gray-100 py-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">{payment.date}</p>
                      {payment.notes && <p className="text-xs text-gray-500">{payment.notes}</p>}
                    </div>
                    <p className={`font-bold ${mainColor}`}>${formatMXN(payment.amount)}</p>
                    <Button variant="ghost" size="sm" onClick={() => removeLoanPayment(loan.id, payment.id)}>✕</Button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

function SummaryCard({ label, value, count, color }: { label: string; value: number; count: number; color: "red" | "green" }) {
  const className = color === "red" ? "text-red-600 bg-red-50 border-red-100" : "text-green-600 bg-green-50 border-green-100";
  return (
    <Card className={`text-center ${className}`}>
      <p className="text-xs font-bold uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-extrabold">${formatMXN(value)}</p>
      <p className="text-xs">{count} activo{count !== 1 ? "s" : ""}</p>
    </Card>
  );
}

function Chip({ selected, color, onClick, children }: { selected: boolean; color: "red" | "green"; onClick: () => void; children: React.ReactNode }) {
  const active = color === "red" ? "border-red-500 bg-red-50 text-red-600" : "border-green-500 bg-green-50 text-green-600";
  return <button type="button" className={`rounded-md border px-3 py-2 text-sm font-semibold ${selected ? active : "border-gray-200 text-gray-500"}`} onClick={onClick}>{children}</button>;
}
