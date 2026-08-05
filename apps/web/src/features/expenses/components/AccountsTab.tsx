import { useMemo, useState } from "react";
import { Button, Card, ChipGroup, TextField } from "@/shared/ui";
import { useExpensesStore } from "../store";
import { ACCOUNT_TYPES, formatMXN, getAccountBalance, todayISO } from "../helpers";
import type { Account, AccountType } from "../types";

type AccountForm = {
  name: string;
  type: AccountType;
  color: string;
  initialBalance: number;
};

function blankForm(): AccountForm {
  return { name: "", type: "debito", color: "#3B82F6", initialBalance: 0 };
}

function accountToForm(account: Account): AccountForm {
  return {
    name: account.name,
    type: account.type,
    color: account.color,
    initialBalance: account.initialBalance,
  };
}

export function AccountsTab() {
  const { accounts, expenses, incomes, addAccount, updateAccount, removeAccount } = useExpensesStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AccountForm>(blankForm());

  const balances = useMemo(
    () => accounts.map((account) => ({ account, balance: getAccountBalance(account, expenses, incomes) })),
    [accounts, expenses, incomes],
  );
  const totalBalance = balances.reduce((sum, item) => sum + item.balance, 0);

  function patch(update: Partial<AccountForm>) {
    setForm((current) => ({ ...current, ...update }));
  }

  function openAdd() {
    setEditingId(null);
    setForm(blankForm());
    setShowForm(true);
  }

  function openEdit(account: Account) {
    setEditingId(account.id);
    setForm(accountToForm(account));
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    const data: Omit<Account, "id"> = { ...form, balanceDate: todayISO() };
    if (editingId) updateAccount(editingId, data);
    else addAccount(data);
    setShowForm(false);
    setEditingId(null);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {accounts.length > 0 && (
        <Card>
          <p className="text-xs font-semibold uppercase text-gray-500">Saldo total</p>
          <p className={`text-3xl font-extrabold ${totalBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
            ${formatMXN(totalBalance)}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {balances.map(({ account, balance }) => (
              <div key={account.id} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: account.color }} />
                <span className="min-w-0 flex-1 truncate text-gray-500">{account.name}</span>
                <span className="font-semibold text-gray-900">${formatMXN(balance)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-gray-900">
          {accounts.length === 0 ? "Agrega tus cuentas" : `${accounts.length} cuenta${accounts.length !== 1 ? "s" : ""}`}
        </h2>
        <Button size="sm" onClick={openAdd}>Cuenta</Button>
      </div>

      {showForm && (
        <Card className="border-primary">
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-gray-900">{editingId ? "Editar cuenta" : "Nueva cuenta"}</h3>
            <TextField label="Nombre" value={form.name} onChange={(event) => patch({ name: event.target.value })} placeholder="Ej. BBVA Débito" />
            <ChipGroup
              label="Tipo"
              options={ACCOUNT_TYPES}
              value={form.type}
              onChange={(type) => {
                const selected = ACCOUNT_TYPES.find((item) => item.value === type);
                patch({ type: type as AccountType, color: selected?.color ?? form.color });
              }}
            />
            <TextField
              label="Saldo actual ($)"
              type="number"
              value={form.initialBalance === 0 ? "" : String(form.initialBalance)}
              onChange={(event) => patch({ initialBalance: Number(event.target.value) || 0 })}
              placeholder="0"
            />
            <p className="text-xs text-gray-400">El sistema ajusta este saldo con ingresos y gastos vinculados.</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancelar</Button>
              <Button size="sm" onClick={handleSave}>Guardar</Button>
            </div>
          </div>
        </Card>
      )}

      {accounts.length === 0 && !showForm && (
        <Card className="border-dashed text-center text-sm text-gray-500">
          Agrega tus cuentas para ver tu saldo total<br />y controlar de dónde sale cada gasto.
        </Card>
      )}

      {balances.map(({ account, balance }) => (
        <AccountCard
          key={account.id}
          account={account}
          balance={balance}
          linkedExpenses={expenses.filter((expense) => expense.accountId === account.id).length}
          linkedIncomes={incomes.filter((income) => income.accountId === account.id).length}
          onEdit={() => openEdit(account)}
          onRemove={() => removeAccount(account.id)}
          onReconcile={(newBalance) => {
            updateAccount(account.id, {
              initialBalance: account.initialBalance + (newBalance - balance),
              balanceDate: todayISO(),
            });
          }}
        />
      ))}
    </div>
  );
}

function AccountCard({
  account,
  balance,
  linkedExpenses,
  linkedIncomes,
  onEdit,
  onRemove,
  onReconcile,
}: {
  account: Account;
  balance: number;
  linkedExpenses: number;
  linkedIncomes: number;
  onEdit: () => void;
  onRemove: () => void;
  onReconcile: (newBalance: number) => void;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [showReconcile, setShowReconcile] = useState(false);
  const [reconcileAmount, setReconcileAmount] = useState("");
  const typeInfo = ACCOUNT_TYPES.find((type) => type.value === account.type);

  return (
    <Card className="border-l-4" style={{ borderLeftColor: account.color }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-bold text-gray-900">{account.name}</h3>
            {typeInfo && (
              <span className="rounded px-2 py-0.5 text-xs font-semibold" style={{ color: typeInfo.color, backgroundColor: `${typeInfo.color}22` }}>
                {typeInfo.label}
              </span>
            )}
          </div>
          <p className={`mt-2 text-2xl font-extrabold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
            ${formatMXN(balance)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onEdit}>Editar</Button>
          {confirmRemove ? (
            <div className="flex gap-2 text-sm">
              <button type="button" className="font-semibold text-red-600" onClick={onRemove}>Sí</button>
              <button type="button" className="text-gray-500" onClick={() => setConfirmRemove(false)}>No</button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setConfirmRemove(true)}>Eliminar</Button>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
        <span>Saldo base: ${formatMXN(account.initialBalance)}</span>
        {account.balanceDate && <span>· actualizado {account.balanceDate}</span>}
        {linkedIncomes > 0 && <span className="text-green-600">{linkedIncomes} ingreso{linkedIncomes !== 1 ? "s" : ""}</span>}
        {linkedExpenses > 0 && <span className="text-red-600">{linkedExpenses} gasto{linkedExpenses !== 1 ? "s" : ""}</span>}
      </div>

      {showReconcile ? (
        <div className="mt-3 flex flex-col gap-3">
          <TextField
            type="number"
            value={reconcileAmount}
            onChange={(event) => setReconcileAmount(event.target.value)}
            placeholder={`Saldo real (actual: $${formatMXN(balance)})`}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setShowReconcile(false); setReconcileAmount(""); }}>Cancelar</Button>
            <Button
              size="sm"
              onClick={() => {
                const value = Number(reconcileAmount);
                if (Number.isNaN(value)) return;
                onReconcile(value);
                setShowReconcile(false);
                setReconcileAmount("");
              }}
            >
              Ajustar
            </Button>
          </div>
        </div>
      ) : (
        <button type="button" className="mt-3 text-xs font-semibold text-primary" onClick={() => { setShowReconcile(true); setReconcileAmount(String(balance)); }}>
          Ajustar saldo real
        </button>
      )}
    </Card>
  );
}
