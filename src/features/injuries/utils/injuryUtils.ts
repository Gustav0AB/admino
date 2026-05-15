import type { Severity, InjuryStatus } from "../types";

export const SEVERITY_CONFIG: Record<Severity, { label: string; bg: string; text: string; dot: string }> = {
  mild: { label: "Mild", bg: "#FEF9C3", text: "#854D0E", dot: "#EAB308" },
  moderate: { label: "Moderate", bg: "#FFEDD5", text: "#9A3412", dot: "#F97316" },
  severe: { label: "Severe", bg: "#FEE2E2", text: "#991B1B", dot: "#DC2626" },
};

export const STATUS_CONFIG: Record<InjuryStatus, { bg: string; text: string }> = {
  active: { bg: "#FEE2E2", text: "#991B1B" },
  recovered: { bg: "#D1FAE5", text: "#065F46" },
};

export const BODY_PART_ICON: Record<string, string> = {
  shoulder: "🦾",
  knee: "🦵",
  ankle: "🦶",
  back: "🔙",
  hip: "🫁",
  wrist: "✋",
  neck: "🧣",
  hamstring: "🦵",
  quadriceps: "🦵",
  calf: "🦵",
  other: "🩹",
};
