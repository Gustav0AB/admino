import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useTrackerStore } from "@/shared/store/trackerStore";
import { useAuthStore } from "@/shared/store/authStore";
import { ENV } from "@/shared/config/env";

export function useWorkoutSocket() {
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore((s) => s.token);
  const { updateWorkoutStatus, setWorkout, workout } = useTrackerStore();

  useEffect(() => {
    if (!token || ENV.USE_MOCK) return;

    const socket = io(ENV.API_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("plan:updated", (data: { workoutId: string; status: string; workout?: any }) => {
      if (workout && data.workoutId === workout.id) {
        if (data.workout) {
          setWorkout({ ...workout, ...data.workout, status: data.status as any });
        } else {
          updateWorkoutStatus(data.status as any);
        }
      }
    });

    socket.on("plan:assigned", (data: { workout: any }) => {
      if (data.workout) {
        setWorkout(data.workout);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);
}
