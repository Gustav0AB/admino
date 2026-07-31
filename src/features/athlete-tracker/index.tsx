import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, TextField } from "@generic/components";
import { httpClient } from "@/shared/api/client";
import { ENV } from "@/shared/config/env";
import { useAuthStore } from "@/shared/store/authStore";
import type { TrainingEvent, TrainingPlan } from "@/shared/types/member";
import { daysUntil, formatSpanishDate, parseCellText, randomPhrase, todayIso } from "./parseWorkout";
import { RpeSelector } from "./RpeSelector";

type WorkoutFeedback = { rpe: number | null; notes: string | null };
type TimerPhase = "work" | "rest";

function TroteTimer({ totalMin, workMin, restMin }: { totalMin: number; workMin?: number; restMin?: number }) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<TimerPhase>("work");
  const [phaseElapsed, setPhaseElapsed] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const baseElapsedRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasIntervals = workMin !== undefined && restMin !== undefined;
  const totalSec = totalMin * 60;
  const workSec = (workMin ?? 0) * 60;
  const restSec = (restMin ?? 0) * 60;
  const cycleSec = workSec + restSec;

  const tick = useCallback(() => {
    if (startTimeRef.current === null) return;
    const newElapsed = baseElapsedRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000);
    setElapsed(Math.min(newElapsed, totalSec));
    if (hasIntervals && cycleSec > 0) {
      const cyclePos = newElapsed % cycleSec;
      setPhase(cyclePos < workSec ? "work" : "rest");
      setPhaseElapsed(cyclePos < workSec ? cyclePos : cyclePos - workSec);
    }
    if (newElapsed >= totalSec) setRunning(false);
  }, [cycleSec, hasIntervals, totalSec, workSec]);

  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (startTimeRef.current !== null) {
        baseElapsedRef.current += Math.floor((Date.now() - startTimeRef.current) / 1000);
        startTimeRef.current = null;
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, tick]);

  function reset() {
    setRunning(false);
    setElapsed(0);
    setPhase("work");
    setPhaseElapsed(0);
    baseElapsedRef.current = 0;
    startTimeRef.current = null;
  }

  const done = elapsed >= totalSec;
  const phaseSec = phase === "work" ? workSec : restSec;
  const phaseRemaining = Math.max(phaseSec - phaseElapsed, 0);
  const progressPct = totalSec > 0 ? (elapsed / totalSec) * 100 : 0;
  const phaseColor = phase === "work" ? "#22c55e" : "#3b82f6";

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex justify-between gap-3">
        <p className="font-bold text-gray-900">🏃 Trote</p>
        <p className={`font-bold ${done ? "text-green-600" : "text-primary"}`}>{Math.floor(elapsed / 60)}min / {totalMin}min</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-200"><div className="h-full rounded-full" style={{ width: `${progressPct}%`, backgroundColor: done ? "#22c55e" : "#2563eb" }} /></div>
      {hasIntervals && !done && (
        <div className="rounded-md px-3 py-2 text-sm font-semibold" style={{ backgroundColor: `${phaseColor}22`, color: phaseColor }}>
          {phase === "work" ? "💪 Trabajo" : "😮‍💨 Descanso"} — {Math.floor(phaseRemaining / 60)}:{String(phaseRemaining % 60).padStart(2, "0")} restantes
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {done ? <span className="font-semibold text-green-600">✓ Completado</span> : <Button size="sm" variant={running ? "danger" : "primary"} onClick={() => setRunning((value) => !value)}>{running ? "⏸ Pausar" : elapsed > 0 ? "▶ Continuar" : "▶ Iniciar"}</Button>}
        {(elapsed > 0 || done) && <Button size="sm" variant="ghost" onClick={reset}>↺ Reset</Button>}
      </div>
    </Card>
  );
}

