export type AlarmStatus =
  | "idle"
  | "scheduled"
  | "active"
  | "silenced_arrival"
  | "silenced_emergency"
  | "silenced_coach";

export type GymCoordinates = {
  latitude: number;
  longitude: number;
};

export type AthleteAlarmInfo = {
  athleteId: string;
  athleteName: string;
  status: AlarmStatus;
  triggeredAt: string | null;
};

export type EmergencyEvent = {
  athleteId: string;
  athleteName: string;
  timestamp: string;
};

export type StopAlarmEvent = {
  athleteId: string;
};
