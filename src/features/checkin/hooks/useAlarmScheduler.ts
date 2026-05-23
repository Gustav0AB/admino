import { useCallback, useEffect } from "react";
import { Platform, AppState } from "react-native";
import * as Notifications from "expo-notifications";
import { useCheckinStore, ALARM_INTERVAL_SECONDS } from "../store/checkinStore";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowCriticalAlerts: true,
    },
  });
  return status === "granted";
}

async function createAndroidChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("checkin-alarm", {
      name: "Training Alarm",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: "#EF4444",
      sound: "default",
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });
  }
}

export function useAlarmScheduler() {
  const {
    alarmStatus,
    notificationIds,
    setAlarmStatus,
    addNotificationId,
    clearNotificationIds,
  } = useCheckinStore();

  useEffect(() => {
    createAndroidChannel();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        Notifications.getBadgeCountAsync().then((count) => {
          if (count > 0) Notifications.setBadgeCountAsync(0);
        });
      }
    });
    return () => sub.remove();
  }, []);

  const activateAlarm = useCallback(async () => {
    if (Platform.OS === "web") return;
    const granted = await requestNotificationPermissions();
    if (!granted) return;

    await Notifications.cancelAllScheduledNotificationsAsync();
    clearNotificationIds();

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ Training time — you're not at the gym!",
        body: "Get moving! Your coach is expecting you.",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: { type: "checkin-alarm" },
        ...(Platform.OS === "android" ? { channelId: "checkin-alarm" } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: ALARM_INTERVAL_SECONDS,
        repeats: true,
      },
    });

    addNotificationId(id);
    setAlarmStatus("active");
  }, [setAlarmStatus, addNotificationId, clearNotificationIds]);

  const cancelAlarm = useCallback(
    async (reason: "arrival" | "emergency" | "coach") => {
      if (Platform.OS === "web") {
        setAlarmStatus(
          reason === "arrival"
            ? "silenced_arrival"
            : reason === "emergency"
            ? "silenced_emergency"
            : "silenced_coach"
        );
        clearNotificationIds();
        return;
      }

      for (const id of notificationIds) {
        await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
      }
      await Notifications.cancelAllScheduledNotificationsAsync();
      clearNotificationIds();

      setAlarmStatus(
        reason === "arrival"
          ? "silenced_arrival"
          : reason === "emergency"
          ? "silenced_emergency"
          : "silenced_coach"
      );
    },
    [notificationIds, setAlarmStatus, clearNotificationIds]
  );

  const scheduleAlarmForTime = useCallback(
    async (trainingTimeISO: string) => {
      if (Platform.OS === "web") return;
      const granted = await requestNotificationPermissions();
      if (!granted) return;

      const trainingDate = new Date(trainingTimeISO);
      const now = new Date();
      const msUntil = trainingDate.getTime() - now.getTime();

      if (msUntil <= 0) {
        await activateAlarm();
        return;
      }

      const reminderId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "🏋️ Training starts soon",
          body: "Make sure you're heading to the gym!",
          sound: true,
          data: { type: "checkin-reminder" },
          ...(Platform.OS === "android" ? { channelId: "checkin-alarm" } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: trainingDate,
        },
      });

      addNotificationId(reminderId);
      setAlarmStatus("scheduled");
    },
    [activateAlarm, addNotificationId, setAlarmStatus]
  );

  return { activateAlarm, cancelAlarm, scheduleAlarmForTime, alarmStatus };
}
