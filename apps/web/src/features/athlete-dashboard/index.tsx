import { PlanCalendar } from "./calendar/PlanCalendar";

export function AthleteDashboardScreen() {
  return (
    <div className="page feature-page">
      <header className="feature-header">
        <div>
          <p className="eyebrow">Planes</p>
          <h1 className="page-title">Calendario</h1>
        </div>
      </header>
      <div className="calendar-panel">
        <PlanCalendar />
      </div>
    </div>
  );
}
