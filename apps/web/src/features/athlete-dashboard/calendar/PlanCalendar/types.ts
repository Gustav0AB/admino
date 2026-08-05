export type EventType = "competition" | "seminar" | "vacation";

export type CalendarEvent = {
  id: string;
  name: string;
  date: string;
  type: EventType;
};

export type CalendarPlan = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  cells: Record<string, string>;
};

export type WeekRow = {
  weekNum: number;
  days: string[];
  range: string;
  month: string;
};
