import dayjs from "dayjs";
import type { HeatmapDay } from "../types";

export type GridCell = {
  date: string;
  volume: number;
  workoutCount: number;
  dayOfWeek: number;
  isCurrentMonth?: boolean;
};

export type WeekColumn = GridCell[];

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const full = clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function intensityColor(
  volume: number,
  maxVolume: number,
  primaryHex: string,
  emptyHex: string
): string {
  if (volume === 0 || maxVolume === 0) return emptyHex;
  const ratio = Math.min(volume / maxVolume, 1);
  const stepped = ratio < 0.25 ? 0.2 : ratio < 0.5 ? 0.45 : ratio < 0.75 ? 0.7 : 1;
  const { r, g, b } = hexToRgb(primaryHex);
  const alpha = Math.round(stepped * 255).toString(16).padStart(2, "0");
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}${alpha}`;
}

export function buildWeekColumns(
  days: HeatmapDay[],
  windowDays: number
): WeekColumn[] {
  const end = dayjs().endOf("day");
  const start = end.subtract(windowDays - 1, "day").startOf("day");

  const dayMap = new Map(days.map((d) => [d.date, d]));

  const columns: WeekColumn[] = [];
  let current = start;
  const startDow = current.day();
  const leadingNulls = startDow === 0 ? 0 : startDow;

  let col: WeekColumn = [];
  for (let i = 0; i < leadingNulls; i++) {
    col.push({ date: "", volume: -1, workoutCount: 0, dayOfWeek: i });
  }

  while (!current.isAfter(end)) {
    const dateStr = current.format("YYYY-MM-DD");
    const data = dayMap.get(dateStr);
    col.push({
      date: dateStr,
      volume: data?.volume ?? 0,
      workoutCount: data?.workoutCount ?? 0,
      dayOfWeek: current.day(),
    });
    if (current.day() === 6) {
      columns.push(col);
      col = [];
    }
    current = current.add(1, "day");
  }
  if (col.length > 0) {
    while (col.length < 7) col.push({ date: "", volume: -1, workoutCount: 0, dayOfWeek: col.length });
    columns.push(col);
  }
  return columns;
}

export function getMonthLabels(
  columns: WeekColumn[]
): { label: string; colIndex: number }[] {
  const labels: { label: string; colIndex: number }[] = [];
  let lastMonth = "";
  columns.forEach((col, i) => {
    const firstReal = col.find((c) => c.date !== "");
    if (!firstReal) return;
    const month = dayjs(firstReal.date).format("MMM");
    if (month !== lastMonth) {
      labels.push({ label: month, colIndex: i });
      lastMonth = month;
    }
  });
  return labels;
}

export const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatDisplayDate(dateStr: string): string {
  return dayjs(dateStr).format("ddd, MMM D, YYYY");
}

export function totalVolumeFormatted(volume: number): string {
  return volume >= 1000 ? `${(volume / 1000).toFixed(1)}k` : String(volume);
}
