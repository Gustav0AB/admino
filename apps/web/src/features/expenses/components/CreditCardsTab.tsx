import { useMemo, useState } from "react";
import { Badge, Button, Card, Dropdown, TextField } from "@/shared/ui";
import { usePlanningStore } from "../planning/store";
import { useExpensesStore } from "../store";
import {
  currentMonthName,
  currentYear,
  formatMXN,
  getAvailableAños,
  getBillingCycleStatus,
  getBillingPeriodCharges,
  getBillingPeriodLabel,
  getCreditCycleInfoForCard,
  getCreditHistoryForCard,
  getCurrentCreditBalance,
  getMSIPendingForCard,
  MESES_LIST,
  nextMonthName,
} from "../helpers";
import type { BillingCycleStatus } from "../helpers";
import type { CreditCard, Expense } from "../types";
import type { InstallmentPayment } from "../planning/types";

const MES_OPTIONS = MESES_LIST.map((month) => ({ label: month, value: month }));
const STATUS_COLOR: Record<BillingCycleStatus, "red" | "green" | "gray"> = {
  cerrado: "red",
  en_curso: "green",
  no_en_curso: "gray",
};
const STATUS_LABEL: Record<BillingCycleStatus, string> = {
  cerrado: "Cerrado",
  en_curso: "En curso",
  no_en_curso: "No en curso",
};

type AddCardForm = {
  name: string;
  cutDay: string;
  payDay: string;
  initialDebt: string;
};

const blankAddForm = (): AddCardForm => ({ name: "", cutDay: "", payDay: "", initialDebt: "" });

export function CreditCardsTab() {
  const { expenses, creditCards, addCreditCard, updateCreditCard, removeCreditCard, addCardPayment } = useExpensesStore();
  const { installmentPayments } = usePlanningStore();
  const [selectedMes, setSelectedMes] = useState(currentMonthName());
  const [selectedAño, setSelectedAño] = useState(currentYear());
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<AddCardForm>(blankAddForm());

  const añoOptions = useMemo(
    () => [...getAvailableAños(expenses), currentYear() + 1]
      .filter((year, index, years) => years.indexOf(year) === index)
      .sort((a, b) => a - b)
      .map((year) => ({ label: String(year), value: String(year) })),
    [expenses],
  );

  function handleAdd() {
    if (!addForm.name.trim()) return;
    addCreditCard({
      name: addForm.name.trim(),
      cutDay: Number(addForm.cutDay) || 0,
      payDay: Number(addForm.payDay) || 0,
      initialDebt: Number(addForm.initialDebt) || 0,
      debtMes: selectedMes,
      debtAño: selectedAño,
    });
    setAddForm(blankAddForm());
    setShowAddForm(false);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Dropdown label="Año" value={String(selectedAño)} options={añoOptions} onChange={(value) => setSelectedAño(Number(value))} />
          <Dropdown label="Mes" value={selectedMes} options={MES_OPTIONS} onChange={setSelectedMes} />
        </div>
        <Button size="sm" onClick={() => { setShowAddForm(true); setAddForm(blankAddForm()); }}>Nueva tarjeta</Button>
      </div>

      {showAddForm && (
        <Card className="border-primary">
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-gray-900">Nueva tarjeta</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Nombre" value={addForm.name} onChange={(event) => setAddForm({ ...addForm, name: event.target.value })} placeholder="Ej. BBVA Azul" />
              <TextField label="Día de corte" type="number" value={addForm.cutDay} onChange={(event) => setAddForm({ ...addForm, cutDay: event.target.value })} placeholder="15" />
              <TextField label="Día de pago" type="number" value={addForm.payDay} onChange={(event) => setAddForm({ ...addForm, payDay: event.target.value })} placeholder="5" />
              <TextField label="Adeudo inicial ($)" type="number" value={addForm.initialDebt} onChange={(event) => setAddForm({ ...addForm, initialDebt: event.target.value })} placeholder="0" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleAdd}>Agregar</Button>
            </div>
          </div>
        </Card>
      )}

      {creditCards.length === 0 && !showAddForm && (
        <Card className="border-dashed text-center text-sm text-gray-500">
          Aún no tienes tarjetas configuradas.<br />Agrega una para ver los cargos por mes.
        </Card>
      )}

      {creditCards.map((card) => (
        <CardItem
          key={card.id}
          card={card}
          expenses={expenses}
          selectedMes={selectedMes}
          selectedAño={selectedAño}
          installmentPayments={installmentPayments}
          onUpdate={(patch) => updateCreditCard(card.id, patch)}
          onRemove={() => removeCreditCard(card.id)}
          onPayment={(amount) => addCardPayment(card.id, amount, currentMonthName(), currentYear())}
        />
      ))}
    </div>
  );
}

