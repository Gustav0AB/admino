import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery, useApiMutation } from "@/shared/api/useApiQuery";
import {
  mockTrainingPlans,
  mockCreatePlanResponse,
  mockClonePlanResponse,
} from "../mocks/trainingPlans";
import type { TrainingPlan, CreatePlanValues, ClonePlanInput } from "../types";

const PLANS_KEY = ["training-plans"] as const;

export function useTrainingPlans() {
  return useApiQuery<TrainingPlan[]>(
    PLANS_KEY,
    "/api/training-plans",
    mockTrainingPlans
  );
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useApiMutation<TrainingPlan, CreatePlanValues>(
    "/api/training-plans",
    mockCreatePlanResponse,
    { method: "POST" },
    {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: PLANS_KEY });
      },
    }
  );
}

export function useClonePlan() {
  const qc = useQueryClient();
  return useApiMutation<TrainingPlan, ClonePlanInput>(
    "/api/training-plans/clone",
    mockClonePlanResponse,
    { method: "POST" },
    {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: PLANS_KEY });
      },
    }
  );
}
