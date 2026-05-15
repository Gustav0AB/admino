import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery, useApiMutation } from "@/shared/api/useApiQuery";
import {
  mockInjuries,
  mockLogInjuryResponse,
  mockMarkRecoveredResponse,
} from "../mocks/injuries";
import type { InjuryRecord, LogInjuryValues, RecoveryValues } from "../types";

const INJURIES_KEY = ["injuries"];

export function useInjuries(athleteId?: string) {
  const endpoint = athleteId
    ? `/api/injuries?athleteId=${athleteId}`
    : "/api/injuries";
  const mockData = athleteId
    ? mockInjuries.filter((i) => i.athleteId === athleteId)
    : mockInjuries;

  return useApiQuery<InjuryRecord[]>(
    athleteId ? [...INJURIES_KEY, athleteId] : INJURIES_KEY,
    endpoint,
    mockData
  );
}

export function useLogInjury() {
  const queryClient = useQueryClient();
  return useApiMutation<InjuryRecord, LogInjuryValues>(
    "/api/injuries",
    mockLogInjuryResponse,
    { method: "POST" },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: INJURIES_KEY });
      },
    }
  );
}

export function useMarkRecovered() {
  const queryClient = useQueryClient();
  return useApiMutation<InjuryRecord, { id: string } & RecoveryValues>(
    "/api/injuries/recover",
    mockMarkRecoveredResponse,
    { method: "PATCH" },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: INJURIES_KEY });
      },
    }
  );
}
