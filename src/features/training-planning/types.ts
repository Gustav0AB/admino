import { z } from "zod";

export type LayoutType = "day-based" | "cycle-based";

export type ExerciseSet = {
  reps: number;
  weight: number;
  unit: "kg" | "lbs";
};

export type Exercise = {
  id: string;
  name: string;
  sets: ExerciseSet[];
  restSeconds: number;
  notes: string;
};

export type TrainingPlan = {
  id: string;
  name: string;
  description: string;
  orgId: string;
  athleteId: string | null;
  status: "active" | "draft" | "archived";
  layoutType: LayoutType;
  startDate: string;
  endDate: string;
  totalWeeks: number;
  exercises: Exercise[];
  createdAt: string;
  athleteCount: number;
};

export type ClonePlanInput = {
  planId: string;
  athleteId: string;
  startDate: string;
};

export const exerciseSetSchema = z.object({
  reps: z.number().min(1, "Min 1 rep"),
  weight: z.number().min(0, "Min 0"),
  unit: z.enum(["kg", "lbs"]),
});

export const exerciseSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Exercise name required"),
  sets: z.array(exerciseSetSchema).min(1, "Add at least one set"),
  restSeconds: z.number().min(0),
  notes: z.string(),
});

export const createPlanSchema = z
  .object({
    name: z.string().min(1, "Plan name required"),
    description: z.string(),
    layoutType: z.enum(["day-based", "cycle-based"]),
    startDate: z.string().min(1, "Start date required"),
    endDate: z.string().min(1, "End date required"),
    exercises: z.array(exerciseSchema).min(1, "Add at least one exercise"),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export const stepInfoSchema = z
  .object({
    name: z.string().min(1, "Plan name required"),
    description: z.string(),
    layoutType: z.enum(["day-based", "cycle-based"]),
    startDate: z.string().min(1, "Start date required"),
    endDate: z.string().min(1, "End date required"),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export const stepExercisesSchema = z.object({
  exercises: z.array(exerciseSchema).min(1, "Add at least one exercise"),
});

export type CreatePlanValues = z.infer<typeof createPlanSchema>;
export type StepInfoValues = z.infer<typeof stepInfoSchema>;
export type StepExercisesValues = z.infer<typeof stepExercisesSchema>;

export const clonePlanSchema = z.object({
  athleteId: z.string().min(1, "Select an athlete"),
  startDate: z.string().min(1, "Start date required"),
});

export type ClonePlanFormValues = z.infer<typeof clonePlanSchema>;
