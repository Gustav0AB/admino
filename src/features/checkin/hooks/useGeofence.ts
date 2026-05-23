import { useCallback } from "react";
import { Platform } from "react-native";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCheckinStore, GYM_LOCATION, GEOFENCE_RADIUS_M } from "../store/checkinStore";
import { GEOFENCE_TASK_NAME, INSIDE_GYM_KEY } from "../tasks/geofenceTask";

export function useGeofence() {
  const {
    locationPermission,
    setLocationPermission,
    setIsInsideGym,
  } = useCheckinStore();

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") {
      setLocationPermission("denied");
      return false;
    }

    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    if (fg !== Location.PermissionStatus.GRANTED) {
      setLocationPermission("denied");
      return false;
    }
    setLocationPermission("foreground");

    const { status: bg } = await Location.requestBackgroundPermissionsAsync();
    if (bg !== Location.PermissionStatus.GRANTED) {
      return true;
    }
    setLocationPermission("background");
    return true;
  }, [setLocationPermission]);

  const startGeofence = useCallback(async () => {
    if (Platform.OS === "web") return;

    const hasPermission = locationPermission === "background";
    if (!hasPermission) return;

    const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK_NAME);
    if (isRegistered) return;

    await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, [
      {
        latitude: GYM_LOCATION.latitude,
        longitude: GYM_LOCATION.longitude,
        radius: GEOFENCE_RADIUS_M,
        identifier: "gym",
        notifyOnEnter: true,
        notifyOnExit: true,
      },
    ]);
  }, [locationPermission]);

  const stopGeofence = useCallback(async () => {
    if (Platform.OS === "web") return;
    const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK_NAME);
    if (isRegistered) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
    }
  }, []);

  const syncInsideGymState = useCallback(async () => {
    if (Platform.OS === "web") return;
    const stored = await AsyncStorage.getItem(INSIDE_GYM_KEY);
    setIsInsideGym(stored === "true");
  }, [setIsInsideGym]);

  const checkCurrentPosition = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") return false;
    if (locationPermission === "undetermined" || locationPermission === "denied") {
      return false;
    }
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const dist = haversineMeters(
        pos.coords.latitude,
        pos.coords.longitude,
        GYM_LOCATION.latitude,
        GYM_LOCATION.longitude
      );
      const inside = dist <= GEOFENCE_RADIUS_M;
      setIsInsideGym(inside);
      await AsyncStorage.setItem(INSIDE_GYM_KEY, inside ? "true" : "false");
      return inside;
    } catch {
      return false;
    }
  }, [locationPermission, setIsInsideGym]);

  return {
    requestPermissions,
    startGeofence,
    stopGeofence,
    syncInsideGymState,
    checkCurrentPosition,
    locationPermission,
  };
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
