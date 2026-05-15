import dayjs from "dayjs";

export function calcTotalWeeks(startDate: string, endDate: string): number {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const days = end.diff(start, "day");
  return Math.max(1, Math.ceil(days / 7));
}

export function getDayLabels(layoutType: "day-based" | "cycle-based", count: number): string[] {
  if (layoutType === "day-based") {
    const names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return names.slice(0, Math.min(count, 7));
  }
  return Array.from({ length: count }, (_, i) => `Day ${i + 1}`);
}

export function formatDate(dateStr: string): string {
  return dayjs(dateStr).format("MMM D, YYYY");
}

export function todayIso(): string {
  return dayjs().format("YYYY-MM-DD");
}

export function addWeeksIso(dateStr: string, weeks: number): string {
  return dayjs(dateStr).add(weeks, "week").format("YYYY-MM-DD");
}
