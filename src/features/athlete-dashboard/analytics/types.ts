export type HeatmapDay = {
  date: string;
  volume: number;
  workoutCount: number;
};

export type WorkoutExerciseLog = {
  name: string;
  sets: number;
  reps: number;
  weight: number;
  unit: "kg" | "lbs";
};

export type WorkoutLog = {
  date: string;
  title: string;
  totalVolume: number;
  duration: number;
  exercises: WorkoutExerciseLog[];
};

export type HeatmapData = {
  days: HeatmapDay[];
  maxVolume: number;
};
