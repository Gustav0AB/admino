import { z } from "zod";

export type EventType = "competition" | "seminar" | "training_camp" | "clinic";
export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";
export type AthleteStatus = "fit" | "injured" | "questionable";

export type CompetitionEvent = {
  id: string;
  title: string;
  type: EventType;
  status: EventStatus;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  athleteCount: number;
  orgId: string;
};

export type BiometricLog = {
  id: string;
  eventId: string;
  athleteId: string;
  athleteName: string;
  weight: number;
  category: string;
  status: AthleteStatus;
  notes: string;
  loggedAt: string;
};

export type EventFilters = {
  eventType: EventType | "";
  fromDate: Date | null;
  toDate: Date | null;
};

export const biometricsSchema = z.object({
  athleteId: z.string().min(1, "Select an athlete"),
  weight: z.number({ invalid_type_error: "Enter a number" }).min(1, "Required").max(300, "Invalid"),
  category: z.string().min(1, "Select a category"),
  status: z.enum(["fit", "injured", "questionable"]),
  notes: z.string(),
});

export type BiometricsFormValues = z.infer<typeof biometricsSchema>;

export type LogBiometricsInput = BiometricsFormValues & { eventId: string };
