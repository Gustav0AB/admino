import { useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { CustomSelect } from "@/shared/components/inputs/CustomSelect";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { TableShell } from "@/shared/components/data-display/TableShell";
import { tableStyles } from "@/shared/components/data-display/tableStyles";
import { useColors } from "@/shared/hooks/useColors";
import {
  BORDER_RADIUS,
  BREAKPOINTS,
  SPACING,
  TYPOGRAPHY,
} from "@/shared/theme/tokens";
import { useExpensesStore } from "../store";
import { getFilteredExpenses, MESES_LIST } from "../helpers";
import { ExpenseRow } from "./ExpenseRow";
import type { Estado } from "../types";

const ESTADO_OPTIONS: { label: string; value: Estado }[] = [
  { label: "Pagado", value: "pagado" },
  { label: "No pagado", value: "no pagado" },
  { label: "Guardado", value: "guardado" },
  { label: "No guardado", value: "no guardado" },
];

const COLUMN_HEADERS = [
  "",
  "Mes",
  "Gasto",
  "Monto",
  "Método",
  "Frecuencia",
  "Fecha",
  "Nota",
  "Estado",
  "",
];

export function ExpenseList() {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isMobile = width < BREAKPOINTS.tablet;

  const {
    expenses,
    filterMes,
    filterFrecuencia,
    filterFecha,
    addExpense,
    selectAll,
    bulkAddExpenses,
    bulkUpdateEstado,
    bulkDuplicateExpenses,
  } = useExpensesStore();

  const filtered = useMemo(
    () =>
      getFilteredExpenses(expenses, filterMes, filterFrecuencia, filterFecha),
    [expenses, filterMes, filterFrecuencia, filterFecha],
  );

  const selected = filtered.filter((e) => e.selected);
  const allSelected =
    filtered.length > 0 && selected.length === filtered.length;

  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkEstado, setBulkEstado] = useState<Estado>("pagado");
  const [bulkMeses, setBulkMeses] = useState<string[]>([]);
  const [showBulkDup, setShowBulkDup] = useState(false);

  const handleBulkAdd = () => {
    const mes =
      filterMes !== "Todos"
        ? filterMes
        : (MESES_LIST[new Date().getMonth()] ?? MESES_LIST[0]!);
    bulkAddExpenses(bulkText, mes);
    setBulkText("");
    setShowBulkAdd(false);
  };

  const toggleBulkMes = (mes: string) => {
    setBulkMeses((prev) =>
      prev.includes(mes) ? prev.filter((m) => m !== mes) : [...prev, mes],
    );
  };

  const handleBulkDuplicate = () => {
    if (bulkMeses.length > 0) bulkDuplicateExpenses(bulkMeses);
    setShowBulkDup(false);
    setBulkMeses([]);
  };

  // ── Toolbar ──
  const toolbar = (
    <>
      <View style={tableStyles.toolbarLeft}>
        <TouchableOpacity onPress={() => selectAll(!allSelected)}>
          <View
            style={[
              tableStyles.checkbox,
              {
                borderColor: c.border,
                backgroundColor: allSelected ? c.primary : "transparent",
              },
            ]}
          >
            {allSelected && (
              <Text
                style={[tableStyles.checkMark, { color: c.primaryForeground }]}
              >
                ✓
              </Text>
            )}
          </View>
        </TouchableOpacity>
        <CustomButton variant="primary" size="sm" onPress={addExpense}>
          + Agregar
        </CustomButton>
        <CustomButton
          variant="outline"
          size="sm"
          onPress={() => setShowBulkAdd(!showBulkAdd)}
        >
          + Múltiple
        </CustomButton>
      </View>

      {selected.length > 0 && (
        <View style={tableStyles.toolbarRight}>
          <Text style={[tableStyles.cellText, { color: c.textMuted }]}>
            {selected.length} seleccionados
          </Text>
          <CustomSelect
            options={ESTADO_OPTIONS}
            value={bulkEstado}
            onChange={(v) => setBulkEstado(v as Estado)}
            style={{ minWidth: 120 }}
          />
          <CustomButton
            variant="secondary"
            size="sm"
            onPress={() => bulkUpdateEstado(bulkEstado)}
          >
            Aplicar
          </CustomButton>
          <CustomButton
            variant="outline"
            size="sm"
            onPress={() => setShowBulkDup(true)}
          >
            Duplicar
          </CustomButton>
        </View>
      )}
    </>
  );

  const getHeaderStyle = (h: string, i: number) => {
    if (i === 0) return { width: 40, textAlign: "center" as const };
    if (i === 9) return { width: 56, textAlign: "center" as const };
    if (h === "Fecha") return { width: 70 };
    if (h === "Gasto") return { flex: 2 };
    return { flex: 1 };
  };

  const headerRow = (
    <>
      {COLUMN_HEADERS.map((h, i) => (
        <Text
          key={i}
          style={[
            tableStyles.headerText,
            { color: c.textMuted },
            getHeaderStyle(h, i),
          ]}
        >
          {h}
        </Text>
      ))}
    </>
  );

  const panels = (
    <>
      {showBulkAdd && (
        <View
          style={[
            tableStyles.panel,
            {
              borderBottomColor: c.border,
              backgroundColor: c.backgroundStrong,
            },
          ]}
        >
          <Text style={[tableStyles.panelHint, { color: c.textMuted }]}>
            Formato: Renta, 8500, 30, efectivo (una por línea)
          </Text>
          <TextInput
            style={[
              localStyles.bulkInput,
              {
                color: c.text,
                borderColor: c.border,
                backgroundColor: c.background,
              },
            ]}
            value={bulkText}
            onChangeText={setBulkText}
            multiline
            numberOfLines={4}
            placeholder={
              "Renta, 8500, 30, efectivo\nGroceries, 2000, 15, credito"
            }
            placeholderTextColor={c.textPlaceholder}
          />
          <View style={tableStyles.panelActions}>
            <CustomButton
              variant="outline"
              size="sm"
              onPress={() => {
                setShowBulkAdd(false);
                setBulkText("");
              }}
            >
              Cancelar
            </CustomButton>
            <CustomButton variant="primary" size="sm" onPress={handleBulkAdd}>
              Agregar
            </CustomButton>
          </View>
        </View>
      )}

      {showBulkDup && (
        <View
          style={[
            tableStyles.panel,
            {
              borderBottomColor: c.border,
              backgroundColor: c.backgroundStrong,
            },
          ]}
        >
          <Text style={[tableStyles.panelHint, { color: c.text }]}>
            Duplicar {selected.length} filas a:
          </Text>
          <View style={localStyles.dupGrid}>
            {MESES_LIST.map((mes) => {
              const sel = bulkMeses.includes(mes);
              return (
                <TouchableOpacity
                  key={mes}
                  onPress={() => toggleBulkMes(mes)}
                  style={[
                    localStyles.dupChip,
                    {
                      borderColor: sel ? c.primary : c.border,
                      backgroundColor: sel ? `${c.primary}20` : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      localStyles.dupChipText,
                      { color: sel ? c.primary : c.text },
                    ]}
                  >
                    {mes.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={tableStyles.panelActions}>
            <CustomButton
              variant="outline"
              size="sm"
              onPress={() => {
                setShowBulkDup(false);
                setBulkMeses([]);
              }}
            >
              Cancelar
            </CustomButton>
            <CustomButton
              variant="primary"
              size="sm"
              onPress={handleBulkDuplicate}
            >
              Confirmar
            </CustomButton>
          </View>
        </View>
      )}
    </>
  );

  if (isMobile) {
    return (
      <View style={localStyles.container}>
        <View
          style={[
            tableStyles.toolbar,
            { borderBottomColor: c.border, backgroundColor: c.background },
          ]}
        >
          {toolbar}
        </View>
        {panels}
        <FlatList
          data={filtered}
          keyExtractor={(e) => e.id}
          renderItem={({ item }) => <ExpenseRow expense={item} />}
          contentContainerStyle={localStyles.mobileList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  return (
    <View style={localStyles.container}>
      {panels}
      <TableShell toolbar={toolbar} header={headerRow}>
        {filtered.map((e) => (
          <ExpenseRow key={e.id} expense={e} />
        ))}
      </TableShell>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: { flex: 1 },
  mobileList: { padding: SPACING.sm },
  bulkInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    minHeight: 80,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  dupGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs },
  dupChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  dupChipText: { fontSize: TYPOGRAPHY.fontSize.xs },
});
