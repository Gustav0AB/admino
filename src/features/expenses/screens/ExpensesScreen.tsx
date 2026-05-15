import { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { FeatureShell } from "@/shared/components/shell/FeatureShell";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { useColors } from "@/shared/hooks/useColors";
import { useToast } from "@/shared/components/feedback/Toast";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { expensesApi } from "../api";
import { parseCsv, sheetsUrlToCsvUrl } from "../csvParser";
import { ExpenseFilters } from "../components/ExpenseFilters";
import { ExpenseList } from "../components/ExpenseList";
import { SummaryPanel } from "../components/SummaryPanel";
import { CreditPanel } from "../components/CreditPanel";
import { useExpensesStore } from "../store";
import { VacationPlanner } from "@/features/expenses/planning/components/VacationPlanner";
import { ScheduledExpensesTab } from "@/features/expenses/planning/components/ScheduledExpensesTab";
import type { AppData } from "../types";

const DEBOUNCE_MS = 1500;

const TABS = [
  { key: "gastos", label: "Gastos" },
  { key: "vacaciones", label: "Vacaciones" },
  { key: "programados", label: "Programados" },
];

export function ExpensesScreen() {
  const c = useColors();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("gastos");

  const {
    expenses,
    initialCreditDebt,
    creditCutDay,
    creditPayDay,
    getAppData,
    loadAppData,
    setExpenses,
  } = useExpensesStore();

  const [saving, setSaving] = useState(false);
  const [sheetsModalOpen, setSheetsModalOpen] = useState(false);
  const [sheetsUrl, setSheetsUrl] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from API on mount
  useEffect(() => {
    expensesApi
      .get()
      .then((data) => {
        if (data && "expenses" in data && Array.isArray((data as AppData).expenses)) {
          loadAppData(data as AppData);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-save debounced
  useEffect(() => {
    if (expenses.length === 0) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      expensesApi.put(getAppData()).catch(() => {});
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [expenses, initialCreditDebt, creditCutDay, creditPayDay]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await expensesApi.put(getAppData());
      toast.success("Guardado correctamente");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }, [getAppData]);

  const handleLoadSheets = useCallback(async () => {
    const csvUrl = sheetsUrlToCsvUrl(sheetsUrl.trim());
    if (!csvUrl) { toast.error("URL de Google Sheets inválida"); return; }
    try {
      const res = await fetch(csvUrl);
      const text = await res.text();
      const parsed = parseCsv(text);
      setExpenses(parsed);
      toast.success(`${parsed.length} gastos importados`);
      setSheetsModalOpen(false);
      setSheetsUrl("");
    } catch {
      toast.error("Error al cargar la hoja");
    }
  }, [sheetsUrl, setExpenses]);

  const handleLoadFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "text/csv", "text/plain"],
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const content = await FileSystem.readAsStringAsync(asset.uri);

      if (asset.name.endsWith(".json")) {
        const data = JSON.parse(content) as AppData;
        loadAppData(data);
        toast.success("Datos importados desde JSON");
      } else {
        const parsed = parseCsv(content);
        setExpenses(parsed);
        toast.success(`${parsed.length} gastos importados desde CSV`);
      }
    } catch {
      toast.error("Error al leer el archivo");
    }
  }, [loadAppData, setExpenses]);

  const gastosSaveActions =
    activeTab === "gastos"
      ? [
          { label: "Sheets", type: "secondary" as const, onClick: () => setSheetsModalOpen(true) },
          { label: "Archivo", type: "secondary" as const, onClick: handleLoadFile },
          { label: saving ? "Guardando…" : "Guardar", type: "primary" as const, onClick: handleSave },
        ]
      : [];

  const sidebarContent =
    activeTab === "gastos" ? (
      <>
        <SummaryPanel />
        <CreditPanel />
      </>
    ) : undefined;

  return (
    <>
      <FeatureShell
        title="Finanzas"
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabUrlKey="fin-view"
        saveActions={gastosSaveActions}
        filters={activeTab === "gastos" ? <ExpenseFilters /> : undefined}
        sidebarCards={sidebarContent}
      >
        {activeTab === "gastos" && <ExpenseList />}
        {activeTab === "vacaciones" && <VacationPlanner />}
        {activeTab === "programados" && <ScheduledExpensesTab />}
      </FeatureShell>

      {/* Google Sheets modal */}
      <Modal
        visible={sheetsModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSheetsModalOpen(false)}
      >
        <View style={styles.overlay}>
          <View style={[styles.modalCard, { backgroundColor: c.background, borderColor: c.border }]}>
            <Text style={[styles.modalTitle, { color: c.text }]}>
              Importar desde Google Sheets
            </Text>
            <TextInput
              style={[styles.modalInput, { color: c.text, borderColor: c.border }]}
              value={sheetsUrl}
              onChangeText={setSheetsUrl}
              placeholder="https://docs.google.com/spreadsheets/d/…"
              placeholderTextColor={c.textPlaceholder}
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <CustomButton variant="outline" size="sm" onPress={() => setSheetsModalOpen(false)}>
                Cancelar
              </CustomButton>
              <CustomButton variant="primary" size="sm" onPress={handleLoadSheets}>
                Cargar
              </CustomButton>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.md,
  },
  modalCard: {
    width: "100%",
    maxWidth: 480,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  modalTitle: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: "700" },
  modalInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: SPACING.sm },
});
