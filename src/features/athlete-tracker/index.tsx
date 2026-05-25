import { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, AppState, AppStateStatus,
} from "react-native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/shared/components/MainLayout";
import { useColors } from "@/shared/hooks/useColors";
import { useAuthStore } from "@/shared/store/authStore";
import { httpClient } from "@/shared/api/client";
import { ENV } from "@/shared/config/env";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import type { TrainingPlan, TrainingEvent } from "@/shared/types/member";
import {
  parseCellText, todayIso, formatSpanishDate, daysUntil, randomPhrase,
} from "./parseWorkout";

// ── Trote Timer ────────────────────────────────────────────────────────────────

type TimerPhase = "work" | "rest";

type TroteTimerProps = {
  totalMin: number;
  workMin: number | undefined;
  restMin: number | undefined;
};

function TroteTimer({ totalMin, workMin, restMin }: TroteTimerProps) {
  const c = useColors();
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
    const now = Date.now();
    const newElapsed = baseElapsedRef.current + Math.floor((now - startTimeRef.current) / 1000);
    setElapsed(Math.min(newElapsed, totalSec));

    if (hasIntervals && cycleSec > 0) {
      const cyclePos = newElapsed % cycleSec;
      if (cyclePos < workSec) {
        setPhase("work");
        setPhaseElapsed(cyclePos);
      } else {
        setPhase("rest");
        setPhaseElapsed(cyclePos - workSec);
      }
    }

    if (newElapsed >= totalSec) {
      setRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [totalSec, hasIntervals, cycleSec, workSec, restSec]);

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

  // Recover state after returning from background
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active" && running) tick();
    });
    return () => sub.remove();
  }, [running, tick]);

  function reset() {
    setRunning(false);
    setElapsed(0);
    setPhase("work");
    setPhaseElapsed(0);
    baseElapsedRef.current = 0;
    startTimeRef.current = null;
  }

  const elapsedMin = Math.floor(elapsed / 60);
  const done = elapsed >= totalSec;
  const phaseSec = phase === "work" ? workSec : restSec;
  const phaseRemaining = Math.max(phaseSec - phaseElapsed, 0);

  const phaseColor = phase === "work" ? "#22c55e" : "#3b82f6";
  const progressPct = totalSec > 0 ? (elapsed / totalSec) * 100 : 0;

  return (
    <View style={[styles.troteCard, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
      <View style={styles.troteHeader}>
        <Text style={[styles.troteTitle, { color: c.text }]}>🏃 Trote</Text>
        <Text style={[styles.troteProgress, { color: done ? "#22c55e" : c.primary }]}>
          {elapsedMin}min / {totalMin}min
        </Text>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressBar, { backgroundColor: c.border }]}>
        <View style={[styles.progressFill, { width: `${progressPct}%` as any, backgroundColor: done ? "#22c55e" : c.primary }]} />
      </View>

      {hasIntervals && !done && (
        <View style={[styles.phaseChip, { backgroundColor: phaseColor + "20" }]}>
          <Text style={[styles.phaseText, { color: phaseColor }]}>
            {phase === "work" ? `💪 Trabajo` : `😮‍💨 Descanso`}
            {" — "}{Math.floor(phaseRemaining / 60)}:{String(phaseRemaining % 60).padStart(2, "0")} restantes
          </Text>
        </View>
      )}

      {done ? (
        <View style={styles.troteActions}>
          <Text style={{ color: "#22c55e", fontWeight: "600" }}>✓ Completado</Text>
          <TouchableOpacity onPress={reset} style={[styles.timerBtn, { borderColor: c.border }]}>
            <Text style={{ color: c.textMuted, fontSize: TYPOGRAPHY.fontSize.sm }}>Reiniciar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.troteActions}>
          <TouchableOpacity
            style={[styles.timerBtn, { backgroundColor: running ? "#ef444420" : c.primary, borderColor: running ? "#ef4444" : c.primary }]}
            onPress={() => setRunning((v) => !v)}
          >
            <Text style={{ color: running ? "#ef4444" : "#fff", fontWeight: "600", fontSize: TYPOGRAPHY.fontSize.sm }}>
              {running ? "⏸ Pausar" : elapsed > 0 ? "▶ Continuar" : "▶ Iniciar"}
            </Text>
          </TouchableOpacity>
          {elapsed > 0 && (
            <TouchableOpacity onPress={reset} style={[styles.timerBtn, { borderColor: c.border }]}>
              <Text style={{ color: c.textMuted, fontSize: TYPOGRAPHY.fontSize.sm }}>↺ Reset</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ── Checklist item ─────────────────────────────────────────────────────────────

function CheckItem({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  const c = useColors();
  return (
    <TouchableOpacity style={styles.checkRow} onPress={onToggle} activeOpacity={0.7}>
      <View style={[styles.checkbox, { borderColor: checked ? c.primary : c.border, backgroundColor: checked ? c.primary : "transparent" }]}>
        {checked && <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>✓</Text>}
      </View>
      <Text style={[styles.checkLabel, { color: checked ? c.textMuted : c.text, textDecorationLine: checked ? "line-through" : "none" }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export function AthleteTrackerScreen() {
  const c = useColors();
  const user = useAuthStore((s) => s.user);
  const today = todayIso();
  const [phrase] = useState(() => randomPhrase());
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const { data: plan, isLoading } = useQuery<TrainingPlan | null>({
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
      await httpClient("/workout-checks", {
        method: "POST",
        body: { date: today, itemIndex: index, completed },
      });
    },
  });

  const { data: savedChecks = [] } = useQuery<{ itemIndex: number; completed: boolean }[]>({
    queryKey: ["workout-checks", today],
    queryFn: async () => {
      if (ENV.USE_MOCK) return [];
      const res = await httpClient<{ data: { itemIndex: number; completed: boolean }[] }>(
        `/workout-checks?date=${today}`
      );
      return res.data;
    },
    onSuccess: (data: { itemIndex: number; completed: boolean }[]) => {
      const map: Record<number, boolean> = {};
      data.forEach((c) => { map[c.itemIndex] = c.completed; });
      setChecked(map);
    },
  } as any);

  function handleToggle(index: number) {
    const newVal = !checked[index];
    setChecked((prev) => ({ ...prev, [index]: newVal }));
    toggleCheck.mutate({ index, completed: newVal });
  }

  const cellText = plan?.cells?.[today] ?? "";
  const workout = cellText ? parseCellText(cellText) : null;

  // Find next upcoming event
  const events: TrainingEvent[] = plan?.events ?? [];
  const nextEvent = events
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const daysTillEvent = nextEvent ? daysUntil(nextEvent.date) : null;

  if (isLoading) {
    return (
      <MainLayout scrollable={false} padding={false}>
        <View style={styles.center}>
          <ActivityIndicator color={c.primary} />
        </View>
      </MainLayout>
    );
  }

  if (!plan) {
    return (
      <MainLayout scrollable padding>
        <View style={styles.center}>
          <Text style={{ fontSize: 40 }}>🏋️</Text>
          <Text style={[styles.emptyTitle, { color: c.text }]}>Sin plan asignado</Text>
          <Text style={[styles.emptySubtitle, { color: c.textMuted }]}>
            Tu entrenador aún no te ha asignado un plan de entrenamiento.
          </Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout scrollable padding={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Welcome header */}
        <View style={[styles.welcomeCard, { backgroundColor: c.primary + "15", borderColor: c.primary + "30" }]}>
          <Text style={[styles.welcomeGreeting, { color: c.primary }]}>¡Bienvenido de vuelta! 👋</Text>
          <Text style={[styles.welcomeDate, { color: c.text }]}>
            {formatSpanishDate(today)} — hoy toca{" "}
            <Text style={{ fontWeight: "700" }}>{workout?.title || "descanso"}</Text>
          </Text>
          {nextEvent && daysTillEvent !== null && daysTillEvent >= 0 && (
            <Text style={[styles.eventCountdown, { color: c.textMuted }]}>
              Faltan {daysTillEvent === 0 ? "0 días (¡hoy!)" : `${daysTillEvent} día${daysTillEvent === 1 ? "" : "s"}`} para{" "}
              <Text style={{ fontWeight: "600" }}>{nextEvent.name}</Text>
            </Text>
          )}
          <Text style={[styles.phrase, { color: c.textMuted }]}>"{phrase}"</Text>
        </View>

        {!workout || !workout.title ? (
          <View style={[styles.restCard, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
            <Text style={{ fontSize: 32 }}>😴</Text>
            <Text style={[{ color: c.text, fontWeight: "600", fontSize: TYPOGRAPHY.fontSize.md }]}>
              Hoy es día de descanso
            </Text>
            <Text style={{ color: c.textMuted }}>Recupera y vuelve mañana más fuerte.</Text>
          </View>
        ) : (
          <>
            {/* Exercises checklist */}
            {workout.exercises.length > 0 && (
              <View style={[styles.section, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
                <Text style={[styles.sectionTitle, { color: c.text }]}>Ejercicios para hoy</Text>
                <View style={styles.checklist}>
                  {workout.exercises.map((ex, i) => (
                    <CheckItem
                      key={i}
                      label={ex}
                      checked={!!checked[i]}
                      onToggle={() => handleToggle(i)}
                    />
                  ))}
                </View>
                <Text style={[styles.checkProgress, { color: c.textMuted }]}>
                  {Object.values(checked).filter(Boolean).length} / {workout.exercises.length} completados
                </Text>
              </View>
            )}

            {/* Trote section */}
            <View style={[styles.section, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Cardio / Trote</Text>
              {workout.trote ? (
                <TroteTimer
                  totalMin={workout.trote.totalMin}
                  workMin={workout.trote.workMin}
                  restMin={workout.trote.restMin}
                />
              ) : (
                <Text style={{ color: c.textMuted, fontStyle: "italic" }}>Hoy no toca trote</Text>
              )}
            </View>

            {/* Nota */}
            <View style={[styles.section, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>📝 Instrucciones del entrenador</Text>
              <Text style={{ color: workout.nota ? c.text : c.textMuted, fontStyle: workout.nota ? "normal" : "italic", lineHeight: 22 }}>
                {workout.nota ?? "No hay instrucciones extras"}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.md, gap: SPACING.md, flexGrow: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: SPACING.xl, gap: SPACING.md },
  emptyTitle: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: "700", textAlign: "center" },
  emptySubtitle: { fontSize: TYPOGRAPHY.fontSize.sm, textAlign: "center", lineHeight: 22 },

  welcomeCard: { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.md, gap: SPACING.xs },
  welcomeGreeting: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: "700" },
  welcomeDate: { fontSize: TYPOGRAPHY.fontSize.md },
  eventCountdown: { fontSize: TYPOGRAPHY.fontSize.sm },
  phrase: { fontSize: TYPOGRAPHY.fontSize.sm, fontStyle: "italic", marginTop: SPACING.xs },

  restCard: { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.xl, alignItems: "center", gap: SPACING.sm },

  section: { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.md, gap: SPACING.sm },
  sectionTitle: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: "700" },

  checklist: { gap: 10 },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.sm },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 1 },
  checkLabel: { flex: 1, fontSize: TYPOGRAPHY.fontSize.sm, lineHeight: 22 },
  checkProgress: { fontSize: TYPOGRAPHY.fontSize.xs, textAlign: "right" },

  troteCard: { borderRadius: BORDER_RADIUS.md, borderWidth: 1, padding: SPACING.md, gap: SPACING.sm },
  troteHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  troteTitle: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: "700" },
  troteProgress: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: "700" },
  progressBar: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  phaseChip: { borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 6 },
  phaseText: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" },
  troteActions: { flexDirection: "row", gap: SPACING.sm, alignItems: "center" },
  timerBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
});
