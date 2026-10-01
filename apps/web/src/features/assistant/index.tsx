import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button, Card, Dropdown } from "@/shared/ui";
import { useAI, type AnalysisResult } from "@/shared/hooks/useAI";
import { useToast } from "@/shared/components/feedback/Toast";
import { useExpensesStore } from "@/features/expenses/store";
import { currentMonthName, currentYear } from "@/features/expenses/helpers";
import { expensesApi } from "@/features/expenses/api";
import { usePlanningStore } from "@/features/expenses/planning/store";
import { httpClient } from "@/shared/api/client";
import { ENV } from "@/shared/config/env";
import { routes } from "@/web/routes";
import { useAssistantStore } from "./store";
import type { Frecuencia, MetodoPago } from "@/features/expenses/types";
import type { CalendarEvent, CalendarPlan } from "@/features/athlete-dashboard/calendar/PlanCalendar/types";

type Destino = "mes" | "fijos" | "programados" | "descartar";

const DESTINO_OPTIONS = [
  { label: "Gastos del mes", value: "mes" },
  { label: "Gastos fijos", value: "fijos" },
  { label: "Programados", value: "programados" },
  { label: "No agregar", value: "descartar" },
];

function parseDays(fecha?: string): number[] {
  const isoDay = parseIsoDate(fecha)?.slice(-2);
  if (isoDay) return [Number(isoDay)];
  const nums = (fecha ?? "").match(/\d{1,2}/g)?.map(Number).filter((n) => n >= 1 && n <= 31) ?? [];
  return nums.length > 0 ? nums : [1];
}

function parseIsoDate(fecha?: string): string | null {
  return fecha?.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null;
}

function localDateIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function nextDateForDay(day: number): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + (day < today.getDate() ? 1 : 0);
  const lastDay = new Date(year, month + 1, 0).getDate();
  return localDateIso(new Date(year, month, Math.min(day, lastDay)));
}

function scheduledDateFor(fecha?: string): string {
  const iso = parseIsoDate(fecha);
  if (iso) return iso;
  const day = (fecha ?? "").match(/\d{1,2}/)?.[0];
  return day ? nextDateForDay(Number(day)) : localDateIso(new Date());
}

function mapFrecuencia(frecuencia?: string): Frecuencia {
  const f = (frecuencia ?? "").toLowerCase();
  if (f.includes("quin")) return "quincenal";
  if (f.includes("mes") || f.includes("mens")) return "mes";
  return "unico";
}

function mapMetodo(metodo?: string): MetodoPago {
  return (metodo ?? "").toLowerCase().includes("cred") ? "credito" : "efectivo";
}

function defaultDestino(instruction: string, fecha?: string): Destino {
  const text = instruction.toLowerCase();
  if (parseIsoDate(fecha)) return "programados";
  if (text.includes("program") || text.includes("venc")) return "programados";
  return text.includes("fij") || text.includes("recurrent") ? "fijos" : "mes";
}

function isCalendarEventType(type: string): type is CalendarEvent["type"] {
  return type === "competition" || type === "seminar" || type === "vacation";
}

function isIsoDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(new Date(`${date}T12:00:00`).getTime());
}

function inRange(date: string, start: string, end: string): boolean {
  return isIsoDate(date) && isIsoDate(start) && isIsoDate(end) && date >= start && date <= end;
}

