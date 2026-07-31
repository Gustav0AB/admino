import { useState } from "react";
import { EVENT_COLORS } from "./calendarUtils";
import type { CalendarEvent, WeekRow } from "./types";

const DAY_HEADERS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

type WeeklyGridProps = {
  weeks: WeekRow[];
  cells: Record<string, string>;
  events: CalendarEvent[];
  editable: boolean;
  planStartDate?: string;
  planEndDate?: string;
  onCellOpenModal?: (dateIso: string) => void;
};

export function WeeklyGrid({ weeks, cells, events, editable, planStartDate, planEndDate, onCellOpenModal }: WeeklyGridProps) {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);
  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    (acc[event.date] ??= []).push(event);
    return acc;
  }, {});

  if (weeks.length === 0) {
    return <div className="calendar-empty">Selecciona un plan o crea uno para ver el calendario.</div>;
  }

  return (
    <div className="calendar-grid-scroll">
      <div className="calendar-grid">
        <div className="calendar-week-row calendar-week-header">
          <HeaderCell>Sem.</HeaderCell>
          {DAY_HEADERS.map((day, index) => <HeaderCell key={day} active={selectedDayIdx === index}>{day}</HeaderCell>)}
        </div>
        {weeks.map((week) => (
          <div key={week.weekNum} className="calendar-week-row">
            <div className="calendar-week-number">
              <span>{week.weekNum}</span>
              <small>{week.range}</small>
            </div>
            {week.days.map((dayIso, dayIdx) => {
              const outOfRange = (planStartDate != null && dayIso < planStartDate) || (planEndDate != null && dayIso > planEndDate);
              const canOpen = !outOfRange && editable && onCellOpenModal;
              const cellText = cells[dayIso] ?? "";
              return (
                <div key={dayIso} className={`calendar-day-cell ${outOfRange ? "calendar-day-muted" : ""} ${selectedDayIdx === dayIdx ? "calendar-day-active" : ""}`}>
                  <button type="button" className="calendar-day-button" onClick={() => canOpen ? onCellOpenModal(dayIso) : setSelectedDayIdx(selectedDayIdx === dayIdx ? null : dayIdx)}>
                    {cellText || (editable && !outOfRange ? <span>Toca para agregar...</span> : "")}
                  </button>
                  <div className="calendar-events">
                    {(eventsByDate[dayIso] ?? []).map((event) => (
                      <span key={event.id} className="calendar-event" style={{ backgroundColor: EVENT_COLORS[event.type] }}>{event.name}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function HeaderCell({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return <div className={`calendar-header-cell ${active ? "calendar-header-active" : ""}`}>{children}</div>;
}
