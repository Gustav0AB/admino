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
  onDayHeaderClick?: (weekdayJs: number, dayLabel: string) => void;
};

export function WeeklyGrid({ weeks, cells, events, editable, planStartDate, planEndDate, onCellOpenModal, onDayHeaderClick }: WeeklyGridProps) {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);
  const canPatternDays = editable && onDayHeaderClick;
  function handleHeaderClick(index: number) {
    setSelectedDayIdx(selectedDayIdx === index ? null : index);
    // Header index 0=Lun … 6=Dom → JS getDay() 1=Mon … 0=Sun
    if (canPatternDays) onDayHeaderClick((index + 1) % 7, DAY_HEADERS[index]!);
  }
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
          {DAY_HEADERS.map((day, index) => (
            <HeaderCell
              key={day}
              active={selectedDayIdx === index}
              onClick={canPatternDays ? () => handleHeaderClick(index) : undefined}
              title={canPatternDays ? `Aplicar a todos los ${day}` : undefined}
            >
              {day}
            </HeaderCell>
          ))}
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

function HeaderCell({ children, active, onClick, title }: { children: React.ReactNode; active?: boolean; onClick?: () => void; title?: string }) {
  const className = `calendar-header-cell ${active ? "calendar-header-active" : ""} ${onClick ? "calendar-header-clickable" : ""}`;
  if (onClick) return <button type="button" className={className} onClick={onClick} title={title}>{children}</button>;
  return <div className={className}>{children}</div>;
}
