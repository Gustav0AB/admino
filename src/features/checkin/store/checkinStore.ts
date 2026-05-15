import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { AlarmStatus, AthleteAlarmInfo, GymCoordinates } from "../types";

const storage = createJSONStorage(() =>
  Platform.OS === "web" ? localStorage : AsyncStorage
);

export const GYM_LOCATION: GymCoordinates = {
  latitude: -23.5505,
  longitude: -46.6333,
};

export const GEOFENCE_RADIUS_M = 50;
export const ALARM_INTERVAL_SECONDS = 300;

export type CheckinState = {
  alarmStatus: AlarmStatus;
  notificationIds: string[];
  isInsideGym: boolean;
  trainingTimeISO: string | null;
  locationPermission: "undetermined" | "denied" | "foreground" | "background";
  athleteAlarms: AthleteAlarmInfo[];

  setAlarmStatus: (status: AlarmStatus) => void;
  addNotificationId: (id: string) => void;
  clearNotificationIds: () => void;
  setIsInsideGym: (inside: boolean) => void;
  setTrainingTime: (iso: string) => void;
  setLocationPermission: (p: CheckinState["locationPermission"]) => void;
  upsertAthleteAlarm: (info: AthleteAlarmInfo) => void;
  removeAthleteAlarm: (athleteId: string) => void;
};

export const useCheckinStore = create<CheckinState>()(
  persist(
    (set) => ({
      alarmStatus: "idle",
      notificationIds: [],
      isInsideGym: false,
      trainingTimeISO: null,
      locationPermission: "undetermined",
      athleteAlarms: [],

      setAlarmStatus: (alarmStatus) => set({ alarmStatus }),
      addNotificationId: (id) =>
        set((s) => ({ notificationIds: [...s.notificationIds, id] })),
      clearNotificationIds: () => set({ notificationIds: [] }),
      setIsInsideGym: (isInsideGym) => set({ isInsideGym }),
      setTrainingTime: (trainingTimeISO) => set({ trainingTimeISO }),
      setLocationPermission: (locationPermission) => set({ locationPermission }),
      upsertAthleteAlarm: (info) =>
        set((s) => {
          const existing = s.athleteAlarms.findIndex(
            (a) => a.athleteId === info.athleteId
          );
          const next = [...s.athleteAlarms];
          if (existing >= 0) next[existing] = info;
          else next.push(info);
          return { athleteAlarms: next };
        }),
      removeAthleteAlarm: (athleteId) =>
        set((s) => ({
          athleteAlarms: s.athleteAlarms.filter((a) => a.athleteId !== athleteId),
        })),
    }),
    {
      name: "checkin-storage",
      storage,
      partialize: (s) => ({
        alarmStatus: s.alarmStatus,
        notificationIds: s.notificationIds,
        isInsideGym: s.isInsideGym,
        trainingTimeISO: s.trainingTimeISO,
        locationPermission: s.locationPermission,
      }),
    }
  )
);
