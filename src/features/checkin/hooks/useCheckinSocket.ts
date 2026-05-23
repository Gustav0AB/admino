import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/shared/store/authStore";
import { ENV } from "@/shared/config/env";
import { useCheckinStore } from "../store/checkinStore";
import type { EmergencyEvent, StopAlarmEvent } from "../types";

export function useCheckinSocket(
  onAlarmStopped?: () => void,
  onEmergency?: (event: EmergencyEvent) => void
) {
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const { upsertAthleteAlarm, removeAthleteAlarm } = useCheckinStore();

  useEffect(() => {
    if (!token || ENV.USE_MOCK) return;

    const socket = io(ENV.API_URL, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("checkin:alarm-stopped", () => {
      onAlarmStopped?.();
    });

    socket.on("checkin:alarm-triggered", (data: EmergencyEvent) => {
      upsertAthleteAlarm({
        athleteId: data.athleteId,
        athleteName: data.athleteName,
        status: "active",
        triggeredAt: data.timestamp,
      });
      onEmergency?.(data);
    });

    socket.on("checkin:emergency", (data: EmergencyEvent) => {
      upsertAthleteAlarm({
        athleteId: data.athleteId,
        athleteName: data.athleteName,
        status: "silenced_emergency",
        triggeredAt: data.timestamp,
      });
      onEmergency?.(data);
    });

    socket.on("checkin:arrived", (data: { athleteId: string }) => {
      removeAthleteAlarm(data.athleteId);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const emitEmergency = useCallback(() => {
    if (!user) return;
    const event: EmergencyEvent = {
      athleteId: user.id,
      athleteName: user.name,
      timestamp: new Date().toISOString(),
    };
    if (socketRef.current?.connected) {
      socketRef.current.emit("checkin:emergency", event);
    }
  }, [user]);

  const emitStopAlarm = useCallback(
    (athleteId: string) => {
      const event: StopAlarmEvent = { athleteId };
      if (socketRef.current?.connected) {
        socketRef.current.emit("checkin:stop-alarm", event);
      }
      removeAthleteAlarm(athleteId);
    },
    [removeAthleteAlarm]
  );

  const emitAlarmTriggered = useCallback(() => {
    if (!user) return;
    const event: EmergencyEvent = {
      athleteId: user.id,
      athleteName: user.name,
      timestamp: new Date().toISOString(),
    };
    if (socketRef.current?.connected) {
      socketRef.current.emit("checkin:alarm-triggered", event);
    }
  }, [user]);

  return { emitEmergency, emitStopAlarm, emitAlarmTriggered };
}
