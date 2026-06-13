import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { useExpensesStore } from "../store";
import { ACCOUNT_TYPES, formatMXN, getAccountBalance } from "../helpers";
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

function accountToForm(a: Account): AccountForm {
  return { name: a.name, type: a.type, color: a.color, initialBalance: a.initialBalance };
}

export function AccountsTab() {
  const c = useColors();
  const { accounts, expenses, incomes, addAccount, updateAccount, removeAccount } = useExpensesStore();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AccountForm>(blankForm());

  function patch(u: Partial<AccountForm>) {
    setForm((f) => ({ ...f, ...u }));
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
    const data: Omit<Account, "id"> = {
      ...form,
      balanceDate: new Date().toISOString().split("T")[0],
    };
    if (editingId) {
      updateAccount(editingId, data);
    } else {
      addAccount(data);
    }
    setShowForm(false);
    setEditingId(null);
  }

  const balances = useMemo(
    () => accounts.map((a) => ({ account: a, balance: getAccountBalance(a, expenses, incomes) })),
    [accounts, expenses, incomes],
  );

  const totalBalance = balances.reduce((s, b) => s + b.balance, 0);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Total header */}
      {accounts.length > 0 && (
        <View style={[styles.totalCard, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
          <Text style={[styles.totalLabel, { color: c.textMuted }]}>Saldo total</Text>
          <Text style={[styles.totalValue, { color: totalBalance >= 0 ? "#16A34A" : c.danger }]}>
            ${formatMXN(totalBalance)}
          </Text>
          <View style={styles.accountTypesRow}>
            {balances.map(({ account, balance }) => (
              <View key={account.id} style={styles.miniAccount}>
                <View style={[styles.miniDot, { backgroundColor: account.color }]} />
                <Text style={[styles.miniName, { color: c.textMuted }]} numberOfLines={1}>{account.name}</Text>
                <Text style={[styles.miniBalance, { color: c.text }]}>${formatMXN(balance)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Add button */}
      <View style={styles.topBar}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>
          {accounts.length === 0 ? "Agrega tus cuentas" : `${accounts.length} cuenta${accounts.length !== 1 ? "s" : ""}`}
        </Text>
        <CustomButton variant="outline" size="sm" onPress={openAdd}>+ Cuenta</CustomButton>
      </View>

      {/* Form */}
      {showForm && (
        <View style={[styles.form, { backgroundColor: c.backgroundStrong, borderColor: c.primary }]}>
          <Text style={[styles.formTitle, { color: c.text }]}>
            {editingId ? "Editar cuenta" : "Nueva cuenta"}
          </Text>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Nombre</Text>
            <TextInput
              style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
              value={form.name}
              onChangeText={(v) => patch({ name: v })}
              placeholder="Ej. BBVA Débito"
              placeholderTextColor={c.textPlaceholder}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Tipo</Text>
            <View style={styles.chips}>
              {ACCOUNT_TYPES.map((t) => (
                <TypeChip
                  key={t.value}
                  label={t.label}
                  color={t.color}
                  selected={form.type === t.value}
                  onPress={() => patch({ type: t.value, color: t.color })}
                  c={c}
                />
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Saldo actual ($)</Text>
            <TextInput
              style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
              value={form.initialBalance === 0 ? "" : String(form.initialBalance)}
              onChangeText={(v) => patch({ initialBalance: parseFloat(v) || 0 })}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={c.textPlaceholder}
            />
            <Text style={[styles.fieldHint, { color: c.textPlaceholder }]}>
              Ingresa tu saldo actual. El sistema lo ajustará automáticamente con ingresos y gastos vinculados.
            </Text>
          </View>

          <View style={styles.formActions}>
            <CustomButton variant="outline" size="sm" onPress={() => { setShowForm(false); setEditingId(null); }}>
              Cancelar
            </CustomButton>
            <CustomButton variant="primary" size="sm" onPress={handleSave}>
              Guardar
            </CustomButton>
          </View>
        </View>
      )}

      {/* Empty */}
      {accounts.length === 0 && !showForm && (
        <View style={[styles.empty, { borderColor: c.border }]}>
          <Text style={[styles.emptyText, { color: c.textMuted }]}>
            Agrega tus cuentas para ver tu saldo total{"\n"}y controlar de dónde sale cada gasto.
          </Text>
        </View>
      )}

      {/* Account cards */}
      {balances.map(({ account, balance }) => (
        <AccountCard
          key={account.id}
          account={account}
          balance={balance}
          linkedExpenses={expenses.filter((e) => e.accountId === account.id).length}
          linkedIncomes={incomes.filter((i) => i.accountId === account.id).length}
          onEdit={() => openEdit(account)}
          onRemove={() => removeAccount(account.id)}
          onReconcile={(newBalance) => {
            const adj = newBalance - balance;
            updateAccount(account.id, {
              initialBalance: account.initialBalance + adj,
              balanceDate: new Date().toISOString().split("T")[0],
            });
          }}
          c={c}
        />
      ))}
    </ScrollView>
  );
}

function AccountCard({
  account, balance, linkedExpenses, linkedIncomes, onEdit, onRemove, onReconcile, c,
}: {
  account: Account;
  balance: number;
  linkedExpenses: number;
  linkedIncomes: number;
  onEdit: () => void;
  onRemove: () => void;
  onReconcile: (newBalance: number) => void;
  c: ReturnType<typeof useColors>;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [showReconcile, setShowReconcile] = useState(false);
  const [reconcileAmount, setReconcileAmount] = useState("");

  const typeInfo = ACCOUNT_TYPES.find((t) => t.value === account.type);

  return (
    <View style={[styles.card, { backgroundColor: c.backgroundStrong, borderColor: c.border, borderLeftColor: account.color, borderLeftWidth: 4 }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardName, { color: c.text }]}>{account.name}</Text>
          {typeInfo && (
            <View style={[styles.typeBadge, { backgroundColor: `${typeInfo.color}22` }]}>
              <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
            <Text style={[styles.actionText, { color: c.primary }]}>✎</Text>
          </TouchableOpacity>
          {confirmRemove ? (
            <View style={styles.confirmRow}>
              <TouchableOpacity onPress={onRemove}>
                <Text style={[styles.actionText, { color: c.danger }]}>Sí</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setConfirmRemove(false)}>
                <Text style={[styles.actionText, { color: c.textMuted }]}>No</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setConfirmRemove(true)} style={styles.actionBtn}>
              <Text style={[styles.actionText, { color: c.textMuted }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={[styles.balanceValue, { color: balance >= 0 ? "#16A34A" : c.danger }]}>
        ${formatMXN(balance)}
      </Text>

      <View style={styles.metaRow}>
        <Text style={[styles.metaText, { color: c.textMuted }]}>
          Saldo base: ${formatMXN(account.initialBalance)}
        </Text>
        {account.balanceDate && (
          <Text style={[styles.metaText, { color: c.textPlaceholder }]}>
            · actualizado {account.balanceDate}
          </Text>
        )}
      </View>

      {(linkedExpenses > 0 || linkedIncomes > 0) && (
        <View style={styles.linkedRow}>
          {linkedIncomes > 0 && (
            <Text style={[styles.linkedText, { color: "#16A34A" }]}>▲ {linkedIncomes} ingreso{linkedIncomes !== 1 ? "s" : ""}</Text>
          )}
          {linkedExpenses > 0 && (
            <Text style={[styles.linkedText, { color: c.danger }]}>▼ {linkedExpenses} gasto{linkedExpenses !== 1 ? "s" : ""}</Text>
          )}
        </View>
      )}

      {/* Reconcile */}
      {showReconcile ? (
        <View style={styles.reconcileForm}>
          <TextInput
            style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
            value={reconcileAmount}
            onChangeText={setReconcileAmount}
            keyboardType="numeric"
            placeholder={`Saldo real (actual: $${formatMXN(balance)})`}
            placeholderTextColor={c.textPlaceholder}
            autoFocus
          />
          <View style={styles.formActions}>
            <CustomButton variant="outline" size="sm" onPress={() => { setShowReconcile(false); setReconcileAmount(""); }}>
              Cancelar
            </CustomButton>
            <CustomButton
              variant="primary"
              size="sm"
              onPress={() => {
                const v = parseFloat(reconcileAmount);
                if (isNaN(v)) return;
                onReconcile(v);
                setShowReconcile(false);
                setReconcileAmount("");
              }}
            >
              Ajustar
            </CustomButton>
          </View>
        </View>
      ) : (
        <TouchableOpacity onPress={() => { setShowReconcile(true); setReconcileAmount(String(balance)); }}>
          <Text style={[styles.reconcileLink, { color: c.primary }]}>⚖ Ajustar saldo real</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function TypeChip({
  label, color, selected, onPress, c,
}: {
  label: string; color: string; selected: boolean; onPress: () => void; c: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, { borderColor: selected ? color : c.border, backgroundColor: selected ? `${color}22` : "transparent" }]}
    >
      <Text style={[styles.chipText, { color: selected ? color : c.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xl },

  totalCard: { borderRadius: BORDER_RADIUS.md, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.md, gap: SPACING.xs },
  totalLabel: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600", textTransform: "uppercase" },
  totalValue: { fontSize: 28, fontWeight: "800" },
  accountTypesRow: { gap: SPACING.xs, marginTop: SPACING.xs },
  miniAccount: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
  miniDot: { width: 8, height: 8, borderRadius: 4 },
  miniName: { fontSize: TYPOGRAPHY.fontSize.xs, flex: 1 },
  miniBalance: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },

  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "700" },

  form: { borderRadius: BORDER_RADIUS.md, borderWidth: 1, padding: SPACING.md, gap: SPACING.md },
  formTitle: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "700" },
  formActions: { flexDirection: "row", justifyContent: "flex-end", gap: SPACING.sm },
  field: { gap: 4 },
  fieldLabel: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600" },
  fieldHint: { fontSize: 10, lineHeight: 14, marginTop: 2 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, fontSize: TYPOGRAPHY.fontSize.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs },
  chip: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.full, borderWidth: 1 },
  chipText: { fontSize: TYPOGRAPHY.fontSize.xs },

  empty: { borderWidth: 1, borderStyle: "dashed", borderRadius: BORDER_RADIUS.md, padding: SPACING.xl, alignItems: "center" },
  emptyText: { fontSize: TYPOGRAPHY.fontSize.sm, textAlign: "center", lineHeight: 22 },

  card: { borderRadius: BORDER_RADIUS.md, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.md, gap: SPACING.sm },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  cardTitleRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: SPACING.sm, flexWrap: "wrap" },
  cardName: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: "700" },
  typeBadge: { paddingHorizontal: SPACING.xs, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm },
  typeBadgeText: { fontSize: 10, fontWeight: "600" },
  cardActions: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
  actionBtn: { padding: SPACING.xs },
  actionText: { fontSize: TYPOGRAPHY.fontSize.sm },
  confirmRow: { flexDirection: "row", gap: SPACING.xs, alignItems: "center" },

  balanceValue: { fontSize: 26, fontWeight: "800" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  metaText: { fontSize: TYPOGRAPHY.fontSize.xs },
  linkedRow: { flexDirection: "row", gap: SPACING.md },
  linkedText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "500" },

  reconcileForm: { gap: SPACING.sm },
  reconcileLink: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600", paddingVertical: SPACING.xs },
});
