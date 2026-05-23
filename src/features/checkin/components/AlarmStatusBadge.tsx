import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Animated as RNAnimated } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, TYPOGRAPHY } from "@/shared/theme/tokens";
import type { AlarmStatus } from "../types";

const STATUS_CONFIG: Record<
  AlarmStatus,
  { label: string; bg: string; text: string; pulse: boolean }
> = {
  idle: { label: "No alarm set", bg: "#F4F4F5", text: "#71717A", pulse: false },
  scheduled: { label: "Alarm scheduled", bg: "#DBEAFE", text: "#1D4ED8", pulse: false },
  active: { label: "ALARM ACTIVE", bg: "#FEE2E2", text: "#DC2626", pulse: true },
  silenced_arrival: { label: "Arrived at gym ✓", bg: "#D1FAE5", text: "#065F46", pulse: false },
  silenced_emergency: { label: "Emergency — silenced", bg: "#FEF3C7", text: "#92400E", pulse: false },
  silenced_coach: { label: "Stopped by coach", bg: "#F3E8FF", text: "#6D28D9", pulse: false },
};

type AlarmStatusBadgeProps = {
  status: AlarmStatus;
};

export function AlarmStatusBadge({ status }: AlarmStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    if (!config.pulse) {
      pulseAnim.setValue(1);
      return;
    }
    const loop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
        RNAnimated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [config.pulse, pulseAnim]);

  return (
    <RNAnimated.View
      style={[
        styles.badge,
        { backgroundColor: config.bg, opacity: config.pulse ? pulseAnim : 1 },
      ]}
      accessibilityLabel={`Alarm status: ${config.label}`}
    >
      <Text style={[styles.label, { color: config.text }]}>{config.label}</Text>
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