function CheckItem({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="grid grid-cols-[auto_1fr] gap-3 text-left" onClick={onToggle}>
      <span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-md border-2 ${checked ? "border-primary bg-primary text-white" : "border-gray-300"}`}>{checked ? "✓" : ""}</span>
      <span className={`text-sm leading-6 ${checked ? "text-gray-400 line-through" : "text-gray-900"}`}>{label}</span>
    </button>
  );
}

export function AthleteTrackerScreen() {
  const user = useAuthStore((state) => state.user);
  const today = todayIso();
  const [phrase] = useState(() => randomPhrase());
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [showDataForm, setShowDataForm] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? "");
  const [editPeso, setEditPeso] = useState("");
  const [rpe, setRpe] = useState<number | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const queryClient = useQueryClient();

  const updateSelf = useMutation({
    mutationFn: async (data: { name?: string; peso?: number | null }) => {
      if (ENV.USE_MOCK) return;
      await httpClient("/members/me", { method: "PATCH", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-training-plan"] });
      setShowDataForm(false);
    },
  });

  const { data: plan, isLoading, refetch, isFetching } = useQuery<TrainingPlan | null>({
    queryKey: ["my-training-plan"],
    queryFn: async () => {
      if (ENV.USE_MOCK) return null;
      const res = await httpClient<{ data: TrainingPlan | null }>("/training-plans/my-plan");
      return res.data;
    },
  });

  const toggleCheck = useMutation({
    mutationFn: async ({ index, completed }: { index: number; completed: boolean }) => {
      if (ENV.USE_MOCK) return;
      await httpClient("/workout-checks", { method: "POST", body: { date: today, itemIndex: index, completed } });
    },
    onError: (_error, { index, completed }) => {
      setChecked((prev) => ({ ...prev, [index]: !completed }));
      window.alert("No se pudo guardar el ejercicio. Intenta de nuevo.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workout-checks", today] }),
  });

  useQuery<{ itemIndex: number; completed: boolean }[]>({
    queryKey: ["workout-checks", today],
    queryFn: async () => {
      if (ENV.USE_MOCK) return [];
      const res = await httpClient<{ data: { itemIndex: number; completed: boolean }[] }>(`/workout-checks?date=${today}`);
      return res.data;
    },
    onSuccess: (data: { itemIndex: number; completed: boolean }[]) => {
      const map: Record<number, boolean> = {};
      data.forEach((item) => { map[item.itemIndex] = item.completed; });
      setChecked(map);
    },
  } as any);

  useQuery<WorkoutFeedback | null>({
    queryKey: ["workout-feedback", today],
    queryFn: async () => {
      if (ENV.USE_MOCK) return null;
      const res = await httpClient<{ data: WorkoutFeedback | null }>(`/workout-feedback?date=${today}`);
      return res.data;
    },
    onSuccess: (data: WorkoutFeedback | null) => {
      setRpe(data?.rpe ?? null);
      setFeedbackNotes(data?.notes ?? "");
    },
  } as any);

  const saveFeedback = useMutation({
    mutationFn: async () => {
      if (ENV.USE_MOCK) return;
      await httpClient("/workout-feedback", { method: "POST", body: { date: today, rpe, notes: feedbackNotes.trim() || null } });
    },
    onError: () => window.alert("No se pudo guardar. Intenta de nuevo."),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workout-feedback", today] }),
  });

  const cellText = plan?.cells?.[today] ?? "";
  const workout = cellText ? parseCellText(cellText) : null;
  const nextEvent: TrainingEvent | undefined = (plan?.events ?? [])
    .filter((event) => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  const daysTillEvent = nextEvent ? daysUntil(nextEvent.date) : null;

  function handleSaveSelf() {
    updateSelf.mutate({ name: editName.trim() || undefined, peso: editPeso ? Number(editPeso) : null });
  }

  function handleToggle(index: number) {
    const completed = !checked[index];
    setChecked((prev) => ({ ...prev, [index]: completed }));
    toggleCheck.mutate({ index, completed });
  }

  if (isLoading) return <div className="page empty-state">Cargando…</div>;

  if (!plan) {
    return (
      <div className="page empty-state">
        <p className="text-4xl">🏋️</p>
        <h2>Sin plan asignado</h2>
        <p>Tu entrenador aún no te ha asignado un plan de entrenamiento.</p>
      </div>
    );
  }

  return (
    <div className="page feature-page">
      <Card className="border-blue-100 bg-blue-50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-primary">¡Bienvenido de vuelta! 👋</p>
            <p className="text-gray-900">{formatSpanishDate(today)} — hoy toca <span className="font-bold">{workout?.title || "descanso"}</span></p>
            {nextEvent && daysTillEvent !== null && daysTillEvent >= 0 && (
              <p className="text-sm text-gray-500">Faltan {daysTillEvent === 0 ? "0 días (¡hoy!)" : `${daysTillEvent} día${daysTillEvent === 1 ? "" : "s"}`} para <span className="font-semibold">{nextEvent.name}</span></p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" disabled={isFetching} onClick={() => refetch()}>↺</Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowDataForm((value) => !value); setEditName(user?.name ?? ""); setEditPeso(""); }}>✎</Button>
          </div>
        </div>
        <p className="mt-2 text-sm italic text-gray-500">"{phrase}"</p>
      </Card>

      {showDataForm && (
        <Card>
          <div className="flex flex-col gap-3">
            <h2 className="font-bold text-gray-900">Mis datos</h2>
            <TextField label="Nombre" value={editName} onChange={(event) => setEditName(event.target.value)} placeholder="Tu nombre" />
            <TextField label="Peso (kg)" type="number" value={editPeso} onChange={(event) => setEditPeso(event.target.value)} placeholder="ej. 75.5" />
            <div className="flex gap-2">
              <Button size="sm" loading={updateSelf.isPending} loadingText="Guardando..." onClick={handleSaveSelf}>Guardar</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowDataForm(false)}>Cancelar</Button>
            </div>
          </div>
        </Card>
      )}

      {!workout?.title ? (
        <Card className="text-center">
          <p className="text-4xl">😴</p>
          <p className="font-semibold text-gray-900">Hoy es día de descanso</p>
          <p className="text-gray-500">Recupera y vuelve mañana más fuerte.</p>
        </Card>
      ) : (
        <>
          {workout.exercises.length > 0 && (
            <Card>
              <div className="flex flex-col gap-3">
                <h2 className="font-bold text-gray-900">Ejercicios para hoy</h2>
                {workout.exercises.map((exercise, index) => <CheckItem key={index} label={exercise} checked={!!checked[index]} onToggle={() => handleToggle(index)} />)}
                <p className="text-right text-xs text-gray-500">{Object.values(checked).filter(Boolean).length} / {workout.exercises.length} completados</p>
              </div>
            </Card>
          )}

          <Card>
            <div className="flex flex-col gap-3">
              <h2 className="font-bold text-gray-900">Cardio / Trote</h2>
              {workout.trote ? <TroteTimer totalMin={workout.trote.totalMin} workMin={workout.trote.workMin} restMin={workout.trote.restMin} /> : <p className="text-sm italic text-gray-500">Hoy no toca trote</p>}
            </div>
          </Card>

          <Card>
            <h2 className="font-bold text-gray-900">📝 Instrucciones del entrenador</h2>
            <p className={`mt-2 leading-6 ${workout.nota ? "text-gray-900" : "italic text-gray-500"}`}>{workout.nota ?? "No hay instrucciones extras"}</p>
          </Card>

          <Card>
            <div className="flex flex-col gap-3">
              <h2 className="font-bold text-gray-900">¿Cómo te sentiste?</h2>
              <RpeSelector value={rpe} onChange={setRpe} />
              <textarea
                className="min-h-20 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                value={feedbackNotes}
                onChange={(event) => setFeedbackNotes(event.target.value)}
                placeholder="¿Cómo se sintió el entrenamiento? ¿Algo que destacar?"
              />
              <Button size="sm" className="self-start" disabled={rpe === null || saveFeedback.isPending} loading={saveFeedback.isPending} loadingText="Guardando..." onClick={() => saveFeedback.mutate()}>Guardar</Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
