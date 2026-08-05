export type EventType = "competition" | "seminar" | "vacation";

export type CalendarEvent = {
  id: string;
  name: string;
  date: string; // "YYYY-MM-DD"
  type: EventType;
};

export type CalendarPlan = {
  id: string;
  name: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  cells: Record<string, string>;
};

export type WeekRow = {
  weekNum: number;
  days: string[]; // 7 ISO date strings, Mon → Sun
  range: string;
  month: string;
};
