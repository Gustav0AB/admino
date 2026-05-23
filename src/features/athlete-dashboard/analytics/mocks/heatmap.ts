import type { HeatmapData, WorkoutLog } from "../types";
import dayjs from "dayjs";

function seedRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return ((s >>> 0) / 0xffffffff);
  };
}

function generateMockDays(): HeatmapData["days"] {
  const rand = seedRandom(42);
  const days = [];
  const end = dayjs();
  const start = end.subtract(364, "day");

  for (let d = start; !d.isAfter(end); d = d.add(1, "day")) {
    const r = rand();
    const hasWorkout = r > 0.35;
    const volume = hasWorkout ? Math.round(rand() * 18000 + 2000) : 0;
    const count = hasWorkout ? Math.ceil(rand() * 3) : 0;
    days.push({ date: d.format("YYYY-MM-DD"), volume, workoutCount: count });
  }
  return days;
}

const days = generateMockDays();
const maxVolume = Math.max(...days.map((d) => d.volume));

export const mockHeatmapData: HeatmapData = { days, maxVolume };

export const mockWorkoutLogs: Record<string, WorkoutLog> = Object.fromEntries(
  days
    .filter((d) => d.volume > 0)
    .map((d) => {
      const rand = seedRandom(d.date.split("-").join("").charCodeAt(0) * 7 + 13);
      return [
        d.date,
        {
          date: d.date,
          title: (["Upper Body Power", "Lower Body Strength", "Full Body HIIT", "Pull Day"][
            Math.floor(rand() * 4)
          ] as string | undefined) ?? "Workout",
          totalVolume: d.volume,
          duration: Math.round(rand() * 60 + 30),
          exercises: [
            { name: "Squat", sets: 4, reps: 5, weight: Math.round(rand() * 60 + 60), unit: "kg" as const },
            { name: "Bench Press", sets: 3, reps: 8, weight: Math.round(rand() * 40 + 50), unit: "kg" as const },
            { name: "Deadlift", sets: 3, reps: 5, weight: Math.round(rand() * 80 + 80), unit: "kg" as const },
          ].slice(0, Math.ceil(rand() * 3)),
        },
      ];
    })
);
