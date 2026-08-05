import type { CalendarEvent, CalendarPlan, EventType, WeekRow } from "./types";

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Convierte fecha ISO a medianoche local para evitar desfases por zona horaria. */
export function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

/** Regresa el lunes de la semana de `date`. */
function getMonday(date: Date): Date {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function getWeeksForRange(startDate: string, endDate: string): WeekRow[] {
  const start = getMonday(isoToLocalDate(startDate));
  const end = isoToLocalDate(endDate);
  end.setHours(23, 59, 59, 0);

  const weeks: WeekRow[] = [];
  let cursor = new Date(start.getTime());
  let weekNum = 1;

  while (cursor <= end) {
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(cursor.getTime());
      d.setDate(cursor.getDate() + i);
      days.push(toIso(d));
    }

    const sunday = new Date(cursor.getTime());
    sunday.setDate(cursor.getDate() + 6);

    weeks.push({
      weekNum,
      days,
      range: `${cursor.getDate()} - ${sunday.getDate()}`,
      month: MONTHS_ES[cursor.getMonth()] ?? "",
    });

    cursor.setDate(cursor.getDate() + 7);
    weekNum++;
  }

  return weeks;
}

export function defaultWeeks(): WeekRow[] {
  const today = toIso(new Date());
  const end = new Date();
  end.setDate(end.getDate() + 12 * 7);
  return getWeeksForRange(today, toIso(end));
}

export function calcTotalWeeks(startDate: string, endDate: string): number {
  const diff = isoToLocalDate(endDate).getTime() - isoToLocalDate(startDate).getTime();
  return Math.max(1, Math.ceil(diff / (7 * 24 * 60 * 60 * 1000)));
}

export function weeksToNextEvent(events: CalendarEvent[], today = new Date()): number | null {
  const todayIso = toIso(today);
  const upcoming = events
    .filter((e) => e.date >= todayIso)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (upcoming.length === 0 || !upcoming[0]) return null;
  const diff = isoToLocalDate(upcoming[0].date).getTime() - today.getTime();
  return Math.max(1, Math.ceil(diff / (7 * 24 * 60 * 60 * 1000)));
}

export const EVENT_COLORS: Record<EventType, string> = {
  competition: "#dc2626",
  seminar: "#7c3aed",
  vacation: "#16a34a",
};

function eventColorHex(type: EventType): string {
  return EVENT_COLORS[type];
}

const DAY_NAMES_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export function buildPlanHtml(plan: CalendarPlan, weeks: WeekRow[], events: CalendarEvent[]): string {
  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    (acc[ev.date] ??= []).push(ev);
    return acc;
  }, {});

  const headerCells = DAY_NAMES_ES.map(
    (d) => `<th style="padding:8px 6px;background:#f4f4f5;font-size:11px;">${d}</th>`,
  ).join("");

  const dataRows = weeks.map((week) => {
    const weekLabel = `
      <td style="padding:8px;background:#f9f9f9;font-size:11px;vertical-align:top;
                 border:1px solid #e4e4e7;min-width:70px;white-space:nowrap;">
        <b>Semana ${week.weekNum}</b><br/>${week.range}<br/>${week.month}
      </td>`;

    const dayCells = week.days.map((iso) => {
      const text = (plan.cells[iso] ?? "").replace(/\n/g, "<br/>");
      const chips = (eventsByDate[iso] ?? [])
        .map((ev) => `<div style="background:${eventColorHex(ev.type)};color:#fff;
                border-radius:3px;padding:2px 5px;font-size:9px;
                margin-top:3px;">${ev.name}</div>`)
        .join("");
      return `<td style="padding:6px;border:1px solid #e4e4e7;font-size:11px;
                        vertical-align:top;min-width:90px;">${text}${chips}</td>`;
    }).join("");

    return `<tr>${weekLabel}${dayCells}</tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<style>
  body { font-family: Arial, sans-serif; padding: 20px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #e4e4e7; text-align: left; }
</style>
</head><body>
  <h2 style="margin-bottom:4px;">${plan.name}</h2>
  <p style="color:#71717a;font-size:12px;margin-bottom:16px;">
    ${plan.startDate} — ${plan.endDate} &nbsp;·&nbsp; ${weeks.length} semanas
  </p>
  <table>
    <thead>
      <tr>
        <th style="padding:8px 6px;background:#f4f4f5;font-size:11px;">Semana</th>
        ${headerCells}
      </tr>
    </thead>
    <tbody>${dataRows}</tbody>
  </table>
</body></html>`;
}

export const mockCalendarPlans: CalendarPlan[] = [
  {
    id: "cp-1",
    name: "Macrociclo Mayo–Julio",
    startDate: "2026-05-05",
    endDate: "2026-07-13",
    cells: {
      "2026-05-11": "Fuerza\n5x5 Squat",
      "2026-05-13": "Descanso",
      "2026-05-18": "Hipertrofia\nPress 4x10",
      "2026-05-20": "Cardio 30min",
    },
  },
];

export const mockCalendarEvents: CalendarEvent[] = [
  { id: "ev-1", name: "Campeonato Nacional", date: "2026-06-14", type: "competition" },
  { id: "ev-2", name: "Seminario Nutrición", date: "2026-05-31", type: "seminar" },
  { id: "ev-3", name: "Vacaciones", date: "2026-07-01", type: "vacation" },
];
