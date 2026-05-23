import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const GEOFENCE_TASK_NAME = "checkin-geofence-task";
const INSIDE_GYM_KEY = "@checkin/inside_gym";

TaskManager.defineTask(GEOFENCE_TASK_NAME, async ({ data, error }) => {
  if (error) return;

  const { eventType } = data as {
    eventType: Location.GeofencingEventType;
    region: Location.LocationRegion;
  };

  if (eventType === Location.GeofencingEventType.Enter) {
    await AsyncStorage.setItem(INSIDE_GYM_KEY, "true");
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "✅ You're at the gym!",
        body: "Your alarm has been cancelled. Time to train!",
        sound: true,
      },
      trigger: null,
    });
  }

  if (eventType === Location.GeofencingEventType.Exit) {
    await AsyncStorage.setItem(INSIDE_GYM_KEY, "false");
  }
});

export { INSIDE_GYM_KEY };
