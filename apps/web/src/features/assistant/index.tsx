import { useMemo, useState } from "react";
import { Button, Card, Dropdown } from "@/shared/ui";
import { useAI, type AnalysisResult } from "@/shared/hooks/useAI";
import { useToast } from "@/shared/components/feedback/Toast";
import { useExpensesStore } from "@/features/expenses/store";
import { currentMonthName, currentYear } from "@/features/expenses/helpers";
import { useAssistantStore } from "./store";
import type { Frecuencia } from "@/features/expenses/types";

type Destino = "mes" | "fijos" | "descartar";

const DESTINO_OPTIONS = [
  { label: "Gastos del mes", value: "mes" },
  { label: "Gastos fijos", value: "fijos" },
  { label: "No agregar", value: "descartar" },
];

function parseDays(fecha?: string): number[] {
  const nums = (fecha ?? "").match(/\d{1,2}/g)?.map(Number).filter((n) => n >= 1 && n <= 31) ?? [];
  return nums.length > 0 ? nums : [1];
}

function mapFrecuencia(frecuencia?: string): Frecuencia {
  const f = (frecuencia ?? "").toLowerCase();
  if (f.includes("quin")) return "quincenal";
  if (f.includes("mes") || f.includes("mens")) return "mes";
  return "unico";
}

export function AssistantScreen() {
  const toast = useToast();
  const { rawNotes, notes, setRawNotes, saveNote, updateNote, removeNote } = useAssistantStore();
  const [instruction, setInstruction] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [destinos, setDestinos] = useState<Record<number, Destino>>({});
  const { analyzeNotes, loading, error } = useAI();
  const { addExpenseFromModal, addRecurringExpense } = useExpensesStore();

  const gastos = analysis?.categories.gastos ?? [];

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
      setDestinos(Object.fromEntries((result.categories.gastos ?? []).map((_, i) => [i, "mes" as Destino])));
    }
  }

  const toAddCount = useMemo(
    () => gastos.filter((_, i) => (destinos[i] ?? "mes") !== "descartar").length,
    [gastos, destinos],
  );

  function handleApply() {
    let added = 0;
    gastos.forEach((g, i) => {
      const destino = destinos[i] ?? "mes";
      if (destino === "descartar") return;
      const monto = Number(g.monto) || 0;
      if (destino === "mes") {
        addExpenseFromModal({
          mes: currentMonthName(),
          año: currentYear(),
          gastos: g.item,
          monto,
          metodoPago: "efectivo",
          frecuencia: mapFrecuencia(g.frecuencia),
          fecha: parseDays(g.fecha)[0]!,
          fechaMaxima: "",
          estado: "no pagado",
        });
      } else {
        addRecurringExpense({
          title: g.item,
          amount: monto,
          days: parseDays(g.fecha),
          category: "basico",
          metodoPago: "efectivo",
          schedulingType: "monthly",
        });
      }
      added++;
    });
    toast.success(added > 0 ? `${added} gasto${added === 1 ? "" : "s"} agregado${added === 1 ? "" : "s"}` : "Nada que agregar");
    setAnalysis(null);
    setDestinos({});
  }

  return (
    <div className="page feature-page">
      <header className="feature-header">
        <div>
          <p className="eyebrow">Captura</p>
          <h1 className="page-title">Notas</h1>
        </div>
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
                        <p className="text-xs text-gray-500">{g.frecuencia}{g.fecha ? ` · ${g.fecha}` : ""}</p>
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
