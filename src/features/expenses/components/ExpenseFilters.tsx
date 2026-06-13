import { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CustomSelect } from "@/shared/components/inputs/CustomSelect";
import { useColors } from "@/shared/hooks/useColors";
import { SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { useExpensesStore } from "../store";
import { CATEGORIES, getAvailableMeses, getAvailableAños, getFilteredExpenses } from "../helpers";

export function ExpenseFilters() {
  const c = useColors();
  const {
    expenses,
    filterMes,
    filterFrecuencia,
    filterFecha,
    filterAño,
    filterCategoria,
    setFilterMes,
    setFilterFrecuencia,
    setFilterFecha,
    setFilterAño,
    setFilterCategoria,
  } = useExpensesStore();

  const availableMeses = useMemo(() => getAvailableMeses(expenses), [expenses]);
  const availableAños = useMemo(() => getAvailableAños(expenses), [expenses]);
  const filtered = useMemo(
    () => getFilteredExpenses(expenses, filterMes, filterFrecuencia, filterFecha, filterAño, filterCategoria),
    [expenses, filterMes, filterFrecuencia, filterFecha, filterAño, filterCategoria]
  );

  const añoOptions = [
    { label: "Todos los años", value: 0 },
    ...availableAños.map((y) => ({ label: String(y), value: y })),
  ];

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
    { label: "Todas", value: 0 },
    { label: "1-15", value: 15 },
    { label: "16-31", value: 30 },
  ];

  const categoriaOptions = [
    { label: "Categoría", value: "Todos" },
    ...CATEGORIES.map((cat) => ({ label: cat.label, value: cat.value })),
  ];

  const hasActiveFilter =
    (filterMes && filterMes !== "Todos") ||
    (filterFrecuencia && filterFrecuencia !== "Todos") ||
    filterFecha !== 0 ||
    filterAño !== 0 ||
    (filterCategoria && filterCategoria !== "Todos");

  return (
    <View style={styles.row}>
      <CustomSelect
        placeholder="Año"
        options={añoOptions}
        value={filterAño}
        onChange={(v) => setFilterAño(Number(v))}
        style={styles.select}
      />
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
      <CustomSelect
        placeholder="Categoría"
        options={categoriaOptions}
        value={filterCategoria}
        onChange={(v) => setFilterCategoria(String(v))}
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
            setFilterAño(0);
            setFilterCategoria("Todos");
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
