import { PlanCalendar } from "./calendar/PlanCalendar";

export function AthleteDashboardScreen() {
  return (
    <div className="page feature-page">
      <header className="feature-header">
        <h1 className="page-title">Planes · Calendario</h1>
      </header>
      <div className="calendar-panel">
        <PlanCalendar />
      </div>
    </div>
  );
}
