import { useMemo } from "react";
import { useExpensesStore } from "../store";
import { CATEGORIES, getAvailableAños, getAvailableMeses, getFilteredExpenses } from "../helpers";

type Option = {
  label: string;
  value: string | number;
};

function FilterSelect({ value, options, onChange, label }: {
  value: string | number;
  options: Option[];
  label: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="sr-only">{label}</span>
      <select
        className="h-9 min-w-28 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={String(option.value)} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

export function ExpenseFilters() {
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

  const hasActiveFilter =
    (filterMes && filterMes !== "Todos") ||
    (filterFrecuencia && filterFrecuencia !== "Todos") ||
    filterFecha !== 0 ||
    filterAño !== 0 ||
    (filterCategoria && filterCategoria !== "Todos");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterSelect label="Año" value={filterAño} onChange={(value) => setFilterAño(Number(value))} options={[
        { label: "Todos los años", value: 0 },
        ...availableAños.map((year) => ({ label: String(year), value: year })),
      ]} />
      <FilterSelect label="Mes" value={filterMes} onChange={setFilterMes} options={[
        { label: "Todos", value: "Todos" },
        ...availableMeses.map((month) => ({ label: month, value: month })),
      ]} />
      <FilterSelect label="Frecuencia" value={filterFrecuencia} onChange={setFilterFrecuencia} options={[
        { label: "Todos", value: "Todos" },
        { label: "Mensual", value: "mes" },
        { label: "Quincenal", value: "quincenal" },
        { label: "Único", value: "unico" },
      ]} />
      <FilterSelect label="Fecha" value={filterFecha} onChange={(value) => setFilterFecha(Number(value))} options={[
        { label: "Todas", value: 0 },
        { label: "1-15", value: 15 },
        { label: "16-31", value: 30 },
      ]} />
      <FilterSelect label="Categoría" value={filterCategoria} onChange={setFilterCategoria} options={[
        { label: "Categoría", value: "Todos" },
        ...CATEGORIES.map((category) => ({ label: category.label, value: category.value })),
      ]} />
      <span className="text-sm text-gray-500">{filtered.length} / {expenses.length} registros</span>
      {hasActiveFilter && (
        <button
          type="button"
          className="text-sm font-semibold text-red-600"
          onClick={() => {
            setFilterMes("Todos");
            setFilterFrecuencia("Todos");
            setFilterFecha(0);
            setFilterAño(0);
            setFilterCategoria("Todos");
          }}
        >
          ✕ Limpiar
        </button>
      )}
    </div>
  );
}