function CardItem({
  card,
  expenses,
  selectedMes,
  selectedAño,
  installmentPayments,
  onUpdate,
  onRemove,
  onPayment,
}: {
  card: CreditCard;
  expenses: Expense[];
  selectedMes: string;
  selectedAño: number;
  installmentPayments: InstallmentPayment[];
  onUpdate: (patch: Partial<CreditCard>) => void;
  onRemove: () => void;
  onPayment: (amount: number) => void;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [showReconcile, setShowReconcile] = useState(false);
  const [reconcileAmount, setReconcileAmount] = useState("");
  const [showCloseCycle, setShowCloseCycle] = useState(false);

  const cycle = useMemo(() => getCreditCycleInfoForCard(expenses, card), [expenses, card]);
  const history = useMemo(() => getCreditHistoryForCard(expenses, card), [expenses, card]);
  const currentBalance = getCurrentCreditBalance(history, card.initialDebt);
  const msi = useMemo(() => getMSIPendingForCard(installmentPayments, card.id), [installmentPayments, card.id]);
  const cycleStatus = useMemo(() => getBillingCycleStatus(selectedMes, card.cutDay), [selectedMes, card.cutDay]);
  const billingCharges = useMemo(() => getBillingPeriodCharges(expenses, card.id, selectedMes, card.cutDay, selectedAño), [expenses, card.id, selectedMes, card.cutDay, selectedAño]);
  const billingTotal = billingCharges.reduce((sum, expense) => sum + expense.monto, 0);
  const isActiveStatement = selectedMes === cycle.currentMonth;

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <TextField className="font-bold" value={card.name} onChange={(event) => onUpdate({ name: event.target.value })} placeholder="Nombre de tarjeta" />
          {confirmRemove ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-red-600">¿Eliminar?</span>
              <button type="button" className="font-semibold text-red-600" onClick={onRemove}>Sí</button>
              <button type="button" className="text-gray-500" onClick={() => setConfirmRemove(false)}>No</button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(true)}>Eliminar</Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          {card.cutDay > 0 && <span>Corte: día {card.cutDay}</span>}
          {card.payDay > 0 && <span>Pago: día {card.payDay}</span>}
          <Badge color={STATUS_COLOR[cycleStatus]}>{STATUS_LABEL[cycleStatus]}</Badge>
          {isActiveStatement && cycle.isPayDayPassed && cycleStatus === "cerrado" && <span className="text-red-600">Pago vencido</span>}
        </div>

        {isActiveStatement && (
          <section className="border-t border-gray-100 pt-3">
            <DebtRow label="Adeudo estado de cuenta" value={cycle.frozenDebt} />
            {cycle.totalPayments > 0 && <DebtRow label="Pagos realizados" value={-cycle.totalPayments} color="text-green-600" />}
            {cycle.remainingDebt > 0 && <DebtRow label={`Saldo a pagar (día ${cycle.payDay})`} value={cycle.remainingDebt} color="text-red-600" strong />}
            {cycle.newCharges > 0 && <DebtRow label={cycle.isCutPassed ? "Nuevos cargos (próx. ciclo)" : "Cargos del ciclo actual"} value={cycle.newCharges} muted />}
            <DebtRow label="Balance actual" value={currentBalance} />
            {(card.creditLimit ?? 0) > 0 && <CreditLimitBar limit={card.creditLimit ?? 0} used={currentBalance} />}
          </section>
        )}

        {showReconcile ? (
          <section className="flex flex-col gap-3 border-t border-gray-100 pt-3">
            <TextField label="Ajustar deuda real" type="number" value={reconcileAmount} onChange={(event) => setReconcileAmount(event.target.value)} placeholder={`Balance actual: $${formatMXN(currentBalance)}`} autoFocus />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setShowReconcile(false); setReconcileAmount(""); }}>Cancelar</Button>
              <Button size="sm" onClick={() => {
                const real = Number(reconcileAmount);
                if (Number.isNaN(real)) return;
                onUpdate({ initialDebt: card.initialDebt + (real - currentBalance) });
                setShowReconcile(false);
                setReconcileAmount("");
              }}>Ajustar</Button>
            </div>
          </section>
        ) : (
          <button type="button" className="self-start text-xs font-semibold text-primary" onClick={() => { setShowReconcile(true); setReconcileAmount(String(currentBalance)); }}>Ajustar deuda real</button>
        )}

        {msi.count > 0 && (
          <section className="rounded-lg border border-gray-100 bg-blue-50 p-3 text-sm">
            <p className="text-xs font-semibold uppercase text-gray-500">MSI activos</p>
            <div className="mt-1 flex flex-wrap gap-3">
              <Badge color="blue">{msi.count} plan{msi.count !== 1 ? "es" : ""}</Badge>
              <span className="font-semibold text-gray-900">${formatMXN(msi.monthlyTotal)}/mes</span>
              <span className="text-gray-500">${formatMXN(msi.totalPending)} pendiente</span>
            </div>
          </section>
        )}

        {isActiveStatement && cycle.frozenDebt > 0 && (
          <section className="border-t border-gray-100 pt-3">
            {showPayForm ? (
              <div className="flex flex-col gap-3">
                <TextField label="Monto a pagar" type="number" value={payAmount} onChange={(event) => setPayAmount(event.target.value)} placeholder={String(cycle.remainingDebt || cycle.frozenDebt)} autoFocus />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setShowPayForm(false); setPayAmount(""); }}>Cancelar</Button>
                  <Button size="sm" onClick={() => {
                    const amount = Number(payAmount);
                    if (!amount || amount <= 0) return;
                    onPayment(amount);
                    setShowPayForm(false);
                    setPayAmount("");
                  }}>Confirmar pago</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => onPayment(cycle.remainingDebt || cycle.frozenDebt)}>Pagar total ${formatMXN(cycle.remainingDebt || cycle.frozenDebt)}</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowPayForm(true)}>Pagar parcial</Button>
              </div>
            )}
          </section>
        )}

        {isActiveStatement && (cycle.remainingDebt > 0 || cycle.newCharges > 0) && (
          <section className="border-t border-gray-100 pt-3">
            {showCloseCycle ? (
              <div className="flex flex-col gap-3">
                <div className="rounded-lg border border-gray-100 bg-red-50 p-3">
                  <DebtRow label="Deuda restante" value={cycle.remainingDebt} />
                  <DebtRow label="Cargos del mes" value={cycle.newCharges} />
                  <DebtRow label={`= Deuda en ${nextMonthName()}`} value={cycle.remainingDebt + cycle.newCharges} color="text-red-600" strong />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowCloseCycle(false)}>Cancelar</Button>
                  <Button size="sm" onClick={() => {
                    const nextMes = nextMonthName();
                    onUpdate({ initialDebt: cycle.remainingDebt + cycle.newCharges, debtMes: nextMes, debtAño: nextMes === "Enero" ? currentYear() + 1 : currentYear() });
                    setShowCloseCycle(false);
                  }}>Confirmar</Button>
                </div>
              </div>
            ) : (
              <button type="button" className="text-xs font-semibold text-gray-500" onClick={() => setShowCloseCycle(true)}>Cerrar ciclo y arrastrar deuda al siguiente mes</button>
            )}
          </section>
        )}

        <section className="border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold uppercase text-gray-500">Cargos del ciclo · {getBillingPeriodLabel(selectedMes, card.cutDay)} ({billingCharges.length})</p>
          {cycleStatus === "no_en_curso" ? (
            <p className="mt-2 text-sm text-gray-400">Mes fuera del ciclo activo · sin cargos registrados</p>
          ) : billingCharges.length === 0 ? (
            <p className="mt-2 text-sm text-gray-400">Sin cargos en este periodo</p>
          ) : (
            <div className="mt-2 flex flex-col gap-1">
              {billingCharges.map((expense) => <InfoRow key={expense.id} label={expense.gastos} value={`$${formatMXN(expense.monto)}`} />)}
              <InfoRow label="Total" value={`$${formatMXN(billingTotal)}`} strong />
            </div>
          )}
        </section>

        <section className="grid gap-3 border-t border-gray-100 pt-3 sm:grid-cols-3">
          <TextField label="Límite de crédito ($)" type="number" value={String(card.creditLimit || "")} onChange={(event) => onUpdate({ creditLimit: Number(event.target.value) || 0 })} />
          <TextField label="Día de corte" type="number" value={String(card.cutDay || "")} onChange={(event) => onUpdate({ cutDay: Number(event.target.value) || 0 })} />
          <TextField label="Día de pago" type="number" value={String(card.payDay || "")} onChange={(event) => onUpdate({ payDay: Number(event.target.value) || 0 })} />
        </section>

        <button type="button" className="self-start text-xs font-semibold text-primary" onClick={() => setShowHistory((value) => !value)}>
          {showHistory ? "Ocultar historial" : "Ver historial"}
        </button>
        {showHistory && (
          <section className="flex flex-col gap-2">
            {history.length === 0 ? <p className="text-sm text-gray-500">Sin movimientos</p> : history.map((entry) => (
              <div key={entry.id} className="grid gap-2 border-b border-gray-100 py-2 text-sm sm:grid-cols-[80px_1fr_auto]">
                <Badge color={entry.type === "cargo" ? "red" : "green"}>{entry.type === "cargo" ? "Cargo" : "Pago"}</Badge>
                <div>
                  <p className="font-medium text-gray-900">{entry.description}</p>
                  <p className="text-xs text-gray-500">{entry.mes}</p>
                </div>
                <div className="text-right">
                  <p className={entry.type === "cargo" ? "font-semibold text-red-600" : "font-semibold text-green-600"}>{entry.type === "cargo" ? "" : "-"}${formatMXN(entry.amount)}</p>
                  <p className="text-xs text-gray-500">${formatMXN(entry.balance)}</p>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </Card>
  );
}

function CreditLimitBar({ limit, used }: { limit: number; used: number }) {
  const pct = Math.min(100, Math.max(0, (used / limit) * 100));
  const available = Math.max(0, limit - used);
  const color = pct >= 80 ? "bg-red-500" : pct >= 50 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="mt-2 flex flex-col gap-1">
      <InfoRow label="Disponible" value={`$${formatMXN(available)} / $${formatMXN(limit)}`} />
      <div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className={`h-full ${color}`} style={{ width: `${pct}%` }} /></div>
      <p className="text-right text-xs text-gray-500">{pct.toFixed(0)}% utilizado</p>
    </div>
  );
}

function DebtRow({ label, value, color, strong, muted }: { label: string; value: number; color?: string; strong?: boolean; muted?: boolean }) {
  return <InfoRow label={label} value={`$${formatMXN(Math.abs(value))}`} strong={strong} valueClass={color} muted={muted} />;
}

function InfoRow({ label, value, strong, valueClass, muted }: { label: string; value: string; strong?: boolean; valueClass?: string; muted?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-0.5 text-sm">
      <span className={`${strong ? "font-semibold" : ""} ${muted ? "text-gray-500" : "text-gray-700"}`}>{label}</span>
      <span className={`${strong ? "font-bold" : "font-medium"} ${valueClass ?? "text-gray-900"}`}>{value}</span>
    </div>
  );
}
