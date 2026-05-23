import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { useClientTheme } from "@/shared/theme/useClientTheme";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { useCheckinStore, GYM_LOCATION } from "../store/checkinStore";
import { useGeofence } from "../hooks/useGeofence";
import { useAlarmScheduler } from "../hooks/useAlarmScheduler";
import { useCheckinSocket } from "../hooks/useCheckinSocket";
import { AlarmStatusBadge } from "./AlarmStatusBadge";
import { PermissionGate } from "./PermissionGate";

const MOCK_TRAINING_OFFSET_MS = 5 * 1000;

export function AthleteAlarmView() {
  const c = useColors();
  const { primaryColor } = useClientTheme();
  const { locationPermission, isInsideGym, trainingTimeISO } = useCheckinStore();
  const { requestPermissions, startGeofence, checkCurrentPosition } = useGeofence();
  const { activateAlarm, cancelAlarm, scheduleAlarmForTime, alarmStatus } =
    useAlarmScheduler();
  const [emergencyConfirmVisible, setEmergencyConfirmVisible] = useState(false);

  const handleAlarmStopped = useCallback(() => {
    cancelAlarm("coach");
  }, [cancelAlarm]);

  const { emitEmergency, emitAlarmTriggered } = useCheckinSocket(handleAlarmStopped);

  useEffect(() => {
    if (locationPermission === "background") {
      startGeofence();
    }
  }, [locationPermission, startGeofence]);

  const handleSetupAlarm = useCallback(async () => {
    const trainingTime = new Date(Date.now() + MOCK_TRAINING_OFFSET_MS).toISOString();
    useCheckinStore.getState().setTrainingTime(trainingTime);
    const inside = await checkCurrentPosition();
    if (inside) {
      cancelAlarm("arrival");
      return;
    }
    await scheduleAlarmForTime(trainingTime);
    emitAlarmTriggered();
  }, [checkCurrentPosition, scheduleAlarmForTime, cancelAlarm, emitAlarmTriggered]);

  const handleEmergency = useCallback(() => {
    if (Platform.OS === "web") {
      emitEmergency();
      cancelAlarm("emergency");
      return;
    }
    Alert.alert(
      "Life Emergency",
      "This will stop your alarm and immediately alert your coach.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Emergency",
          style: "destructive",
          onPress: () => {
            emitEmergency();
            cancelAlarm("emergency");
          },
        },
      ]
    );
  }, [emitEmergency, cancelAlarm]);

  const isAlarmRunning = alarmStatus === "active" || alarmStatus === "scheduled";

  return (
    <View style={styles.container}>
      <View style={styles.statusSection}>
        <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Alarm Status</Text>
        <AlarmStatusBadge status={alarmStatus} />
      </View>

      <View style={[styles.gymCard, { borderColor: c.border, backgroundColor: c.backgroundStrong }]}>
        <View style={styles.gymRow}>
          <Text style={[styles.gymLabel, { color: c.textMuted }]}>Gym location</Text>
          <View
            style={[
              styles.gymDot,
              { backgroundColor: isInsideGym ? "#10B981" : c.border },
            ]}
          />
          <Text style={[styles.gymStatus, { color: isInsideGym ? "#10B981" : c.textMuted }]}>
            {isInsideGym ? "You're inside" : "Not at gym"}
          </Text>
        </View>
        <Text style={[styles.gymCoords, { color: c.textMuted }]}>
          {GYM_LOCATION.latitude.toFixed(4)}, {GYM_LOCATION.longitude.toFixed(4)} · 50m radius
        </Text>
      </View>

      {(locationPermission === "undetermined" || locationPermission === "denied" || locationPermission === "foreground") && (
        <PermissionGate
          permission={locationPermission}
          onRequest={requestPermissions}
        />
      )}

      {locationPermission === "background" && (
        <View style={styles.actions}>
          {!isAlarmRunning ? (
            <CustomButton
              variant="primary"
              size="lg"
              onPress={handleSetupAlarm}
              style={styles.mainBtn}
            >
              🔔 Activate Training Alarm
            </CustomButton>
          ) : (
            <View style={[styles.alarmActiveCard, { borderColor: "#FCA5A5", backgroundColor: "#FEF2F2" }]}>
              <Text style={[styles.alarmActiveTitle, { color: "#DC2626" }]}>
                Alarm is running
              </Text>
              <Text style={[styles.alarmActiveBody, { color: "#7F1D1D" }]}>
                Arrive at the gym or press the emergency button below.
                Your coach will be notified if you trigger an emergency.
              </Text>
            </View>
          )}
        </View>
      )}

      {isAlarmRunning && (
        <TouchableOpacity
          onPress={handleEmergency}
          style={styles.emergencyBtn}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Life Emergency — stop alarm and notify coach"
        >
          <Text style={styles.emergencyIcon}>🚨</Text>
          <Text style={styles.emergencyLabel}>LIFE EMERGENCY</Text>
          <Text style={styles.emergencyCaption}>
            Stops alarm · Alerts coach immediately
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.lg,
  },
  statusSection: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  gymCard: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  gymRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  gymLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    flex: 1,
  },
  gymDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  gymStatus: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
  },
  gymCoords: {
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  actions: {
    gap: SPACING.md,
  },
  mainBtn: {
    width: "100%",
  },
  alarmActiveCard: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  alarmActiveTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: "700",
  },
  alarmActiveBody: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
  },
  emergencyBtn: {
    backgroundColor: "#DC2626",
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    alignItems: "center",
    gap: SPACING.xs,
    elevation: 4,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  emergencyIcon: {
    fontSize: 36,
  },
  emergencyLabel: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  emergencyCaption: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: "#FCA5A5",
    textAlign: "center",
  },
});
