import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { CustomSelect } from "@/shared/components/inputs/CustomSelect";
import { CustomInput } from "@/shared/components/inputs/CustomInput";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { CalendarPicker } from "@/shared/components/inputs/CalendarPicker";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { toIso, isoToLocalDate } from "./calendarUtils";
import type { CalendarPlan } from "./types";

export type EditMode = "view" | "new" | "edit";

type ToolbarProps = {
  plans: CalendarPlan[];
  selectedPlanId: string | null;
  editMode: EditMode;
  draftName: string;
  draftStartDate: string;
  draftEndDate: string;
  totalWeeks: number | null;
  weeksToNext: number | null;
  onSelectPlan: (id: string | null) => void;
  onNewPlan: () => void;
  onDraftNameChange: (v: string) => void;
  onDraftStartChange: (v: string) => void;
  onDraftEndChange: (v: string) => void;
  onSave: () => void;
  onAddEvent: () => void;
  onDownloadPdf: () => void;
};

export function Toolbar({
  plans, selectedPlanId, editMode, draftName, draftStartDate, draftEndDate,
  totalWeeks, weeksToNext,
  onSelectPlan, onNewPlan, onDraftNameChange, onDraftStartChange, onDraftEndChange,
  onSave, onAddEvent, onDownloadPdf,
}: ToolbarProps) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const planOptions = [
    { label: "No plan selected", value: "" },
    ...plans.map((p) => ({ label: p.name, value: p.id })),
  ];

  const showSave = editMode === "new" || editMode === "edit";
  const showPdf = !!selectedPlanId;
  const showForm = editMode === "new" || editMode === "edit";
  const showStats = showSave && (totalWeeks !== null || weeksToNext !== null);

  return (
    <View style={[styles.wrapper, { borderBottomColor: c.border, backgroundColor: c.background }]}>
      <View style={[styles.row, isMobile && styles.rowWrap]}>
        <View style={styles.selectorWrap}>
          <CustomSelect
            options={planOptions}
            value={selectedPlanId ?? ""}
            onChange={(v) => onSelectPlan(v ? String(v) : null)}
            placeholder="Select plan..."
            style={styles.selectorField}
          />
        </View>
        <View style={styles.btnGroup}>
          <CustomButton variant="outline" size="sm" onPress={onNewPlan}>+ New Plan</CustomButton>
          {showSave && (
            <CustomButton variant="primary" size="sm" onPress={onSave}>Save Plan</CustomButton>
          )}
          <CustomButton variant="outline" size="sm" onPress={onAddEvent}>+ Add Event</CustomButton>
          {showPdf && (
            <TouchableOpacity
              onPress={onDownloadPdf}
              style={[styles.pdfBtn, { borderColor: c.border, backgroundColor: c.backgroundStrong }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.pdfBtnText, { color: c.text }]}>⬇ PDF</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showForm && (
        <View style={[styles.row, isMobile && styles.rowWrap, styles.formRow]}>
          <CustomInput
            label="Plan name"
            value={draftName}
            onChangeText={onDraftNameChange}
            placeholder="e.g. Macrociclo Mayo"
            containerStyle={styles.nameField}
          />
          <CalendarPicker
            label="Start date"
            value={draftStartDate ? isoToLocalDate(draftStartDate) : null}
            onChange={(d) => onDraftStartChange(toIso(d))}
            placeholder="Start"
            style={styles.dateField}
          />
          <CalendarPicker
            label="End date"
            value={draftEndDate ? isoToLocalDate(draftEndDate) : null}
            onChange={(d) => onDraftEndChange(toIso(d))}
            placeholder="End"
            {...(draftStartDate ? { minimumDate: isoToLocalDate(draftStartDate) } : {})}
            style={styles.dateField}
          />
        </View>
      )}

      {showStats && (
        <View style={[styles.statsRow, { borderTopColor: c.border, backgroundColor: c.backgroundStrong }]}>
          {totalWeeks !== null && (
            <StatPill value={`${totalWeeks}`} label={totalWeeks === 1 ? "semana" : "semanas"} c={c} />
          )}
          {weeksToNext !== null && (
            <StatPill value={`${weeksToNext}`} label="sem. hasta próximo evento" c={c} />
          )}
        </View>
      )}
    </View>
  );
}

function StatPill({ value, label, c }: { value: string; label: string; c: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statValue, { color: c.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderBottomWidth: StyleSheet.hairlineWidth, gap: 0 },
  row: { flexDirection: "row", alignItems: "flex-end", gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  rowWrap: { flexWrap: "wrap" },
  formRow: { paddingTop: 0, paddingBottom: SPACING.sm, alignItems: "flex-start" },
  selectorWrap: { flex: 1, minWidth: 160, maxWidth: 280 },
  selectorField: { marginBottom: 0 },
  btnGroup: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, alignItems: "center" },
  pdfBtn: { borderWidth: 1, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs + 2 },
  pdfBtnText: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "500" },
  nameField: { flex: 2, minWidth: 160, marginBottom: 0 },
  dateField: { flex: 1, minWidth: 130, marginBottom: 0 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderTopWidth: StyleSheet.hairlineWidth },
  statPill: { flexDirection: "row", alignItems: "baseline", gap: SPACING.xs },
  statValue: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: "700" },
  statLabel: { fontSize: TYPOGRAPHY.fontSize.sm },
});
