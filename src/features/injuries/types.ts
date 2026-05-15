import { z } from "zod";

export type Severity = "mild" | "moderate" | "severe";

export type BodyPart =
  | "shoulder"
  | "knee"
  | "ankle"
  | "back"
  | "hip"
  | "wrist"
  | "neck"
  | "hamstring"
  | "quadriceps"
  | "calf"
  | "other";

export type InjuryStatus = "active" | "recovered";

export type InjuryRecord = {
  id: string;
  athleteId: string;
  athleteName: string;
  bodyPart: BodyPart;
  severity: Severity;
  status: InjuryStatus;
  occurredAt: string;
  recoveredAt: string | null;
  notes: string;
};

export const logInjurySchema = z.object({
  athleteId: z.string().min(1, "Select an athlete"),
  bodyPart: z.enum([
    "shoulder", "knee", "ankle", "back", "hip",
    "wrist", "neck", "hamstring", "quadriceps", "calf", "other",
  ]),
  severity: z.enum(["mild", "moderate", "severe"]),
  occurredAt: z.string().min(1, "Injury date required"),
  notes: z.string(),
});

export type LogInjuryValues = z.infer<typeof logInjurySchema>;

export const recoverySchema = z.object({
  notes: z.string(),
  recoveredAt: z.string().min(1, "Recovery date required"),
});

export type RecoveryValues = z.infer<typeof recoverySchema>;
