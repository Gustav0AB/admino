import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  mockCalendarPlans, mockCalendarEvents, getWeeksForRange, defaultWeeks,
  calcTotalWeeks, weeksToNextEvent, buildPlanHtml, toIso, isoToLocalDate,
} from "./calendarUtils";
import { Toolbar } from "./Toolbar";
import { WeeklyGrid } from "./WeeklyGrid";
import { AddEventModal } from "./AddEventModal";
import { CellEditModal } from "./CellEditModal";
import { RepeatPatternModal } from "./RepeatPatternModal";
import { useColors } from "@/shared/hooks/useColors";
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from "@/shared/theme/tokens";
import { httpClient } from "@/shared/api/client";
import { ENV } from "@/shared/config/env";
import type { CalendarPlan, CalendarEvent } from "./types";
import type { EditMode } from "./Toolbar";

const PAGE_SIZE = 4;

const MONTH_NAMES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const JS_DAY_NAMES_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function formatCellLabel(dateIso: string): string {
  const d = isoToLocalDate(dateIso);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function PlanCalendar() {
  const c = useColors();
  const queryClient = useQueryClient();

  const { data: backendPlans = [] } = useQuery<CalendarPlan[]>({
    queryKey: ["training-plans"],
    queryFn: async () => {
      if (ENV.USE_MOCK) return mockCalendarPlans;
      const res = await httpClient<{ data: { id: string; name: string; startDate: string | null; endDate: string | null; cells: Record<string, string> }[] }>("/training-plans");
      return res.data.map((p) => ({ id: p.id, name: p.name, startDate: p.startDate ? p.startDate.slice(0, 10) : "", endDate: p.endDate ? p.endDate.slice(0, 10) : "", cells: p.cells }));
    },
  });

  const { data: backendEvents = [] } = useQuery<CalendarEvent[]>({
    queryKey: ["training-events"],
    queryFn: async () => {
      if (ENV.USE_MOCK) return mockCalendarEvents;
      const res = await httpClient<{ data: { id: string; name: string; date: string; type: string }[] }>("/training-events");
      return res.data.map((e) => ({ id: e.id, name: e.name, date: e.date.slice(0, 10), type: e.type as CalendarEvent["type"] }));
    },
  });

  const savePlanMutation = useMutation({
    mutationFn: async (draft: CalendarPlan & { isNew: boolean }) => {
      if (ENV.USE_MOCK) return draft;
      if (draft.isNew) {
        const res = await httpClient<{ data: { id: string } }>("/training-plans", {
          method: "POST",
          body: { name: draft.name, startDate: draft.startDate, endDate: draft.endDate, cells: draft.cells },
        });
        return { ...draft, id: res.data.id };
      } else {
        await httpClient(`/training-plans/${draft.id}`, {
          method: "PATCH",
          body: { name: draft.name, startDate: draft.startDate, endDate: draft.endDate, cells: draft.cells },
        });
        return draft;
      }
    },
    onSuccess: (saved) => {
      const { isNew, ...plan } = saved;
      queryClient.setQueryData<CalendarPlan[]>(["training-plans"], (old = []) => {
        if (isNew) return [...old, plan];
        return old.map((p) => (p.id === plan.id ? plan : p));
      });
      queryClient.invalidateQueries({ queryKey: ["training-plans"] });
    },
  });

  const addEventMutation = useMutation({
    mutationFn: async (event: Omit<CalendarEvent, "id">) => {
      if (ENV.USE_MOCK) return { ...event, id: `ev-${Date.now()}` };
      const res = await httpClient<{ data: { id: string } }>("/training-events", {
        method: "POST",
        body: { name: event.name, date: event.date, type: event.type },
      });
      return { ...event, id: res.data.id };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["training-events"] }),
  });

  const plans = backendPlans;
  const events = backendEvents;
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<EditMode>("view");
  const [draftPlan, setDraftPlan] = useState<CalendarPlan | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [repeatPatternOpen, setRepeatPatternOpen] = useState(false);
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
    setDraftPlan((prev) => prev ? { ...prev, name: v } : prev); setSaveError(null);
  }
  function handleDraftStartChange(v: string) {
    setDraftPlan((prev) => prev ? { ...prev, startDate: v } : prev); setPage(0); setSaveError(null);
  }
  function handleDraftEndChange(v: string) {
    setDraftPlan((prev) => prev ? { ...prev, endDate: v } : prev); setSaveError(null);
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

  function applyCellsBatch(datesToText: Record<string, string>) {
    if (editMode === "view") {
      if (!selectedPlan) return;
      setDraftPlan({ ...selectedPlan, cells: { ...selectedPlan.cells, ...datesToText } });
      setEditMode("edit");
    } else {
      setDraftPlan((prev) => (prev ? { ...prev, cells: { ...prev.cells, ...datesToText } } : prev));
    }
  }

  function handleCellOpenModal(dateIso: string) { setCellModalDateIso(dateIso); }

  function handleCellModalSave(text: string) {
    if (!cellModalDateIso) return;
    const dateIso = cellModalDateIso;
    applyCellText(dateIso, text);

    if (activePlan?.startDate && activePlan?.endDate) {
      const weekday = isoToLocalDate(dateIso).getDay();
      const sameWeekdayDates = allWeeks
        .flatMap((w) => w.days)
        .filter((d) => d !== dateIso && d >= activePlan.startDate! && d <= activePlan.endDate! && isoToLocalDate(d).getDay() === weekday);

      if (sameWeekdayDates.length > 0) {
        const dayName = JS_DAY_NAMES_ES[weekday];
        Alert.alert(
          "Aplicar a todo el plan",
          `¿Quieres agregar este entrenamiento para todos los ${dayName} del plan?`,
          [
            { text: "Solo este día", style: "cancel" },
            {
              text: "Aplicar a todos",
              onPress: () => {
                const batch: Record<string, string> = {};
                sameWeekdayDates.forEach((d) => { batch[d] = text; });
                applyCellsBatch(batch);
              },
            },
          ]
        );
      }
    }
  }

  function handleApplyPattern(templates: string[], startDateIso: string) {
    if (!activePlan?.endDate) return;
    const cursor = isoToLocalDate(startDateIso);
    const end = isoToLocalDate(activePlan.endDate);
    const batch: Record<string, string> = {};
    let i = 0;
    while (cursor <= end) {
      batch[toIso(cursor)] = templates[i % templates.length] ?? "";
      cursor.setDate(cursor.getDate() + 1);
      i++;
    }
    applyCellsBatch(batch);
  }

  function handleSave() {
    if (!draftPlan) return;
    if (!draftPlan.name.trim()) { setSaveError("El nombre del plan es obligatorio"); return; }
    if (!draftPlan.startDate) { setSaveError("La fecha de inicio es obligatoria"); return; }
    if (!draftPlan.endDate) { setSaveError("La fecha de fin es obligatoria"); return; }
    setSaveError(null);
    const isNew = editMode === "new";
    savePlanMutation.mutate({ ...draftPlan, isNew }, {
      onSuccess: (saved) => {
        setSelectedPlanId(saved.id); setEditMode("view"); setDraftPlan(null); setSaveError(null);
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : "Error al guardar el plan";
        setSaveError(msg);
      },
    });
  }

  function handleAddEvent(event: CalendarEvent) {
    addEventMutation.mutate({ name: event.name, date: event.date, type: event.type });
  }

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
        saveError={saveError} isSaving={savePlanMutation.isPending}
        showRepeatPattern={editable && !!activePlan?.startDate && !!activePlan?.endDate}
        onSelectPlan={handleSelectPlan} onNewPlan={handleNewPlan}
        onDraftNameChange={handleDraftNameChange} onDraftStartChange={handleDraftStartChange}
        onDraftEndChange={handleDraftEndChange} onSave={handleSave}
        onAddEvent={() => setAddEventOpen(true)} onOpenRepeatPattern={() => setRepeatPatternOpen(true)}
        onDownloadPdf={handleDownloadPdf}
      />

      <WeeklyGrid
        weeks={visibleWeeks} cells={cells} events={events} editable={editable}
        planStartDate={activePlan?.startDate} planEndDate={activePlan?.endDate}
        onCellOpenModal={handleCellOpenModal}
      />

      {totalPages > 1 && (
        <View style={[styles.pagination, { borderTopColor: c.border, backgroundColor: c.background }]}>
          <TouchableOpacity
            onPress={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            style={[styles.pageBtn, { borderColor: c.border, opacity: safePage === 0 ? 0.35 : 1 }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.pageBtnText, { color: c.text }]}>‹ Anterior</Text>
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
            <Text style={[styles.pageBtnText, { color: c.text }]}>Siguiente ›</Text>
          </TouchableOpacity>
        </View>
      )}

      <AddEventModal open={addEventOpen} onClose={() => setAddEventOpen(false)} onSave={handleAddEvent} />

      <RepeatPatternModal
        open={repeatPatternOpen}
        defaultStartDate={activePlan?.startDate || toIso(new Date())}
        onClose={() => setRepeatPatternOpen(false)}
        onSave={handleApplyPattern}
      />

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
