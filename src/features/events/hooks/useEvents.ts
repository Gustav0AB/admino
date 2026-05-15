import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery, useApiMutation } from "@/shared/api/useApiQuery";
import { mockEvents, mockBiometricLog } from "../mocks/events";
import type { CompetitionEvent, BiometricLog, LogBiometricsInput } from "../types";

const EVENTS_KEY = ["events"] as const;

export function useEvents() {
  return useApiQuery<CompetitionEvent[]>(EVENTS_KEY, "/api/events", mockEvents);
}

export function useLogBiometrics() {
  const qc = useQueryClient();
  return useApiMutation<BiometricLog, LogBiometricsInput>(
    "/api/events/biometrics",
    mockBiometricLog,
    { method: "POST" },
    { onSuccess: () => qc.invalidateQueries({ queryKey: EVENTS_KEY }) }
  );
}