export function AssistantScreen() {
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { rawNotes, notes, setRawNotes, saveNote, updateNote, removeNote } = useAssistantStore();
  const [instruction, setInstruction] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [destinos, setDestinos] = useState<Record<number, Destino>>({});
  const [savingPlan, setSavingPlan] = useState(false);
  const { analyzeNotes, loading, error } = useAI();
  const { addExpenseFromModal, addRecurringExpense } = useExpensesStore();
  const { addScheduledExpense } = usePlanningStore();

  const gastos = analysis?.categories.gastos ?? [];
  const athletePlan = analysis?.athletePlan;
  const validPlanDays = athletePlan?.days.filter((day) => day.date && day.text && inRange(day.date, athletePlan.startDate, athletePlan.endDate)) ?? [];
  const validPlanEvents = athletePlan?.events?.filter((event) => event.name && event.date && inRange(event.date, athletePlan.startDate, athletePlan.endDate) && isCalendarEventType(event.type)) ?? [];
  const skippedPlanDays = athletePlan ? Math.max(0, athletePlan.days.length - validPlanDays.length) : 0;
  const skippedPlanEvents = athletePlan ? Math.max(0, (athletePlan.events?.length ?? 0) - validPlanEvents.length) : 0;

  async function handleAnalyze() {
    if (!rawNotes.trim()) return;
    const cleanNotes = rawNotes.trim();
    const cleanInstruction = instruction.trim();
    const noteId = saveNote({ text: cleanNotes, instruction: cleanInstruction });
    const payload = cleanInstruction ? `Instrucción: ${cleanInstruction}\n\nNotas:\n${cleanNotes}` : cleanNotes;
    const result = await analyzeNotes(payload);
    if (result) {
      updateNote(noteId, { summary: result.summary });
      setAnalysis(result);
      setDestinos(Object.fromEntries((result.categories.gastos ?? []).map((g, i) => [i, defaultDestino(cleanInstruction, g.fecha)])));
    }
  }

  const toAddCount = useMemo(
    () => gastos.filter((_, i) => (destinos[i] ?? "mes") !== "descartar").length,
    [gastos, destinos],
  );

  async function handleApply() {
    let added = 0;
    let skipped = 0;
    gastos.forEach((g, i) => {
      const destino = destinos[i] ?? "mes";
      if (destino === "descartar") return;
      const monto = Number(g.monto) || 0;
      if (destino === "mes") {
        const title = g.descripcion ? `${g.item} - ${g.descripcion}` : g.item;
        const day = parseDays(g.fecha)[0]!;
        const exists = useExpensesStore.getState().expenses.some((expense) =>
          expense.mes === currentMonthName() &&
          (expense.año ?? currentYear()) === currentYear() &&
          expense.gastos === title &&
          expense.monto === monto &&
          expense.fecha === day
        );
        if (exists) { skipped++; return; }
        addExpenseFromModal({
          mes: currentMonthName(),
          año: currentYear(),
          gastos: title,
          monto,
          metodoPago: mapMetodo(g.metodoPago),
          frecuencia: mapFrecuencia(g.frecuencia),
          fecha: day,
          fechaMaxima: "",
          estado: "no pagado",
        });
      } else if (destino === "fijos") {
        const days = parseDays(g.fecha);
        let created = 0;
        const recurringExists = useExpensesStore.getState().recurringExpenses.some((expense) =>
          expense.title === g.item &&
          expense.amount === monto &&
          expense.days.join(",") === days.join(",")
        );
        if (!recurringExists) {
          addRecurringExpense({
            title: g.item,
            amount: monto,
            days,
            category: "basico",
            metodoPago: mapMetodo(g.metodoPago),
            schedulingType: "monthly",
          });
          created++;
        }
        for (const day of days) {
          const monthExpenseExists = useExpensesStore.getState().expenses.some((expense) =>
            expense.mes === currentMonthName() &&
            (expense.año ?? currentYear()) === currentYear() &&
            expense.gastos === g.item &&
            expense.monto === monto &&
            expense.fecha === day
          );
          if (monthExpenseExists) continue;
          addExpenseFromModal({
            mes: currentMonthName(),
            año: currentYear(),
            gastos: g.item,
            monto,
            metodoPago: mapMetodo(g.metodoPago),
            frecuencia: "mes",
            fecha: day,
            fechaMaxima: "",
            estado: "no pagado",
          });
          created++;
        }
        if (created === 0) skipped++;
        added += created;
        return;
      } else if (destino === "programados") {
        const scheduledDate = scheduledDateFor(g.fecha);
        const exists = usePlanningStore.getState().scheduledExpenses.some((expense) =>
          expense.status === "pending" &&
          expense.title === g.item &&
          expense.scheduledDate === scheduledDate &&
          expense.amount === monto
        );
        if (exists) { skipped++; return; }
        addScheduledExpense({
          title: g.item,
          scheduledDate,
          category: "other",
          amountKnown: monto > 0,
          amount: monto,
          notes: g.descripcion ?? "",
          status: "pending",
          paymentMethod: mapMetodo(g.metodoPago),
        });
      }
      added++;
    });
    if (added > 0) {
      try {
        await expensesApi.put(useExpensesStore.getState().getAppData());
      } catch {
        toast.error("Se agregó localmente, pero no se pudo guardar en finanzas");
        return;
      }
    }
    toast.success(added > 0 ? `${added} agregado${added === 1 ? "" : "s"}${skipped > 0 ? `, ${skipped} duplicado${skipped === 1 ? "" : "s"} omitido${skipped === 1 ? "" : "s"}` : ""}` : skipped > 0 ? `${skipped} duplicado${skipped === 1 ? "" : "s"} omitido${skipped === 1 ? "" : "s"}` : "Nada nuevo que agregar");
    setAnalysis(null);
    setDestinos({});
    setRawNotes("");
    if (added > 0) navigate(routes.expenses);
  }

  async function handleApplyPlan() {
    if (!athletePlan?.name || !athletePlan.startDate || !athletePlan.endDate || validPlanDays.length === 0) return;
    const existingPlan = queryClient.getQueryData<CalendarPlan[]>(["training-plans"])?.find((plan) =>
      plan.name === athletePlan.name &&
      plan.startDate === athletePlan.startDate &&
      plan.endDate === athletePlan.endDate
    );
    if (existingPlan) {
      toast.success("Ese plan ya existía");
      setAnalysis(null);
      setRawNotes("");
      navigate(routes.athleteDashboard, { state: { selectedPlanId: existingPlan.id } });
      return;
    }
    const plan: CalendarPlan = {
      id: `ai-${Date.now()}`,
      name: athletePlan.name,
      startDate: athletePlan.startDate,
      endDate: athletePlan.endDate,
      cells: Object.fromEntries(validPlanDays.map((d) => [d.date, d.text])),
    };
    setSavingPlan(true);
    try {
      let savedId = plan.id;
      const events = validPlanEvents;
      if (ENV.USE_MOCK) {
        queryClient.setQueryData<CalendarPlan[]>(["training-plans"], (old = []) => [plan, ...old]);
        queryClient.setQueryData<CalendarEvent[]>(["training-events"], (old = []) => [
          ...events.map((event, index) => ({ id: `ai-event-${Date.now()}-${index}`, name: event.name, date: event.date, type: event.type, planId: plan.id })),
          ...old,
        ]);
      } else {
        const res = await httpClient<{ data: { id: string } }>("/training-plans", {
          method: "POST",
          body: { name: plan.name, startDate: plan.startDate, endDate: plan.endDate, cells: plan.cells },
        });
        savedId = res.data.id;
        queryClient.setQueryData<CalendarPlan[]>(["training-plans"], (old = []) => [{ ...plan, id: savedId }, ...old]);
        await Promise.all(events.map((event) => httpClient("/training-events", {
          method: "POST",
          body: { name: event.name, date: event.date, type: event.type, planId: savedId },
        })));
        queryClient.invalidateQueries({ queryKey: ["training-events"] });
      }
      toast.success("Plan agregado al calendario");
      setAnalysis(null);
      setRawNotes("");
      navigate(routes.athleteDashboard, { state: { selectedPlanId: savedId } });
    } catch {
      toast.error("No se pudo agregar el plan");
    } finally {
      setSavingPlan(false);
    }
  }

  return (
    <div className="page feature-page">
      <header className="feature-header">
        <h1 className="page-title">Captura · Notas</h1>
      </header>

      <div className="feature-content assistant-content">
        <section className="assistant-input-panel">
          <Card>
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-gray-900">Notas en crudo</label>
              <p className="text-xs text-gray-500">Se guardan tal cual las escribes. Pídele a la IA que las organice o que agregue lo que detecte.</p>
              <textarea
                className="assistant-notes-input rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                value={rawNotes}
                onChange={(event) => setRawNotes(event.target.value)}
                placeholder={"Limpieza 600, quincena 15 y 30\nSpotify 239 al mes\nPagar tarjeta el 5\niPhone 16 quiero comprarlo..."}
              />
              <label className="text-sm font-semibold text-gray-900">Instrucción para la IA (opcional)</label>
              <textarea
                className="min-h-16 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                value={instruction}
                onChange={(event) => setInstruction(event.target.value)}
                placeholder={'Ej: "Agrega los siguientes gastos a mis gastos fijos"'}
              />
              {error && <div className="error-message">{error}</div>}
              <div className="flex justify-end">
                <Button size="sm" onClick={handleAnalyze} disabled={!rawNotes.trim() || loading}>
                  {loading ? "Analizando..." : "Analizar con IA"}
                </Button>
              </div>
            </div>
          </Card>
          {notes.length > 0 && (
            <Card>
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-gray-900">Notas guardadas</h3>
                <div className="saved-notes-list">
                  {notes.map((note) => (
                    <div key={note.id} className="saved-note">
                      <button type="button" className="saved-note-main" onClick={() => {
                        setRawNotes(note.text);
                        setInstruction(note.instruction);
                      }}>
                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                        <strong>{note.summary ?? note.text}</strong>
                      </button>
                      <Button variant="ghost" size="sm" onClick={() => removeNote(note.id)}>Eliminar</Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </section>

        <section className="assistant-results-panel">
          {analysis ? (
            <>
              <Card>
                <p className="analysis-summary">{analysis.summary}</p>
              </Card>

              {gastos.length > 0 && (
                <Card>
                  <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-gray-900">Gastos detectados</h3>
                    {gastos.map((g, i) => (
                      <div key={i} className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{g.item} · ${g.monto}</p>
                          <p className="text-xs text-gray-500">{g.frecuencia}{g.fecha ? ` · ${g.fecha}` : ""}{g.descripcion ? ` · ${g.descripcion}` : ""}</p>
                        </div>
                        <Dropdown
                          value={destinos[i] ?? "mes"}
                          options={DESTINO_OPTIONS}
                          onChange={(value) => setDestinos((current) => ({ ...current, [i]: value as Destino }))}
                        />
                      </div>
                    ))}
                    <div className="flex justify-end">
                      <Button size="sm" onClick={handleApply} disabled={toAddCount === 0}>
                        Agregar {toAddCount > 0 ? `(${toAddCount})` : ""}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {athletePlan && (
                <Card>
                  <div className="flex flex-col gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{athletePlan.name}</h3>
                      <p className="text-xs text-gray-500">{athletePlan.startDate} · {athletePlan.endDate} · {validPlanDays.length} días{validPlanEvents.length ? ` · ${validPlanEvents.length} evento${validPlanEvents.length === 1 ? "" : "s"}` : ""}</p>
                      {validPlanDays.length === 0 && <p className="mt-1 text-xs font-semibold text-red-600">Sin días válidos dentro del rango.</p>}
                      {(skippedPlanDays > 0 || skippedPlanEvents > 0) && <p className="mt-1 text-xs font-semibold text-amber-700">{skippedPlanDays + skippedPlanEvents} fuera de rango omitido{skippedPlanDays + skippedPlanEvents === 1 ? "" : "s"}.</p>}
                    </div>
                    <div className="assistant-plan-preview">
                      {validPlanDays.slice(0, 6).map((day) => (
                        <p key={day.date}><strong>{day.date}</strong><span>{day.text}</span></p>
                      ))}
                    </div>
                    <div className="flex justify-end">
                      <Button size="sm" loading={savingPlan} loadingText="Agregando..." onClick={handleApplyPlan} disabled={validPlanDays.length === 0}>
                        Agregar al calendario
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {(analysis.categories.tareas?.length || analysis.categories.recordatorios?.length || analysis.categories.deseos?.length) ? (
                <Card>
                  <div className="flex flex-col gap-3 text-sm">
                    {analysis.categories.tareas?.map((t, i) => <p key={`t${i}`}>{t.tarea}{t.fechaVencimiento ? ` · ${t.fechaVencimiento}` : ""} <span className={`priority priority-${t.prioridad}`}>{t.prioridad}</span></p>)}
                    {analysis.categories.recordatorios?.map((r, i) => <p key={`r${i}`}>{r.recordatorio} · {r.fecha}</p>)}
                    {analysis.categories.deseos?.map((d, i) => <p key={`d${i}`}>{d.deseo}{d.estimadoCosto ? ` · ~$${d.estimadoCosto}` : ""}</p>)}
                  </div>
                </Card>
              ) : null}

              {analysis.suggestions?.length > 0 && (
                <Card>
                  <h3 className="text-sm font-bold text-gray-900">Sugerencias</h3>
                  <ul className="suggestions-list">
                    {analysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <div className="empty-state">
                <h2>Sin análisis</h2>
                <p>Escribe notas y presiona analizar.</p>
              </div>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
