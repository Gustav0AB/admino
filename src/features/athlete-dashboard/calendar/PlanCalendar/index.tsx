import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import {
  mockCalendarPlans, mockCalendarEvents, getWeeksForRange, defaultWeeks,
  calcTotalWeeks, weeksToNextEvent, buildPlanHtml, toIso, isoToLocalDate,
} from "./calendarUtils";
import { Toolbar } from "./Toolbar";
import { WeeklyGrid } from "./WeeklyGrid";
import { AddEventModal } from "./AddEventModal";
import { CellEditModal } from "./CellEditModal";
import { useColors } from "@/shared/hooks/useColors";
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from "@/shared/theme/tokens";
import type { CalendarPlan, CalendarEvent } from "./types";
import type { EditMode } from "./Toolbar";

const PAGE_SIZE = 4;

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatCellLabel(dateIso: string): string {
  const d = isoToLocalDate(dateIso);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function PlanCalendar() {
  const c = useColors();
  const [plans, setPlans] = useState<CalendarPlan[]>(mockCalendarPlans);
  const [events, setEvents] = useState<CalendarEvent[]>(mockCalendarEvents);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<EditMode>("view");
  const [draftPlan, setDraftPlan] = useState<CalendarPlan | null>(null);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [cellModalDateIso, setCellModalDateIso] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null;
  const activePlan = editMode !== "view" ? draftPlan : selectedPlan;

  const draftName = draftPlan?.name ?? "";
  const draftStartDate = draftPlan?.startDate ?? "";
  const draftEndDate = draftPlan?.endDate ?? "";

  const allWeeks = useMemo(() => {
    if (activePlan?.startDate && activePlan?.endDate) {
      return getWeeksForRange(activePlan.startDate, activePlan.endDate);
    }
    return defaultWeeks();
  }, [activePlan]);

  const totalPages = Math.ceil(allWeeks.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const visibleWeeks = allWeeks.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const cells: Record<string, string> = activePlan?.cells ?? {};

  const totalWeeks = useMemo(() => {
    if (draftPlan?.startDate && draftPlan?.endDate) return calcTotalWeeks(draftPlan.startDate, draftPlan.endDate);
    return null;
  }, [draftPlan]);

  const weeksToNext = useMemo(() => weeksToNextEvent(events), [events]);

  function handleSelectPlan(id: string | null) {
    setSelectedPlanId(id); setEditMode("view"); setDraftPlan(null); setPage(0);
  }

  function handleNewPlan() {
    const today = toIso(new Date());
    setDraftPlan({ id: `cp-${Date.now()}`, name: "", startDate: today, endDate: today, cells: {} });
    setEditMode("new"); setSelectedPlanId(null); setPage(0);
  }

  function handleDraftNameChange(v: string) {
    setDraftPlan((prev) => prev ? { ...prev, name: v } : prev);
  }
  function handleDraftStartChange(v: string) {
    setDraftPlan((prev) => prev ? { ...prev, startDate: v } : prev); setPage(0);
  }
  function handleDraftEndChange(v: string) {
    setDraftPlan((prev) => prev ? { ...prev, endDate: v } : prev);
  }

  function applyCellText(dateIso: string, text: string) {
    if (editMode === "view") {
      if (!selectedPlan) return;
      setDraftPlan({ ...selectedPlan, cells: { ...selectedPlan.cells, [dateIso]: text } });
      setEditMode("edit");
    } else {
      setDraftPlan((prev) => prev ? { ...prev, cells: { ...prev.cells, [dateIso]: text } } : prev);
    }
  }

  function handleCellChange(dateIso: string, text: string) { applyCellText(dateIso, text); }
  function handleCellOpenModal(dateIso: string) { setCellModalDateIso(dateIso); }
  function handleCellModalSave(text: string) { if (cellModalDateIso) applyCellText(cellModalDateIso, text); }

  function handleSave() {
    if (!draftPlan) return;
    if (editMode === "new") setPlans((prev) => [...prev, draftPlan]);
    else setPlans((prev) => prev.map((p) => (p.id === draftPlan.id ? draftPlan : p)));
    setSelectedPlanId(draftPlan.id); setEditMode("view"); setDraftPlan(null);
  }

  function handleAddEvent(event: CalendarEvent) { setEvents((prev) => [...prev, event]); }

  async function handleDownloadPdf() {
    if (!activePlan) return;
    try {
      const html = buildPlanHtml(activePlan, allWeeks, events);
      if (Platform.OS === "web") await Print.printAsync({ html });
      else {
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
      }
    } catch (e) { console.error("PDF export failed", e); }
  }

  const editable = editMode !== "view" || selectedPlanId !== null;

  return (
    <View style={styles.container}>
      <Toolbar
        plans={plans} selectedPlanId={selectedPlanId} editMode={editMode}
        draftName={draftName} draftStartDate={draftStartDate} draftEndDate={draftEndDate}
        totalWeeks={totalWeeks} weeksToNext={editMode !== "view" ? null : weeksToNext}
        onSelectPlan={handleSelectPlan} onNewPlan={handleNewPlan}
        onDraftNameChange={handleDraftNameChange} onDraftStartChange={handleDraftStartChange}
        onDraftEndChange={handleDraftEndChange} onSave={handleSave}
        onAddEvent={() => setAddEventOpen(true)} onDownloadPdf={handleDownloadPdf}
      />

      <WeeklyGrid
        weeks={visibleWeeks} cells={cells} events={events} editable={editable}
        planStartDate={activePlan?.startDate} planEndDate={activePlan?.endDate}
        onCellChange={handleCellChange} onCellOpenModal={handleCellOpenModal}
      />

      {totalPages > 1 && (
        <View style={[styles.pagination, { borderTopColor: c.border, backgroundColor: c.background }]}>
          <TouchableOpacity
            onPress={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            style={[styles.pageBtn, { borderColor: c.border, opacity: safePage === 0 ? 0.35 : 1 }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.pageBtnText, { color: c.text }]}>‹ Prev</Text>
          </TouchableOpacity>
          <View style={styles.pageInfo}>
            {Array.from({ length: totalPages }, (_, i) => (
              <TouchableOpacity
                key={i} onPress={() => setPage(i)} activeOpacity={0.7}
                style={[styles.pageDot, { backgroundColor: i === safePage ? c.primary : c.border, width: i === safePage ? 20 : 8 }]}
              />
            ))}
          </View>
          <TouchableOpacity
            onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage === totalPages - 1}
            style={[styles.pageBtn, { borderColor: c.border, opacity: safePage === totalPages - 1 ? 0.35 : 1 }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.pageBtnText, { color: c.text }]}>Next ›</Text>
          </TouchableOpacity>
        </View>
      )}

      <AddEventModal open={addEventOpen} onClose={() => setAddEventOpen(false)} onSave={handleAddEvent} />

      <CellEditModal
        open={cellModalDateIso !== null}
        dateLabel={cellModalDateIso ? formatCellLabel(cellModalDateIso) : ""}
        initialValue={cellModalDateIso ? (cells[cellModalDateIso] ?? "") : ""}
        onClose={() => setCellModalDateIso(null)}
        onSave={handleCellModalSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: "100%" },
  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderTopWidth: StyleSheet.hairlineWidth },
  pageBtn: { borderWidth: 1, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  pageBtnText: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "500" },
  pageInfo: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
  pageDot: { height: 8, borderRadius: 4 },
});
