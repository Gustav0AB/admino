import { useState, useMemo } from "react";
import * as Print from "@/web/print";
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
  const [calModal, setCalModal] = useState<
    { kind: "cell"; dateIso: string } | { kind: "weekday"; weekdayJs: number } | null
  >(null);
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

  function handleCellOpenModal(dateIso: string) { setCalModal({ kind: "cell", dateIso }); }
  function handleDayHeaderClick(weekdayJs: number) { setCalModal({ kind: "weekday", weekdayJs }); }

  function datesForWeekday(weekdayJs: number): string[] {
    if (!activePlan?.startDate || !activePlan?.endDate) return [];
    const start = activePlan.startDate, end = activePlan.endDate;
    return allWeeks.flatMap((w) => w.days).filter((d) => d >= start && d <= end && isoToLocalDate(d).getDay() === weekdayJs);
  }

  function handleModalSave(text: string) {
    if (!calModal) return;
    if (calModal.kind === "cell") {
      applyCellText(calModal.dateIso, text);
      return;
    }
    const batch: Record<string, string> = {};
    datesForWeekday(calModal.weekdayJs).forEach((d) => { batch[d] = text; });
    if (Object.keys(batch).length > 0) applyCellsBatch(batch);
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
      await Print.printAsync({ html });
    } catch (e) { console.error("PDF export failed", e); }
  }

  const editable = editMode !== "view" || selectedPlanId !== null;

  return (
    <div className="plan-calendar">
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
        onCellOpenModal={handleCellOpenModal} onDayHeaderClick={handleDayHeaderClick}
      />

      {totalPages > 1 && (
        <div className="calendar-pagination">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="pager-button"
          >
            ‹ Anterior
          </button>
          <div className="pager-dots">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                className={`pager-dot ${i === safePage ? "pager-dot-active" : ""}`}
                aria-label={`Página ${i + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage === totalPages - 1}
            className="pager-button"
          >
            Siguiente ›
          </button>
        </div>
      )}

      <AddEventModal open={addEventOpen} onClose={() => setAddEventOpen(false)} onSave={handleAddEvent} />

      <RepeatPatternModal
        open={repeatPatternOpen}
        defaultStartDate={activePlan?.startDate || toIso(new Date())}
        onClose={() => setRepeatPatternOpen(false)}
        onSave={handleApplyPattern}
      />

      <CellEditModal
        open={calModal !== null}
        dateLabel={
          calModal?.kind === "cell"
            ? formatCellLabel(calModal.dateIso)
            : calModal?.kind === "weekday"
              ? `Todos los ${JS_DAY_NAMES_ES[calModal.weekdayJs]} · ${datesForWeekday(calModal.weekdayJs).length} días`
              : ""
        }
        initialValue={calModal?.kind === "cell" ? (cells[calModal.dateIso] ?? "") : ""}
        onClose={() => setCalModal(null)}
        onSave={handleModalSave}
      />
    </div>
  );
}
