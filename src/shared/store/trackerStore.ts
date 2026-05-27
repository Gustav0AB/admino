import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export type WorkoutStatus = "pending" | "in_progress" | "completed" | "modified";

export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  notes?: string;
};

export type WorkoutOfDay = {
  id: string;
  title: string;
  date: string;
  description?: string;
  exercises: Exercise[];
  status: WorkoutStatus;
};

type TrackerState = {
  workout: WorkoutOfDay | null;
  streak: number;
  lastCompletedDate: string | null;
  evidenceUris: string[];
  rpe: number | null;
  feedbackNotes: string;
  setWorkout: (workout: WorkoutOfDay) => void;
  updateWorkoutStatus: (status: WorkoutStatus) => void;
  completeWorkout: () => void;
  addEvidenceUri: (uri: string) => void;
  removeEvidenceUri: (uri: string) => void;
  setRpe: (rpe: number) => void;
  setFeedbackNotes: (notes: string) => void;
  resetFeedback: () => void;
  reset: () => void;
};

const storage = createJSONStorage(() =>
  Platform.OS === "web" ? localStorage : AsyncStorage
);

const today = () => new Date().toISOString().split("T")[0];

export const useTrackerStore = create<TrackerState>()(
  persist(
    (set, get) => ({
      workout: null,
      streak: 0,
      lastCompletedDate: null,
      evidenceUris: [],
      rpe: null,
      feedbackNotes: "",

      setWorkout: (workout) => set({ workout }),

      updateWorkoutStatus: (status) =>
        set((state) => ({
          workout: state.workout ? { ...state.workout, status } : null,
        })),

      completeWorkout: () =>
        set((state) => {
          const todayStr = today();
          const last = state.lastCompletedDate;
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split("T")[0];

          const newStreak =
            last === todayStr
              ? state.streak
              : last === yesterdayStr
              ? state.streak + 1
              : 1;

          return {
            workout: state.workout
              ? { ...state.workout, status: "completed" }
              : null,
            streak: newStreak,
            lastCompletedDate: todayStr,
          };
        }),

      addEvidenceUri: (uri) =>
        set((state) => ({ evidenceUris: [...state.evidenceUris, uri] })),

      removeEvidenceUri: (uri) =>
        set((state) => ({
          evidenceUris: state.evidenceUris.filter((u) => u !== uri),
        })),

      setRpe: (rpe) => set({ rpe }),
      setFeedbackNotes: (notes) => set({ feedbackNotes: notes }),
      resetFeedback: () => set({ rpe: null, feedbackNotes: "" }),
      reset: () => set({ workout: null, streak: 0, lastCompletedDate: null, evidenceUris: [], rpe: null, feedbackNotes: "" }),
    }),
    {
      name: "tracker-storage",
      storage,
      partialize: (state) => ({
        streak: state.streak,
        lastCompletedDate: state.lastCompletedDate,
      }),
    }
  )
);
