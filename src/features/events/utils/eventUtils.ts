import dayjs from "dayjs";
import type { CompetitionEvent, EventType } from "../types";

export const WEIGHT_CATEGORIES = [
  "-52kg", "-57kg", "-63kg", "-70kg", "-78kg", "+78kg",
  "-60kg", "-66kg", "-73kg", "-81kg", "-90kg", "-100kg", "+100kg",
];

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  competition: "#EF4444",
  seminar: "#3B82F6",
  training_camp: "#10B981",
  clinic: "#F59E0B",
};

export function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function eventsForDay(
  events: CompetitionEvent[],
  year: number,
  month: number,
  day: number
): CompetitionEvent[] {
  const target = dayjs(new Date(year, month, day)).startOf("day");
  return events.filter((e) => {
    const start = dayjs(e.startDate).startOf("day");
    const end = dayjs(e.endDate).startOf("day");
    return !target.isBefore(start) && !target.isAfter(end);
  });
}

export function formatEventDate(startDate: string, endDate: string): string {
  const s = dayjs(startDate);
  const e = dayjs(endDate);
  if (s.isSame(e, "day")) return s.format("MMM D, YYYY");
  if (s.isSame(e, "month")) return `${s.format("MMM D")}–${e.format("D, YYYY")}`;
  return `${s.format("MMM D")} – ${e.format("MMM D, YYYY")}`;
}

export function isToday(year: number, month: number, day: number): boolean {
  const now = new Date();
  return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
}
