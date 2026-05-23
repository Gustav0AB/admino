import { useApiQuery } from "@/shared/api/useApiQuery";
import { mockHeatmapData, mockWorkoutLogs } from "../mocks/heatmap";
import type { HeatmapData, WorkoutLog } from "../types";

export function useHeatmapData() {
  return useApiQuery<HeatmapData>(
    ["analytics", "heatmap"],
    "/api/analytics/heatmap",
    mockHeatmapData
  );
}

export function useWorkoutLog(date: string | null) {
  return useApiQuery<WorkoutLog | null>(
    ["analytics", "workout-log", date],
    `/api/analytics/workout-log/${date}`,
    date ? (mockWorkoutLogs[date] ?? null) : null,
    { enabled: date !== null }
  );
}
