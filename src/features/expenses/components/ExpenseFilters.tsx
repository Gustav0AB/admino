import { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CustomSelect } from "@/shared/components/inputs/CustomSelect";
import { useColors } from "@/shared/hooks/useColors";
import { SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { useExpensesStore } from "../store";
import { getAvailableMeses, getFilteredExpenses, MESES_LIST } from "../helpers";

export function ExpenseFilters() {
  const c = useColors();
  const {
    expenses,
    filterMes,
    filterFrecuencia,
    filterFecha,
    setFilterMes,
    setFilterFrecuencia,
    setFilterFecha,
  } = useExpensesStore();

  const availableMeses = useMemo(() => getAvailableMeses(expenses), [expenses]);
  const filtered = useMemo(
    () => getFilteredExpenses(expenses, filterMes, filterFrecuencia, filterFecha),
    [expenses, filterMes, filterFrecuencia, filterFecha]
  );

  const mesOptions = [
    { label: "Todos", value: "Todos" },
    ...availableMeses.map((m) => ({ label: m, value: m })),
  ];

  const frecOptions = [
    { label: "Todos", value: "Todos" },
    { label: "Mensual", value: "mes" },
    { label: "Quincenal", value: "quincenal" },
    { label: "Único", value: "unico" },
  ];

  const fechaOptions = [
    { label: "Todos", value: 0 },
    { label: "15", value: 15 },
    { label: "30", value: 30 },
  ];

  const hasActiveFilter =
    (filterMes && filterMes !== "Todos") ||
    (filterFrecuencia && filterFrecuencia !== "Todos") ||
    filterFecha !== 0;

  return (
    <View style={styles.row}>
      <CustomSelect
        placeholder="Mes"
        options={mesOptions}
        value={filterMes}
        onChange={(v) => setFilterMes(String(v))}
        style={styles.select}
      />
      <CustomSelect
        placeholder="Frecuencia"
        options={frecOptions}
        value={filterFrecuencia}
        onChange={(v) => setFilterFrecuencia(String(v))}
        style={styles.select}
      />
      <CustomSelect
        placeholder="Fecha"
        options={fechaOptions}
        value={filterFecha}
        onChange={(v) => setFilterFecha(Number(v))}
        style={styles.select}
      />
      <Text style={[styles.count, { color: c.textMuted }]}>
        {filtered.length} / {expenses.length} registros
      </Text>
      {hasActiveFilter && (
        <TouchableOpacity
          onPress={() => {
            setFilterMes("Todos");
            setFilterFrecuencia("Todos");
            setFilterFecha(0);
          }}
        >
          <Text style={[styles.clear, { color: c.danger }]}>✕ Limpiar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: SPACING.sm,
    flex: 1,
  },
  select: { minWidth: 110 },
  count: { fontSize: TYPOGRAPHY.fontSize.sm, marginLeft: SPACING.xs },
  clear: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" },
});
